const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Tạo thư mục logs nếu chưa tồn tại
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Lazy load CloudWatch to avoid circular dependency
let cloudwatch = null;
const getCloudWatch = () => {
    if (!cloudwatch && process.env.NODE_ENV === 'production') {
        try {
            cloudwatch = require('./cloudwatch');
        } catch (error) {
            // CloudWatch not available, continue without it
        }
    }
    return cloudwatch;
};

// Custom format cho production logs
const productionFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Custom format cho development logs
const developmentFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level}]: ${stack || message}`;
    })
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'http', // Thay đổi từ 'info' thành 'http'
    format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    defaultMeta: { 
        service: 'group6-blog-platform',
        environment: process.env.NODE_ENV || 'development',
        instance: process.env.EC2_INSTANCE_ID || 'local'
    },
    transports: [
        // Error logs - chỉ ghi lỗi
        new winston.transports.File({ 
            filename: path.join(logsDir, 'error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        
        // Combined logs - tất cả logs
        new winston.transports.File({ 
            filename: path.join(logsDir, 'app.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        
        // Access logs - cho HTTP requests
        new winston.transports.File({ 
            filename: path.join(logsDir, 'access.log'),
            level: 'http',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),

        ...(process.env.NODE_ENV === 'production' && process.env.AWS_REGION ? [
            new CloudWatchTransport({
                logGroupName: '/aws/ec2/group6blog',
                logStreamName: `application-${process.env.EC2_INSTANCE_ID || 'local'}`,
                awsRegion: process.env.AWS_REGION,
                jsonMessage: true,
                retentionInDays: 30
            })
        ] : [])
    ]
});

// Thêm console transport cho development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: developmentFormat
    }));
}

// Helper functions cho các loại logs khác nhau
logger.logRequest = (req, res, responseTime) => {
    logger.http(`${req.method} ${req.originalUrl} - ${res.statusCode}`, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime: responseTime,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        contentLength: res.get('Content-Length') || 0
    });

    // Send metrics to CloudWatch if available
    const cw = getCloudWatch();
    if (cw) {
        cw.trackRequest(req.method, res.statusCode, responseTime, req.originalUrl)
            .catch(error => logger.error('Error sending request metrics:', error));
    }
};

logger.logError = (error, context = {}) => {
    logger.error(`Application Error: ${error.message}`, {
        message: error.message,
        stack: error.stack,
        ...context
    });

    // Send error metrics to CloudWatch if available
    const cw = getCloudWatch();
    if (cw) {
        cw.trackError(error.constructor.name, context.method)
            .catch(metricError => logger.error('Error sending error metrics:', metricError));
    }
};

logger.logDatabase = (query, duration, error = null) => {
    if (error) {
        logger.error(`Database Error: ${error.message}`, {
            query: query,
            duration: duration,
            error: error.message,
            stack: error.stack
        });
    } else {
        logger.info('Database Query', {
            query: query,
            duration: duration
        });
    }

    // Send database metrics to CloudWatch if available
    const cw = getCloudWatch();
    if (cw) {
        cw.trackDatabase('query', duration, !error)
            .catch(metricError => logger.error('Error sending database metrics:', metricError));
    }
};

logger.logS3Operation = (operation, bucket, key, error = null) => {
    if (error) {
        logger.error(`S3 Operation Error: ${error.message}`, {
            operation: operation,
            bucket: bucket,
            key: key
        });
    } else {
        logger.info(`S3 Operation Success: ${operation}`, {
            operation: operation,
            bucket: bucket,
            key: key
        });
    }

    // Send S3 metrics to CloudWatch if available
    const cw = getCloudWatch();
    if (cw) {
        cw.trackS3Operation(operation, !error)
            .catch(metricError => logger.error('Error sending S3 metrics:', metricError));
    }
};

module.exports = logger;

const express = require('express');
const dotenv = require('dotenv');

// Load environment variables FIRST, before importing other modules
dotenv.config();

// Import logger after environment variables are loaded
const logger = require('./utils/logger');

// Verify environment variables are loaded
logger.info('🔧 Environment verification', {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    DB_HOST: process.env.DB_HOST || 'not set',
    PORT: process.env.PORT || 'not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET (will use default)'
});

const { initDatabase } = require('./config/database');
const apiRouter = require('./routes/api');

const app = express();
const port = process.env.PORT || 80;

// Request logging middleware - log all incoming requests
app.use((req, res, next) => {
    const startTime = Date.now();
    
    // Use res.on('finish') to capture response details when response is complete
    res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        
        // Log response using existing logger helper
        logger.logRequest(req, res, responseTime);
    });

    next();
});

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// API routes
app.use('/api', apiRouter);

// Frontend routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

// Health check endpoint for monitoring
app.get('/health', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development'
        };

        // Check database connection if available
        if (req.app.locals.db) {
            try {
                await req.app.locals.db.query('SELECT 1');
                health.database = 'connected';
            } catch (dbError) {
                health.database = 'disconnected';
                health.status = 'unhealthy';
                logger.logError(dbError, { operation: 'health_check_database' });
            }
        }

        const responseTime = Date.now() - startTime;
        
        logger.info('Health check completed', {
            status: health.status,
            responseTime: responseTime,
            database: health.database || 'not_configured'
        });

        res.status(health.status === 'healthy' ? 200 : 503).json(health);
        
    } catch (error) {
        logger.logError(error, { operation: 'health_check' });
        
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Enhanced error handling middleware
app.use((error, req, res, next) => {
    const errorInfo = {
        message: error.message,
        stack: error.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    };

    // Log error using existing logger helper
    logger.logError(error, errorInfo);

    // Determine status code
    const statusCode = error.statusCode || error.status || 500;
    
    // Send response
    res.status(statusCode).json({
        error: {
            message: process.env.NODE_ENV === 'production' 
                ? 'Internal Server Error' 
                : error.message,
            type: error.constructor.name,
            timestamp: new Date().toISOString()
        }
    });
});

// Start server
async function startServer() {
    try {
        logger.info('Starting Group6 Blog Platform server...');
        
        await initDatabase();
        logger.info('Database initialized successfully');
        
        // Clean expired sessions on startup
        const AuthService = require('./services/authService');
        await AuthService.cleanExpiredSessions();
        logger.info('Expired sessions cleaned');
        
        // Set up periodic session cleanup (every hour)
        setInterval(async () => {
            try {
                await AuthService.cleanExpiredSessions();
                logger.info('Periodic session cleanup completed');
            } catch (error) {
                logger.logError(error, { operation: 'periodic_session_cleanup' });
            }
        }, 60 * 60 * 1000);
        
        app.listen(port, () => {
            logger.info('Server started successfully', {
                port: port,
                environment: process.env.NODE_ENV || 'development',
                authentication: 'Local Database (MySQL)',
                timestamp: new Date().toISOString()
            });
        });
    } catch (error) {
        logger.logError(error, { operation: 'server_startup' });
        logger.error('❌ Failed to start server - exiting process');
        process.exit(1);
    }
}

startServer();

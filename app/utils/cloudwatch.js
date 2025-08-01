const { cloudwatch } = require('../config/aws');
const logger = require('./logger');

class CloudWatchMetrics {
    constructor() {
        this.namespace = 'Group6Blog/Application';
        this.enabled = process.env.NODE_ENV === 'production' && process.env.AWS_REGION;
        
        if (!this.enabled) {
            logger.info('CloudWatch metrics disabled (development mode or missing AWS config)');
        } else {
            logger.info('CloudWatch metrics enabled', { namespace: this.namespace });
        }
    }

    /**
     * Send a metric to CloudWatch
     */
    async putMetric(metricName, value, unit = 'Count', dimensions = {}) {
        if (!this.enabled) return;

        try {
            const params = {
                Namespace: this.namespace,
                MetricData: [{
                    MetricName: metricName,
                    Value: value,
                    Unit: unit,
                    Timestamp: new Date(),
                    Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({ Name, Value }))
                }]
            };

            await cloudwatch.putMetricData(params).promise();
            logger.debug('CloudWatch metric sent', { metricName, value, unit, dimensions });
        } catch (error) {
            logger.logError(error, { operation: 'cloudwatch_put_metric', metricName });
        }
    }

    /**
     * Track HTTP request metrics
     */
    async trackRequest(method, statusCode, responseTime, originalUrl) {
        if (!this.enabled) return;

        try {
            const dimensions = {
                Method: method,
                Url: originalUrl,
                StatusCode: statusCode.toString()
            };

            // Send multiple metrics in parallel
            await Promise.all([
                this.putMetric('RequestCount', 1, 'Count', dimensions),
                this.putMetric('ResponseTime', responseTime, 'Milliseconds', { Method: method }),
                this.putMetric('Url', originalUrl, 'Count', { Method: method }),
                this.putMetric(statusCode >= 400 ? 'ErrorCount' : 'SuccessCount', 1, 'Count', dimensions)
            ]);
        } catch (error) {
            logger.logError(error, { operation: 'cloudwatch_track_request' });
        }
    }

    /**
     * Track error metrics
     */
    async trackError(errorType, method = null) {
        if (!this.enabled) return;

        try {
            const dimensions = { ErrorType: errorType };
            if (method) dimensions.Method = method;

            await this.putMetric('ApplicationError', 1, 'Count', dimensions);
        } catch (error) {
            logger.logError(error, { operation: 'cloudwatch_track_error' });
        }
    }

    /**
     * Track authentication metrics
     */
    async trackAuthentication(success, method = 'password') {
        if (!this.enabled) return;

        try {
            const dimensions = {
                AuthMethod: method,
                Result: success ? 'Success' : 'Failure'
            };

            await this.putMetric('AuthenticationAttempt', 1, 'Count', dimensions);
        } catch (error) {
            logger.logError(error, { operation: 'cloudwatch_track_auth' });
        }
    }

    /**
     * Track blog operations
     */
    async trackBlogOperation(operation, success) {
        if (!this.enabled) return;

        try {
            const dimensions = {
                Operation: operation,
                Result: success ? 'Success' : 'Failure'
            };

            await this.putMetric('BlogOperation', 1, 'Count', dimensions);
        } catch (error) {
            logger.logError(error, { operation: 'cloudwatch_track_blog' });
        }
    }

    /**
     * Track database operations
     */
    async trackDatabase(operation, duration, success = true) {
        if (!this.enabled) return;

        try {
            const dimensions = { Operation: operation };

            await Promise.all([
                this.putMetric('DatabaseOperation', 1, 'Count', dimensions),
                this.putMetric('DatabaseResponseTime', duration, 'Milliseconds', dimensions),
                this.putMetric(success ? 'DatabaseSuccess' : 'DatabaseError', 1, 'Count', dimensions)
            ]);
        } catch (error) {
            logger.logError(error, { operation: 'cloudwatch_track_database' });
        }
    }

    /**
     * Track S3 operations
     */
    async trackS3Operation(operation, success, size = null) {
        if (!this.enabled) return;

        try {
            const dimensions = {
                Operation: operation,
                Result: success ? 'Success' : 'Failure'
            };

            const metrics = [
                this.putMetric('S3Operation', 1, 'Count', dimensions)
            ];

            if (size !== null) {
                metrics.push(this.putMetric('S3ObjectSize', size, 'Bytes', { Operation: operation }));
            }

            await Promise.all(metrics);
        } catch (error) {
            logger.logError(error, { operation: 'cloudwatch_track_s3' });
        }
    }

    /**
     * Send custom application metrics
     */
    async trackCustomMetric(name, value, unit = 'Count', dimensions = {}) {
        if (!this.enabled) return;

        await this.putMetric(name, value, unit, dimensions);
    }
}

// Export singleton instance
module.exports = new CloudWatchMetrics();

const AWS = require('aws-sdk');

// AWS Configuration
const awsConfig = {
    region: process.env.AWS_REGION || 'us-east-1'
};

// Add session token if available
if (process.env.AWS_SESSION_TOKEN) {
    awsConfig.sessionToken = process.env.AWS_SESSION_TOKEN;
}

// Add access keys if available
if (process.env.AWS_ACCESS_KEY_ID) {
    awsConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
}

if (process.env.AWS_SECRET_ACCESS_KEY) {
    awsConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
}

// For local development with MinIO (S3 replacement)
if (process.env.S3_ENDPOINT) {
    awsConfig.endpoint = process.env.S3_ENDPOINT;
    awsConfig.s3ForcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
    awsConfig.accessKeyId = process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || 'minioaccess';
    awsConfig.secretAccessKey = process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || 'miniosecret';
}

// If running with LocalStack, configure endpoint
if (process.env.AWS_ENDPOINT_URL) {
    awsConfig.endpoint = process.env.AWS_ENDPOINT_URL;
    awsConfig.s3ForcePathStyle = true;
    awsConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'test';
    awsConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || 'test';
}

AWS.config.update(awsConfig);

// AWS Services - tạo S3 instance với config đã được cấu hình
const s3 = new AWS.S3(awsConfig);

const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

module.exports = {
    s3,
    CLOUDFRONT_DOMAIN,
    S3_BUCKET_NAME,
};

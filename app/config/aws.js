const AWS = require('aws-sdk');

// AWS Configuration for production S3
const awsConfig = {
    region: process.env.AWS_REGION || 'us-east-1'
};

// Add session token if available (for temporary credentials)
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

// Update global AWS config
AWS.config.update(awsConfig);

// Create S3 instance for production AWS
const s3 = new AWS.S3({
    region: awsConfig.region,
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
    sessionToken: awsConfig.sessionToken,
    signatureVersion: 'v4'
});

const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

module.exports = {
    s3,
    CLOUDFRONT_DOMAIN,
    S3_BUCKET_NAME,
};

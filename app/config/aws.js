const AWS = require('aws-sdk');

// AWS Configuration
const awsConfig = {
    region: process.env.AWS_REGION || 'us-east-1'
};

// For local development with MinIO (S3 replacement)
if (process.env.S3_ENDPOINT) {
    awsConfig.endpoint = process.env.S3_ENDPOINT;
    awsConfig.s3ForcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
    awsConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'minioaccess';
    awsConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || 'miniosecret';
}

// If running with LocalStack, configure endpoint
if (process.env.AWS_ENDPOINT_URL) {
    awsConfig.endpoint = process.env.AWS_ENDPOINT_URL;
    awsConfig.s3ForcePathStyle = true;
    awsConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'test';
    awsConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || 'test';
}

AWS.config.update(awsConfig);

// AWS Services
const cognito = new AWS.CognitoIdentityServiceProvider();
const s3 = new AWS.S3();

// Cognito Configuration
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const COGNITO_REGION = process.env.AWS_REGION || 'us-east-1';
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;

// JWK endpoint for token verification
const JWK_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`;

module.exports = {
    cognito,
    s3,
    COGNITO_USER_POOL_ID,
    COGNITO_CLIENT_ID,
    COGNITO_REGION,
    CLOUDFRONT_DOMAIN,
    S3_BUCKET_NAME,
    JWK_URL
};

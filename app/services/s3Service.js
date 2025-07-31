const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure S3 for MinIO
const s3Config = {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin'
};

// Add session token if available (for temporary credentials)
if (process.env.AWS_SESSION_TOKEN) {
    s3Config.sessionToken = process.env.AWS_SESSION_TOKEN;
}

// Add MinIO endpoint if using local S3 replacement
if (process.env.S3_ENDPOINT) {
    s3Config.endpoint = process.env.S3_ENDPOINT;
    s3Config.s3ForcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';
}

const s3 = new AWS.S3(s3Config);

// Upload image buffer to S3/MinIO
async function uploadImageToS3(buffer, fileName, contentType) {
    const bucketName = process.env.S3_BUCKET_NAME;
    
    if (!bucketName) {
        throw new Error('S3_BUCKET_NAME not configured');
    }
    
    // Ensure buffer is a proper Buffer (convert from ArrayBuffer if needed)
    let imageBuffer;
    if (buffer instanceof ArrayBuffer) {
        imageBuffer = Buffer.from(buffer);
    } else if (Buffer.isBuffer(buffer)) {
        imageBuffer = buffer;
    } else {
        throw new Error('Invalid buffer type provided');
    }
    
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: imageBuffer,
        ContentType: contentType
    };
    
    try {
        const result = await s3.upload(params).promise();
        
        // For MinIO, construct proper URL
        if (process.env.S3_ENDPOINT) {
            const endpoint = process.env.S3_ENDPOINT.replace('minio:9000', 'localhost:9000');
            return `${endpoint}/${bucketName}/${fileName}`;
        }
        
        return result.Location;
    } catch (error) {
        console.error('S3 upload error:', error);
        throw new Error('Failed to upload image to S3');
    }
}

// Generate file name for S3 upload
function generateFileName(userId, originalName) {
    const extension = originalName.split('.').pop();
    return `images/${userId}/${uuidv4()}.${extension}`;
}

// Generate presigned URL for S3/MinIO object
async function getPresignedUrl(fileName, expiresIn = 3600) {
    const bucketName = process.env.S3_BUCKET_NAME;
    
    if (!bucketName) {
        throw new Error('S3_BUCKET_NAME not configured');
    }
    
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Expires: expiresIn // URL expires in seconds (default: 1 hour)
    };
    
    try {
        const url = await s3.getSignedUrlPromise('getObject', params);
        
        // For MinIO, replace internal container URL with external accessible URL
        if (process.env.S3_ENDPOINT) {
            // Replace minio:9000 with localhost:9000 for client access
            const externalUrl = url.replace(/minio:9000/g, 'localhost:9000');
            console.log('Generated presigned URL:', externalUrl);
            return externalUrl;
        }
        
        return url;
    } catch (error) {
        console.error('S3 presigned URL error:', error);
        throw new Error('Failed to generate presigned URL');
    }
}

module.exports = {
    uploadImageToS3,
    getPresignedUrl,
    generateFileName
};

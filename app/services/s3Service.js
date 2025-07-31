const { s3, S3_BUCKET_NAME } = require('../config/aws');
const { v4: uuidv4 } = require('uuid');

// Upload image buffer to S3/MinIO
async function uploadImageToS3(buffer, fileName, contentType) {
    const bucketName = S3_BUCKET_NAME;
    
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
    const bucketName = S3_BUCKET_NAME;
    
    if (!bucketName) {
        throw new Error('S3_BUCKET_NAME not configured');
    }
    
    console.log(`Generating presigned URL for: ${fileName} in bucket: ${bucketName}`);
    
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Expires: expiresIn // URL expires in seconds (default: 1 hour)
    };
    
    try {
        const url = await s3.getSignedUrlPromise('getObject', params);
        
        console.log('Generated presigned URL successfully');
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

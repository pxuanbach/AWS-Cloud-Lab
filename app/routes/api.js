const express = require('express');
const multer = require('multer');
const { verifyToken } = require('../middleware/auth');
const BlogService = require('../services/blogService');
const AuthService = require('../services/authService');
const { uploadImageToS3, getPresignedUrl, generateFileName } = require('../services/s3Service');

const router = express.Router();

// Configure multer for image uploads (5MB limit)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files allowed'), false);
        }
    }
});

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

// Health check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'Group3 Blog API'
    });
});

// User registration with Cognito
router.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Tên, email và mật khẩu là bắt buộc' });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Định dạng email không hợp lệ' });
        }
        
        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 8 ký tự' });
        }
        
        const result = await AuthService.registerUser(name, email, password);
        
        res.json({
            success: true,
            message: result.message,
            userSub: result.userSub
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message || 'Đăng ký thất bại' });
    }
});

// Authentication with Cognito (supports both AWS Cognito and Cognito Local)
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
        }
        
        const result = await AuthService.loginUser(email, password);
        
        res.json(result);
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message || 'Đăng nhập thất bại' });
    }
});

// Get all blogs (public - anyone can view)
router.get('/blogs', async (req, res) => {
    try {
        const blogs = await BlogService.getAllBlogs();
        res.json(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
});

// =============================================================================
// AUTHENTICATED ROUTES (requires login)
// =============================================================================

router.post('/blogs', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const imageFile = req.file;
                
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        
        // Validate content length
        if (content.length > 5000) {
            return res.status(400).json({ error: 'Content cannot exceed 5000 characters' });
        }
        
        let imageFileName = null;
        
        // If image file is provided, upload it to S3/MinIO
        if (imageFile) {
            try {
                // Generate unique file name
                const fileName = generateFileName(req.user.id, imageFile.originalname);
                
                // Upload to S3/MinIO
                await uploadImageToS3(imageFile.buffer, fileName, imageFile.mimetype);
                
                // Store only the file name, not the full URL
                imageFileName = fileName;                
            } catch (uploadError) {
                console.error('Error uploading image:', uploadError);
                return res.status(500).json({ error: 'Failed to upload image' });
            }
        }
        
        // Get user's real name from Cognito
        let authorName = 'User';
        try {
            const cognitoEndpoint = process.env.COGNITO_ENDPOINT || 'http://localhost:9229';
            const userPoolId = process.env.COGNITO_USER_POOL_ID || 'local_pool_id';
            const username = req.user.id; // This is the sub/username from token
            
            // Check if using Cognito Local
            if (cognitoEndpoint.includes('localhost') || cognitoEndpoint.includes('cognito-local')) {
                // For Cognito Local
                const axios = require('axios');
                const userProfileResponse = await axios.post(cognitoEndpoint, {
                    UserPoolId: userPoolId,
                    Username: username
                }, {
                    headers: {
                        'X-Amz-Target': 'AWSCognitoIdentityProviderService.AdminGetUser',
                        'Content-Type': 'application/x-amz-json-1.1'
                    }
                });

                // Extract name from UserAttributes
                const userAttributes = userProfileResponse.data.UserAttributes || [];
                const nameAttribute = userAttributes.find(attr => attr.Name === 'name');
                if (nameAttribute && nameAttribute.Value) {
                    authorName = nameAttribute.Value;
                } else {
                    // Fallback to email prefix
                    const emailAttribute = userAttributes.find(attr => attr.Name === 'email');
                    if (emailAttribute && emailAttribute.Value) {
                        authorName = emailAttribute.Value.split('@')[0];
                    }
                }
            } else {
                // For AWS Cognito
                const AWS = require('aws-sdk');
                const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
                    region: process.env.AWS_REGION || 'us-east-1'
                });
                
                const params = {
                    UserPoolId: userPoolId,
                    Username: username
                };
                
                const userProfile = await cognitoIdentityServiceProvider.adminGetUser(params).promise();
                const userAttributes = userProfile.UserAttributes || [];
                const nameAttribute = userAttributes.find(attr => attr.Name === 'name');
                if (nameAttribute && nameAttribute.Value) {
                    authorName = nameAttribute.Value;
                } else {
                    // Fallback to email prefix
                    const emailAttribute = userAttributes.find(attr => attr.Name === 'email');
                    if (emailAttribute && emailAttribute.Value) {
                        authorName = emailAttribute.Value.split('@')[0];
                    }
                }
            }
        } catch (profileError) {
            console.error('Error fetching user name from Cognito:', profileError.message);
            // Fallback to token data
            authorName = req.user.name || req.user.email?.split('@')[0] || 'User';
        }
        
        const blogData = {
            title,
            content,
            imageFileName,
            authorId: req.user.id,
            authorName: authorName  // Real name from Cognito
        };
        
        const result = await BlogService.createBlog(blogData);
        res.json(result);
        
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ error: 'Failed to create blog' });
    }
});

// Get current user's blogs
router.get('/my-blogs', verifyToken, async (req, res) => {
    try {
        const blogs = await BlogService.getUserBlogs(req.user.id);
        res.json(blogs);
    } catch (error) {
        console.error('Error fetching user blogs:', error);
        res.status(500).json({ error: 'Failed to fetch blogs' });
    }
});

// Delete user's own blog
router.delete('/blogs/:id', verifyToken, async (req, res) => {
    try {
        const blogId = req.params.id;
        const result = await BlogService.deleteBlog(blogId, req.user.id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting blog:', error);
        if (error.message === 'Blog not found or not authorized') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to delete blog' });
        }
    }
});

module.exports = router;

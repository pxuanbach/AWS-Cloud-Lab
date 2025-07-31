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
        service: 'Group6 Blog API',
        version: '1.0.0',
        database: 'connected'
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
        
        // Get user's real name from database
        let authorName = req.user.name || 'User';
        
        // Use user info from token (already contains database user info)
        if (req.user.email && !authorName) {
            authorName = req.user.email.split('@')[0];
        }
        
        const blogData = {
            title,
            content,
            imageFileName,
            authorId: req.user.id,
            authorName: authorName
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

// Get presigned URL for image
router.get('/image-url/:fileName', async (req, res) => {
    try {
        const fileName = req.params.fileName;
        const expires = parseInt(req.query.expires) || 3600; // Default 1 hour
        
        // Always use presigned URL for both development and production
        const S3Service = require('../services/s3Service');
        const imageUrl = await S3Service.getPresignedUrl(fileName, expires);
        
        console.log('Generated presigned URL:', imageUrl);
        res.json({ url: imageUrl });
        
    } catch (error) {
        console.error('Error getting image URL:', error);
        res.status(500).json({ error: 'Failed to get image URL' });
    }
});

module.exports = router;

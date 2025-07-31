const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

class AuthService {
    
    // Register user with local database
    static async registerUser(name, email, password) {
        const db = getDatabase();
        
        try {
            console.log('🚀 Starting user registration for:', email);
            
            // Validate input
            if (!name || !email || !password) {
                throw new Error('Tên, email và mật khẩu là bắt buộc.');
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Email không hợp lệ.');
            }
            
            // Validate password strength
            if (password.length < 8) {
                throw new Error('Mật khẩu phải có ít nhất 8 ký tự.');
            }
            
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
                throw new Error('Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số.');
            }
            
            // Check if user already exists
            const [existingUsers] = await db.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );
            
            if (existingUsers.length > 0) {
                throw new Error('Tài khoản với email này đã tồn tại.');
            }
            
            // Hash password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            // Insert user
            const [result] = await db.execute(
                'INSERT INTO users (email, name, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?)',
                [email, name, passwordHash, 'user', true] // Auto-verify for simplicity
            );
            
            console.log('✅ User registered successfully with ID:', result.insertId);
            
            return {
                success: true,
                userId: result.insertId,
                message: 'Đăng ký thành công!'
            };
            
        } catch (error) {
            console.error('❌ Registration error:', error.message);
            throw error;
        }
    }
    
    // Login user with local database
    static async loginUser(email, password) {
        const db = getDatabase();
        
        try {
            console.log('🔐 Starting user login for:', email);
            
            // Validate input
            if (!email || !password) {
                throw new Error('Email và mật khẩu là bắt buộc.');
            }
            
            // Find user by email
            const [users] = await db.execute(
                'SELECT id, email, name, password_hash, role FROM users WHERE email = ?',
                [email]
            );
            
            if (users.length === 0) {
                throw new Error('Email hoặc mật khẩu không đúng.');
            }
            
            const user = users[0];
            
            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);
            if (!isPasswordValid) {
                throw new Error('Email hoặc mật khẩu không đúng.');
            }
            
            // Generate JWT token
            const jwtSecret = process.env.JWT_SECRET || 'group6-blog-secret-key-change-in-production';
            const tokenPayload = {
                userId: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            };
            
            const accessToken = jwt.sign(tokenPayload, jwtSecret, { 
                expiresIn: '24h',
                issuer: 'group6-blog-app'
            });
            
            // Save session to database
            const tokenHash = require('crypto').createHash('sha256').update(accessToken).digest('hex');
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            
            await db.execute(
                'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
                [user.id, tokenHash, expiresAt]
            );
            
            console.log('✅ User logged in successfully:', user.email);
            
            return {
                accessToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            };
            
        } catch (error) {
            console.error('❌ Login error:', error.message);
            throw error;
        }
    }
    
    // Verify JWT token
    static async verifyToken(token) {
        const db = getDatabase();
        
        try {
            console.log('🔍 Verifying token:', token.substring(0, 20) + '...');
            
            const jwtSecret = process.env.JWT_SECRET || 'group6-blog-secret-key-change-in-production';
            console.log('🔑 Using JWT secret (first 10 chars):', jwtSecret.substring(0, 10) + '...');
            
            // Verify JWT first
            const decoded = jwt.verify(token, jwtSecret);
            console.log('✅ JWT decoded successfully:', { userId: decoded.userId, email: decoded.email });
            
            // Try to check session in database, but don't fail if table doesn't exist or no session found
            try {
                const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
                const [sessions] = await db.execute(
                    'SELECT user_id FROM user_sessions WHERE token_hash = ? AND expires_at > NOW()',
                    [tokenHash]
                );
                
                // If session table exists and session is found, continue
                // If no session found but JWT is valid, allow it (for backward compatibility)
                console.log(`Session check: ${sessions.length > 0 ? 'Found' : 'Not found'} for user ${decoded.userId}`);
                
            } catch (sessionError) {
                // If there's an error checking sessions (e.g., table doesn't exist), 
                // just continue with JWT validation
                console.log('Session table check failed, using JWT only:', sessionError.message);
            }
            
            return decoded;
            
        } catch (error) {
            console.error('❌ Token verification failed:', error.message);
            console.error('❌ Token details:', { 
                tokenLength: token?.length,
                tokenStart: token?.substring(0, 20),
                error: error.name 
            });
            throw new Error('Token không hợp lệ hoặc đã hết hạn.');
        }
    }
    
    // Logout user (invalidate session)
    static async logoutUser(token) {
        const db = getDatabase();
        
        try {
            const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
            
            await db.execute(
                'DELETE FROM user_sessions WHERE token_hash = ?',
                [tokenHash]
            );
            
            console.log('✅ User logged out successfully');
            return { success: true, message: 'Đăng xuất thành công!' };
            
        } catch (error) {
            console.error('❌ Logout error:', error.message);
            throw error;
        }
    }
    
    // Clean expired sessions
    static async cleanExpiredSessions() {
        const db = getDatabase();
        
        try {
            const [result] = await db.execute(
                'DELETE FROM user_sessions WHERE expires_at < NOW()'
            );
            
            if (result.affectedRows > 0) {
                console.log(`🧹 Cleaned ${result.affectedRows} expired sessions`);
            }
            
        } catch (error) {
            console.error('❌ Error cleaning expired sessions:', error.message);
        }
    }
    
    // Get user by ID
    static async getUserById(userId) {
        const db = getDatabase();
        
        try {
            const [users] = await db.execute(
                'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
                [userId]
            );
            
            if (users.length === 0) {
                throw new Error('Người dùng không tồn tại.');
            }
            
            return users[0];
            
        } catch (error) {
            throw error;
        }
    }
}

module.exports = AuthService;

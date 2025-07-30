const AuthService = require('../services/authService');

// JWT verification for local database authentication
async function verifyToken(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token using AuthService
        const decoded = await AuthService.verifyToken(token);
        
        // Get full user info
        const user = await AuthService.getUserById(decoded.userId);
        
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };
        
        next();
        
    } catch (error) {
        console.error('Token verification error:', error.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// Admin role verification
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
}

// Optional authentication (for public endpoints that can benefit from user info)
async function optionalAuth(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (token) {
            const decoded = await AuthService.verifyToken(token);
            const user = await AuthService.getUserById(decoded.userId);
            
            req.user = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            };
        }
        
        next();
        
    } catch (error) {
        // Continue without authentication for optional auth
        next();
    }
}

module.exports = {
    verifyToken,
    requireAdmin,
    optionalAuth
};

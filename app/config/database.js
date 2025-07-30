const mysql = require('mysql2/promise');

// Debug environment variables loading
console.log('Environment Variables Check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- DB_HOST:', process.env.DB_HOST || 'NOT SET (will use localhost)');
console.log('- DB_USER:', process.env.DB_USER || 'NOT SET (will use admin)');
console.log('- DB_NAME:', process.env.DB_NAME || 'NOT SET (will use blog_db)');
console.log('- DB_PASSWORD:', process.env.DB_PASSWORD ? 'SET' : 'NOT SET');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'blog_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Debug database configuration
console.log('Final Database Configuration:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    hasPassword: !!dbConfig.password
});

let db;

// Initialize database connection
async function initDatabase() {
    try {
        db = mysql.createPool(dbConfig);
        
        // Test connection
        const connection = await db.getConnection();
        console.log('Connected to database');
        connection.release();
        
        // Create tables
        await createTables();
        return db;
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

// Create database tables
async function createTables() {
    // Users table
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('user', 'admin') DEFAULT 'user',
            email_verified BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email)
        )
    `;

    // Blogs table  
    const createBlogsTable = `
        CREATE TABLE IF NOT EXISTS blogs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            image_file_name VARCHAR(500),
            author_id INT NOT NULL,
            author_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_author (author_id),
            INDEX idx_created (created_at),
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;

    // User sessions table (for JWT token management)
    const createSessionsTable = `
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token_hash VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_token_hash (token_hash),
            INDEX idx_expires_at (expires_at),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    
    try {
        await db.execute(createUsersTable);
        await db.execute(createBlogsTable);
        await db.execute(createSessionsTable);
        console.log('Database tables ready');
        
        // Create default admin user if not exists
        await createDefaultAdmin();
    } catch (error) {
        console.error('Error creating tables:', error);
    }
}

// Create default admin user
async function createDefaultAdmin() {
    try {
        const bcrypt = require('bcrypt');
        const adminEmail = 'admin@group6.com';
        const adminPassword = 'Group6123!';
        const adminName = 'Administrator';
        
        // Check if admin exists
        const [existingAdmin] = await db.execute(
            'SELECT id FROM users WHERE email = ?',
            [adminEmail]
        );
        
        if (existingAdmin.length === 0) {
            // Create admin user
            const passwordHash = await bcrypt.hash(adminPassword, 12);
            await db.execute(
                'INSERT INTO users (email, name, password_hash, role, email_verified) VALUES (?, ?, ?, ?, ?)',
                [adminEmail, adminName, passwordHash, 'admin', true]
            );
            console.log('✅ Default admin user created:', adminEmail);
            console.log('📋 Admin credentials: admin@group6.com / Group6123!');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
}

// Get database instance
function getDatabase() {
    return db;
}

module.exports = {
    initDatabase,
    getDatabase
};

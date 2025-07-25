const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'blog_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

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
    const createBlogsTable = `
        CREATE TABLE IF NOT EXISTS blogs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            image_file_name VARCHAR(500),
            author_id VARCHAR(255) NOT NULL,
            author_name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_author (author_id),
            INDEX idx_created (created_at)
        )
    `;
    
    try {
        await db.execute(createBlogsTable);
        console.log('Database tables ready');
    } catch (error) {
        console.error('Error creating tables:', error);
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

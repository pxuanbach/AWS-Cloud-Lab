-- Group3 Blog Database Initialization Script
-- This script sets up the database schema for local development

USE blog_db;

-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_file_name TEXT,
    author_id VARCHAR(100) NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_author_id (author_id),
    INDEX idx_created_at (created_at)
);

-- Create users table (optional, for tracking user info)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cognito_id VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cognito_id (cognito_id),
    INDEX idx_email (email)
);

-- Insert sample data for development
INSERT INTO blogs (title, content, image_file_name, author_id, author_name) VALUES
('Welcome to Group3 Blog!', 
 'This is the first post on our blog platform. Here you can share interesting stories and connect with the community.',
 NULL,
 'admin-user-001',
 'Admin'),

('Docker Tutorial Guide', 
 'Docker is an excellent tool for containerizing applications. In this post, we will learn how to use Docker for web application development.',
 NULL,
 'dev-user-001', 
 'Developer'),

('AWS vs Local Development', 
 'Comparing development on AWS cloud versus local environment. Each approach has its own advantages and disadvantages.',
 NULL,
 'dev-user-002',
 'DevOps Engineer'),

('Node.js Performance Tips', 
 'Some tips to optimize performance for Node.js applications in production environment.',
 NULL,
 'dev-user-001',
 'Developer');

-- Insert sample users
INSERT INTO users (cognito_id, email, name) VALUES
('admin-user-001', 'admin@group3blog.com', 'Admin'),
('dev-user-001', 'developer@group3blog.com', 'Developer'),
('dev-user-002', 'devops@group3blog.com', 'DevOps Engineer')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX idx_blogs_title ON blogs(title);
CREATE INDEX idx_blogs_author_created ON blogs(author_id, created_at);

-- Display table information
SHOW TABLES;
SELECT COUNT(*) as total_blogs FROM blogs;
SELECT COUNT(*) as total_users FROM users;

-- Show sample data
SELECT 
    id, 
    title, 
    LEFT(content, 50) as content_preview,
    author_name,
    created_at 
FROM blogs 
ORDER BY created_at DESC;

COMMIT;

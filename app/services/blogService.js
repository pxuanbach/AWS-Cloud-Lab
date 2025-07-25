const { getDatabase } = require('../config/database');

class BlogService {
    // Get all blogs (public)
    static async getAllBlogs() {
        const db = getDatabase();
        const [rows] = await db.execute(
            'SELECT id, title, content, image_file_name, author_name, created_at FROM blogs ORDER BY created_at DESC'
        );
        return rows;
    }

    // Create new blog (authenticated)
    static async createBlog(blogData) {
        const { title, content, imageFileName, authorId, authorName } = blogData;
        const db = getDatabase();
        
        const [result] = await db.execute(
            'INSERT INTO blogs (title, content, image_file_name, author_id, author_name) VALUES (?, ?, ?, ?, ?)',
            [title, content, imageFileName, authorId, authorName]
        );
        
        return {
            id: result.insertId,
            message: 'Blog created successfully'
        };
    }

    // Get user's own blogs (authenticated)
    static async getUserBlogs(authorId) {
        const db = getDatabase();
        const [rows] = await db.execute(
            'SELECT id, title, content, image_file_name, author_name, created_at FROM blogs WHERE author_id = ? ORDER BY created_at DESC',
            [authorId]
        );
        return rows;
    }

    // Delete user's own blog (authenticated)
    static async deleteBlog(blogId, authorId) {
        const db = getDatabase();
        
        // Check if blog exists and belongs to user
        const [checkRows] = await db.execute(
            'SELECT id FROM blogs WHERE id = ? AND author_id = ?',
            [blogId, authorId]
        );
        
        if (checkRows.length === 0) {
            throw new Error('Blog not found or not authorized');
        }
        
        // Delete blog
        await db.execute('DELETE FROM blogs WHERE id = ?', [blogId]);
        
        return { message: 'Blog deleted successfully' };
    }
}

module.exports = BlogService;

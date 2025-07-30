const express = require('express');
const dotenv = require('dotenv');

// Load environment variables FIRST, before importing other modules
dotenv.config();

// Verify environment variables are loaded
console.log('🔧 Environment verification:');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('- DB_HOST:', process.env.DB_HOST || 'not set');
console.log('- PORT:', process.env.PORT || 'not set');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET (will use default)');

const { initDatabase } = require('./config/database');
const apiRouter = require('./routes/api');

const app = express();
const port = process.env.PORT || 80;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// API routes
app.use('/api', apiRouter);

// Frontend routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/dashboard', (req, res) => {
    res.sendFile(__dirname + '/public/dashboard.html');
});

// Basic error handling
app.use((error, req, res, next) => {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function startServer() {
    try {
        await initDatabase();
        
        // Clean expired sessions on startup
        const AuthService = require('./services/authService');
        await AuthService.cleanExpiredSessions();
        
        // Set up periodic session cleanup (every hour)
        setInterval(async () => {
            await AuthService.cleanExpiredSessions();
        }, 60 * 60 * 1000);
        
        app.listen(port, () => {
            console.log(`🚀 Group6 Blog API listening on port ${port}`);
            console.log(`💡 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔐 Authentication: Local Database (MySQL)`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

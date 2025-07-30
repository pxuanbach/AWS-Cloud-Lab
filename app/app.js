const express = require('express');
const dotenv = require('dotenv');
const { initDatabase } = require('./config/database');
const apiRouter = require('./routes/api');

// Load environment variables first
dotenv.config();

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
        
        app.listen(port, () => {
            console.log(`🚀 Group3 Blog API listening on port ${port}`);
            console.log(`💡 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

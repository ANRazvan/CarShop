// filepath: CarShopBackend/server.js
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');
const http = require('http');
const carRoutes = require('./routes/cars');

const app = express();
const port = 5000;

// Create HTTP server
const server = http.createServer(app);

// Remove size limits completely
app.use(express.json({ limit: '0' })); // '0' means no limit
app.use(express.urlencoded({ extended: true, limit: '0' })); // '0' means no limit

// Configure CORS with explicit options
app.use(cors({
    origin: '*', // Allow all origins - in production, specify your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Setup WebSocket server with explicit path
const wss = new WebSocketServer({ 
    server,
    path: '/ws' // Explicitly define the path
    // Remove the perMessageDeflate options which can cause issues with some clients
});

// Store connected clients
const clients = new Set();

// WebSocket handling
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Add client to our set
    clients.add(ws);
    
    // Set up ping interval to keep connection alive
    const pingInterval = setInterval(() => {
        if (ws.readyState === 1) { // OPEN
            try {
                ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
            } catch (e) {
                console.error('Error sending ping:', e);
                clearInterval(pingInterval);
            }
        }
    }, 30000); // send ping every 30 seconds
    
    // Handle client disconnect
    ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        clients.delete(ws);
        clearInterval(pingInterval); // Clear the ping interval when connection closes
    });
    
    // Handle messages from client
    ws.on('message', (message) => {
        console.log('Received message:', message.toString());
        
        // Process messages from clients
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type === 'PING') {
                ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
            } else if (parsedMessage.type === 'PONG') {
                // Client responded to our ping, connection is still alive
                console.log('Received pong from client');
            }
        } catch (e) {
            console.error('Error parsing WebSocket message:', e);
        }
    });
    
    // Send initial message to confirm connection
    try {
        ws.send(JSON.stringify({ 
            type: 'CONNECTED', 
            message: 'Connected to Car Shop WebSocket Server',
            timestamp: Date.now()
        }));
    } catch (e) {
        console.error('Error sending initial connection message:', e);
    }
});

// Broadcast to all connected clients
const broadcast = (message) => {
    clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
            client.send(JSON.stringify(message));
        }
    });
};

// Configure file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpg, .jpeg and .png file formats allowed'));
        }
    }
});

// Make uploads directory accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Make videos directory accessible for large files
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos'), {
    maxAge: '1d', // Cache for 1 day
    setHeaders: (res, path) => {
        if (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.ogg')) {
            res.setHeader('Content-Type', `video/${path.split('.').pop()}`);
        }
    }
}));

// Middleware
app.use(express.json());

// Store the broadcast function for use in routes
app.locals.broadcast = broadcast;

// Routes
app.use('/api/cars', (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(body) {
        // Check what type of operation it was and broadcast appropriate message
        if (req.method === 'POST' && res.statusCode === 201) {
            // Create operation
            broadcast({
                type: 'CAR_CREATED',
                data: body,
                timestamp: Date.now()
            });
        } else if (req.method === 'PUT' && res.statusCode === 200) {
            // Update operation
            broadcast({
                type: 'CAR_UPDATED',
                data: body,
                timestamp: Date.now()
            });
        } else if (req.method === 'DELETE' && res.statusCode === 200) {
            // Delete operation
            broadcast({
                type: 'CAR_DELETED',
                data: { id: req.params.id },
                timestamp: Date.now()
            });
        }
        
        return originalJson.call(this, body);
    };
    
    next();
}, carRoutes);

// Start the server
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`WebSocket server is ready`);
});
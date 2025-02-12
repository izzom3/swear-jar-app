const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const jarRoutes = require('./routes/jars');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config(); // Load .env file

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jars', jarRoutes);

const server = http.createServer(app); // Create HTTP server
const io = socketIo(server, {   // Pass the HTTP server to socket.io
 cors: {
   origin: process.env.REACT_APP_FRONTEND_URL,  // Adjust to your frontend origin
   methods: ["GET", "POST"]
 }
});

let lastMessage = null;

// WebSocket event handling
io.on('connection', (socket) => {
   console.log('Client connected');

   socket.on('disconnect', () => {
       console.log('Client disconnected');
   });

   if (lastMessage) {
       socket.emit("receive_message", lastMessage)
   }
});

// Start the server
server.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

exports.io = io;
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const jarRoutes = require('./routes/jars');

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

// Start the server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});

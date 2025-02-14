const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const crypto = require('crypto');

// Function to generate a refresh token
function generateRefreshToken() {
    return crypto.randomBytes(64).toString('hex');
}

//Get from DB in future
const refreshTokens = {};

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Registration failed' });
    }
});

// Login an existing user
router.post('/login', async (req, res) => {
    console.log('Login route hit');
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        const refreshToken = generateRefreshToken();

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        //Change this to be stored in DB
        refreshTokens[user._id] = { token: refreshToken, expiry: expiryDate };

        res.json({ token, userId: user._id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Login failed' });
    }
});

// Refresh token endpoint
router.post('/refresh', (req, res) => {

    const refreshToken = req.body.refreshToken;
    const userId = req.body.userId;  // Assuming UserID is now passed

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
    }

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    const storedRefreshTokenObject = refreshTokens[userId];

    if (!storedRefreshTokenObject) {
        return res.status(401).json({ message: 'Token does not exist in user id.' });
    }

    if (refreshToken !== storedRefreshTokenObject.token) {
        return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (storedRefreshTokenObject.expiry < new Date()) {
        delete refreshTokens[userId]; // remove the userId object if already expired
        return res.status(401).send({ message: 'Refresh token has expired' });
    }

    // Generate a new JWT token & refresh token
    const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const newRefreshToken = generateRefreshToken();
    const expiryDate = new Date();   // expires in 7 days
    expiryDate.setDate(expiryDate.getDate() + 7);

    // Replace the old refresh token with the new one
    refreshTokens[userId] = { token: newRefreshToken, expiry: expiryDate };

    res.json({ token, refreshToken: newRefreshToken });
});

module.exports = router;
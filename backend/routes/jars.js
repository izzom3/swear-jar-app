const express = require('express');
const router = express.Router();
const SwearJar = require('../models/SwearJar');
const auth = require('../middleware/auth'); // Import the auth middleware
const Transaction = require('../models/Transactions'); 
const mongoose = require('mongoose');

// Create a new swear jar (protected route)
router.post('/create', auth, async (req, res) => {
    try {
        const { name, password } = req.body;
        const newSwearJar = new SwearJar({
            name,
            password,
            owner: req.userId // Set the owner to the logged-in user
        });
        await newSwearJar.save();
        res.status(201).json(newSwearJar);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to create swear jar' });
    }
});

// Get all swear jars
router.get('/', async (req, res) => {
    try {
        const swearJars = await SwearJar.find();
        res.json(swearJars);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve swear jars' });
    }
});

// Get a specific swear jar by ID
router.get('/:id', async (req, res) => {
    try {
        const swearJar = await SwearJar.findById(req.params.id);
        if (!swearJar) {
            return res.status(404).json({ message: 'Swear jar not found' });
        }
        res.json(swearJar);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve swear jar' });
    }
});

router.get('/:swearJarId/transactions', async (req, res) => {
    try {
        const swearJarId = req.params.swearJarId;
        // console.log("swear jar ID", swearJarId)
        const transactions = await Transaction.find({ swearJarId });
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve transactions' });
    }
});

// Update a swear jar's members (password protected - MUST match)
router.put('/:id/addMember', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const io = require('../server').io;
    try {
        const { password, name, amount, username } = req.body;
        const swearJar = await SwearJar.findById(req.params.id).session(session);

        if (!swearJar) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Swear jar not found' });
        }

        if (swearJar.password !== password) {
            await session.abortTransaction();
            session.endSession();
            return res.status(401).json({ message: 'Incorrect password' });
        }

        let transactionType = '';
        // Check if member already exists
        const memberExists = swearJar.members.some(member => member.name === name);

        if (memberExists) {
            // Update existing member amount
            swearJar.members = swearJar.members.map(member =>
                member.name === name ? { ...member, amount: member.amount + Number(amount) } : member
            );
            transactionType = 'amount added';
        } else {
            // Add a new member
            swearJar.members.push({ name, amount: Number(amount) });
            transactionType = 'name added';
        }

        const updatedSwearJar = await swearJar.save({session});
        const transaction = new Transaction({ // create a new log entry
            swearJarId: swearJar._id,
            userId: username,
            action: transactionType,
            details: { name: name, amount: amount }
        });

        await transaction.save({session});
        io.emit('newTransaction', transaction);

        await session.commitTransaction();
        session.endSession();

        res.json(updatedSwearJar);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ message: 'Failed to update swear jar' });
    }
});

// Add a swear jar's members (password protected - MUST match)
router.delete('/:id/removeMember', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const io = require('../server').io;

    try {
        const { password, name, amount, username } = req.body;
        const swearJar = await SwearJar.findById(req.params.id).session(session);

        if (!swearJar) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Swear jar not found' });
        }

        if (swearJar.password !== password) {
            await session.abortTransaction();
            session.endSession();
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Check if member exists
        const memberExists = swearJar.members.some(member => member.name === name);

        if (!memberExists) {
            return res.status(404).json({ message: 'Member not found' });
        } else {
            // Update existing member amount
            swearJar.members = swearJar.members.map(member =>
                member.name === name ? { ...member, amount: member.amount - Number(amount) } : member
            );
            transactionType = 'amount removed';
        }

        const updatedSwearJar = await swearJar.save({session});
        const transaction = new Transaction({ // create a new log entry
            swearJarId: swearJar._id,
            userId: username,
            action: transactionType,
            details: { name: name, amount: amount }
        });

        await transaction.save({session});
        io.emit('newTransaction', transaction);

        await session.commitTransaction();
        session.endSession();
        
        res.json(updatedSwearJar);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update swear jar' });
    }
});

module.exports = router;

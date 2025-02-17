const express = require('express');
const router = express.Router();
const SwearJar = require('../models/SwearJar');
const auth = require('../middleware/auth'); // Import the auth middleware
const Transaction = require('../models/Transactions'); 
const User = require('../models/User');
const mongoose = require('mongoose');


const transactionUpdates = {};

function generateTransactionId() {
  return new mongoose.Types.ObjectId().toHexString();
}

// Create a new swear jar (protected route)
router.post('/create', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const newSwearJar = new SwearJar({
            name,
            owner: req.userId,
            permissions: [{
                userId: req.userId,
                canEdit: true
            }]
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

router.get('/getAllUsers', auth, async (req, res) => {
    try {
        const users = await User.find({}, '_id username'); // Only return _id and username

        res.json(users); //Return the users

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to retrieve users' });
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

// Add to a swear jar's members
router.put('/:id/addMember', auth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const io = require('../server').io;

    try {
        const { name, amount, username } = req.body;
        const swearJar = await SwearJar.findById(req.params.id).session(session);

        if (!swearJar) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Swear jar not found' });
        }

        // Check if the user has edit permission
        const hasPermission = swearJar.permissions.some(permission =>
            permission.userId.toString() === req.userId && permission.canEdit === true
        );

        if (!hasPermission && swearJar.owner.toString() !== req.userId) { //also add owner
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Unauthorized: You do not have permission to edit this jar' });
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

        const updatedSwearJar = await swearJar.save({ session });
        const transactionId = generateTransactionId();
        //Add a new transaction
        const transaction = new Transaction({
            _id: transactionId,
            swearJarId: swearJar._id,
            userId: username,
            action: transactionType,
            details: { name: name, amount: amount }
        });

        await transaction.save({ session });
        io.emit('newTransaction', {
            _id: transactionId.toString(),
            swearJarId: swearJar._id.toString(),
            userId: username,
            action: transactionType,
            details: { name: name, amount: amount }
        });

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

// Remove from a swear jar's member
router.delete('/:id/removeMember', auth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const io = require('../server').io;

    try {
        const { name, amount, username } = req.body;   // Removed password
        const swearJar = await SwearJar.findById(req.params.id).session(session);

        if (!swearJar) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Swear jar not found' });
        }

        // Check if the user has edit permission
        const hasPermission = swearJar.permissions.some(permission =>
            permission.userId.toString() === req.userId && permission.canEdit === true
        );

        if (!hasPermission && swearJar.owner.toString() !== req.userId) {  //also add owner
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Unauthorized: You do not have permission to edit this jar' });
        }

        // Check if member exists
        const memberExists = swearJar.members.some(member => member.name === name);

        if (!memberExists) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Member not found' });
        }

        // Update existing member amount
        swearJar.members = swearJar.members.map(member =>
            member.name === name ? { ...member, amount: member.amount - Number(amount) } : member
        );
        transactionType = 'amount removed';

        const updatedSwearJar = await swearJar.save({ session });
        const transactionId = generateTransactionId();
        const transaction = new Transaction({ // create a new log entry
            _id: transactionId,
            swearJarId: swearJar._id,
            userId: username,
            action: transactionType,
            details: { name: name, amount: amount }
        });

        await transaction.save({ session });
        io.emit('newTransaction', {
            _id: transactionId.toString(),  // MUST change to a string
            swearJarId: swearJar._id.toString(),
            userId: username,
            action: transactionType,
            details: { name: name, amount: amount }
        });

        await session.commitTransaction();
        session.endSession();

        res.json(updatedSwearJar);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update swear jar' });
    }
});

// Add permission to a user (protected route)
router.post('/addPermission', auth, async (req, res) => {
    try {
        const { jarId, userIdToAdd } = req.body;

        if (!jarId || !userIdToAdd) {
            return res.status(400).json({ message: 'jarId and userIdToAdd are required' });
        }

        const jar = await SwearJar.findById(jarId);

        if (!jar) {
            return res.status(404).json({ message: 'Swear jar not found' });
        }

        if (jar.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized: You are not the owner of this jar' });
        }

        const userAlreadyHasPermission = jar.permissions.some(permission =>
            permission.userId.toString() === userIdToAdd
        );

        if (userAlreadyHasPermission) {
             return res.status(400).json({ message: 'User already has permissions' });
        }

        // Add the new permission
        jar.permissions.push({ userId: userIdToAdd, canEdit: true });
        await jar.save();
        res.json(jar);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add permission' });
    }
});

router.post('/removePermission', auth, async (req, res) => {
    try {
        const { jarId, userIdToRemove } = req.body;

        if (!jarId || !userIdToRemove) {
            return res.status(400).json({ message: 'jarId and userIdToRemove are required' });
        }

        const jar = await SwearJar.findById(jarId);

        if (!jar) {
            return res.status(404).json({ message: 'Swear jar not found' });
        }
        
        if (jar.owner.toString() !== req.userId) {
            return res.status(403).json({ message: 'Unauthorized: You are not the owner of this jar' });
        }

        jar.permissions = jar.permissions.filter(permission =>
            permission.userId.toString() !== userIdToRemove
        );

        await jar.save();
        res.json(jar);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to remove permission' });
    }
});

module.exports = router;
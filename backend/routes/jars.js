const express = require('express');
const router = express.Router();
const SwearJar = require('../models/SwearJar');
const auth = require('../middleware/auth'); // Import the auth middleware

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

// Update a swear jar's members (password protected - MUST match)
router.put('/:id/addMember', async (req, res) => {
    try {
        const { password, name, amount } = req.body;
        const swearJar = await SwearJar.findById(req.params.id);

        if (!swearJar) {
            return res.status(404).json({ message: 'Swear jar not found' });
        }

        if (swearJar.password !== password) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Check if member already exists
        const memberExists = swearJar.members.some(member => member.name === name);

        if (memberExists) {
            // Update existing member amount
            swearJar.members = swearJar.members.map(member =>
                member.name === name ? { ...member, amount: member.amount + Number(amount) } : member
            );
        } else {
            // Add a new member
            swearJar.members.push({ name, amount: Number(amount) });
        }

        const updatedSwearJar = await swearJar.save();
        res.json(updatedSwearJar);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update swear jar' });
    }
});

// Add a swear jar's members (password protected - MUST match)
router.delete('/:id/removeMember', async (req, res) => {
    try {
        const { password, name, amount } = req.body;
        const swearJar = await SwearJar.findById(req.params.id);

        if (!swearJar) {
            return res.status(404).json({ message: 'Swear jar not found' });
        }

        if (swearJar.password !== password) {
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
        }

        const updatedSwearJar = await swearJar.save();
        res.json(updatedSwearJar);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update swear jar' });
    }
});

module.exports = router;

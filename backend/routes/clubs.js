const express = require('express');
const Club = require('../models/Club');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/clubs
// @desc    Get all approved clubs
router.get('/', async (req, res) => {
    try {
        const clubs = await Club.find({ status: 'approved' }).sort({ createdAt: -1 });
        const mapped = clubs.map(c => ({ ...c.toObject(), id: c._id }));
        res.json(mapped);
    } catch (error) {
        console.error('Get clubs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/clubs
// @desc    Create a club (request)
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, contactEmail, memberCount } = req.body;

        // Validate required fields
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Club name is required' });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ message: 'Club description is required' });
        }

        // Check for duplicate club name
        const existingClub = await Club.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingClub) {
            return res.status(400).json({ message: 'A club with this name already exists' });
        }

        const club = await Club.create({
            name,
            description,
            adminId: req.user._id,
            adminName: req.user.name,
            contactEmail: contactEmail || '',
            memberCount: Number(memberCount) || 0,
            status: 'pending',
        });

        res.status(201).json({ ...club.toObject(), id: club._id });
    } catch (error) {
        console.error('Create club error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

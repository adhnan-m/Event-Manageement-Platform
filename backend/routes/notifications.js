const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get current user's notifications (including auto-generated ticket notifications)
router.get('/', auth, async (req, res) => {
    try {
        // Get stored notifications
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        const mapped = notifications.map(n => ({
            ...n.toObject(),
            id: n._id,
            date: n.createdAt,
            type: n.type,
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Only the notification owner can mark it as read
        if (notification.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        notification.read = true;
        await notification.save();

        res.json({ ...notification.toObject(), id: notification._id });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/notifications/volunteer
// @desc    Club admin sends a message to all volunteers
router.post('/volunteer', auth, async (req, res) => {
    try {
        if (req.user.role !== 'clubAdmin') {
            return res.status(403).json({ message: 'Only club admins can message volunteers' });
        }

        const { subject, content, volunteerIds } = req.body;
        if (!subject || !content) {
            return res.status(400).json({ message: 'Subject and content are required' });
        }

        // If specific volunteer IDs provided, send to those; otherwise send to all volunteers
        const User = require('../models/User');
        let targetIds = volunteerIds;
        if (!targetIds || targetIds.length === 0) {
            const volunteers = await User.find({ role: 'volunteer' }).select('_id');
            targetIds = volunteers.map(v => v._id);
        }

        if (targetIds.length === 0) {
            return res.status(400).json({ message: 'No volunteers to send to' });
        }

        // Create a notification for each volunteer
        const notifications = targetIds.map(id => ({
            userId: id,
            type: 'volunteer',
            subject,
            content,
        }));

        await Notification.insertMany(notifications);
        res.status(201).json({ message: `Message sent to ${targetIds.length} volunteer(s)` });
    } catch (error) {
        console.error('Send volunteer message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

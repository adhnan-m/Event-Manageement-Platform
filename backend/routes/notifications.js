const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get current user's notifications (including auto-generated ticket notifications)
router.get('/', auth, async (req, res) => {
    try {
        // Get stored notifications with event details populated
        const notifications = await Notification.find({ userId: req.user._id })
            .populate('eventId', 'title clubName')
            .sort({ createdAt: -1 });

        const mapped = notifications.map(n => {
            const obj = n.toObject();
            return {
                ...obj,
                id: n._id,
                date: n.createdAt,
                type: n.type,
                eventTitle: obj.eventId?.title || '',
                eventClubName: obj.eventId?.clubName || '',
                eventId: obj.eventId?._id || obj.eventId,
            };
        });

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
// @desc    Club admin sends a message to their club's volunteers
router.post('/volunteer', auth, async (req, res) => {
    try {
        if (req.user.role !== 'clubAdmin') {
            return res.status(403).json({ message: 'Only club admins can message volunteers' });
        }

        const { subject, content, volunteerIds } = req.body;
        if (!subject || !content) {
            return res.status(400).json({ message: 'Subject and content are required' });
        }

        // Get the club admin's club and its volunteers
        const Club = require('../models/Club');
        const club = await Club.findOne({ adminId: req.user._id });

        let targetIds = volunteerIds;
        if (!targetIds || targetIds.length === 0) {
            // Use the club's volunteers list instead of all volunteers globally
            targetIds = club ? club.volunteers : [];
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

// @route   POST /api/notifications/event-message
// @desc    Club admin sends a message to all participants of a specific event
router.post('/event-message', auth, async (req, res) => {
    try {
        if (req.user.role !== 'clubAdmin') {
            return res.status(403).json({ message: 'Only club admins can send event messages' });
        }

        const { eventId, subject, content } = req.body;
        if (!eventId || !subject || !content) {
            return res.status(400).json({ message: 'Event ID, subject, and content are required' });
        }

        // Verify the club admin owns this event
        const Event = require('../models/Event');
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        if (event.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You can only message participants of your own events' });
        }

        // Get all registrations for this event
        const Registration = require('../models/Registration');
        const registrations = await Registration.find({ eventId }).select('userId');
        const userIds = registrations.map(r => r.userId);

        if (userIds.length === 0) {
            return res.status(400).json({ message: 'No participants registered for this event' });
        }

        // Create a notification for each participant
        const notifications = userIds.map(id => ({
            userId: id,
            type: 'announcement',
            subject: `[${event.clubName || 'Club'}] ${subject}`,
            content: `From: ${event.clubName || 'Club Admin'} — regarding "${event.title}"\n\n${content}`,
            eventId,
        }));

        await Notification.insertMany(notifications);
        res.status(201).json({ message: `Message sent to ${userIds.length} participant(s)` });
    } catch (error) {
        console.error('Send event message error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

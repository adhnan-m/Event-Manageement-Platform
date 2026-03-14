const express = require('express');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/registrations
// @desc    Register for an event
router.post('/', auth, async (req, res) => {
    try {
        const { eventId, userData } = req.body;
        const userId = req.user._id;

        // Check if already registered
        const existing = await Registration.findOne({ userId, eventId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Already registered for this event' });
        }

        // Check event capacity
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        if (event.currentParticipants >= event.maxParticipants) {
            return res.status(400).json({ success: false, message: 'Event is full' });
        }

        // Create registration
        const registration = await Registration.create({
            userId,
            eventId,
            userData,
        });

        // Update event participant count atomically
        await Event.findByIdAndUpdate(eventId, {
            $inc: { currentParticipants: 1 },
        });

        // Update user's registered events list
        await User.findByIdAndUpdate(userId, {
            $push: { registeredEvents: eventId },
        });

        // Create notification
        await Notification.create({
            userId,
            type: 'ticket',
            subject: `Event Registration Confirmed - ${event.title}`,
            content: `Your registration for ${event.title} has been confirmed. Please find your entry ticket in your inbox.`,
            eventId: event._id,
            registrationId: registration._id,
        });

        res.status(201).json({
            success: true,
            registration: { ...registration.toObject(), id: registration._id },
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/registrations/user
// @desc    Get current user's registrations with event details
router.get('/user', auth, async (req, res) => {
    try {
        const registrations = await Registration.find({ userId: req.user._id })
            .populate('eventId');

        // Build response with event details attached
        const result = registrations.map(reg => {
            const regObj = reg.toObject();
            const event = regObj.eventId;
            if (event) {
                return {
                    ...event,
                    id: event._id,
                    registration: {
                        id: regObj._id,
                        registeredAt: regObj.createdAt,
                        attended: regObj.attended,
                        attendedAt: regObj.attendedAt,
                        userData: regObj.userData,
                    },
                };
            }
            return null;
        }).filter(Boolean);

        res.json(result);
    } catch (error) {
        console.error('Get user registrations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/registrations/event/:eventId
// @desc    Get registrations for a specific event
router.get('/event/:eventId', auth, async (req, res) => {
    try {
        const registrations = await Registration.find({ eventId: req.params.eventId })
            .populate('userId', 'name email department semester phoneNumber');
        const mapped = registrations.map(r => {
            const obj = r.toObject();
            return {
                ...obj,
                id: r._id,
                userName: obj.userId?.name || '',
                userEmail: obj.userId?.email || '',
                department: obj.userId?.department || '',
                semester: obj.userId?.semester || '',
                phoneNumber: obj.userId?.phoneNumber || '',
                attended: obj.attended || false,
                attendedAt: obj.attendedAt || null,
            };
        });
        res.json(mapped);
    } catch (error) {
        console.error('Get event registrations error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/registrations/check/:eventId
// @desc    Check if current user is registered for an event
router.get('/check/:eventId', auth, async (req, res) => {
    try {
        const registration = await Registration.findOne({
            userId: req.user._id,
            eventId: req.params.eventId,
        });
        res.json({ isRegistered: !!registration });
    } catch (error) {
        console.error('Check registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

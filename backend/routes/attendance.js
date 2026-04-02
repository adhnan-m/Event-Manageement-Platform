const express = require('express');
const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/attendance
// @desc    Mark attendance (QR scan)
router.post('/', auth, async (req, res) => {
    try {
        const { userId, eventId } = req.body;
        const scannedBy = req.user._id;

        // Only club admins and volunteers can mark attendance
        if (!['clubAdmin', 'volunteer'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Only club admins and volunteers can mark attendance' });
        }

        // Check the event exists and is happening today
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        const today = new Date().toISOString().split('T')[0];
        const eventDay = new Date(event.date).toISOString().split('T')[0];
        if (today !== eventDay) {
            return res.status(400).json({ success: false, message: 'Attendance can only be marked on the day of the event' });
        }

        // Check registration exists
        const registration = await Registration.findOne({ userId, eventId });
        if (!registration) {
            return res.status(400).json({ success: false, message: 'Not registered for this event' });
        }

        // Check if already attended
        if (registration.attended) {
            return res.status(400).json({ success: false, message: 'Attendance already marked' });
        }

        // Mark attendance in registration
        registration.attended = true;
        registration.attendedAt = new Date();
        await registration.save();

        // Create attendance record
        const attendanceRecord = await Attendance.create({
            userId,
            eventId,
            scannedBy,
            timestamp: new Date(),
        });

        // Increment the user's actual participation count
        await User.findByIdAndUpdate(userId, {
            $inc: { eventsParticipated: 1 },
        });

        // Get user details for the response (event already fetched above)
        const attendedUser = await User.findById(userId).select('name');

        res.json({
            success: true,
            attendanceRecord: { ...attendanceRecord.toObject(), id: attendanceRecord._id },
            userName: attendedUser?.name || 'Attendee',
            eventName: event?.title || 'Event',
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/attendance/event/:eventId
// @desc    Get attendance for an event
router.get('/event/:eventId', auth, async (req, res) => {
    try {
        const attendance = await Attendance.find({ eventId: req.params.eventId })
            .sort({ timestamp: -1 });
        const mapped = attendance.map(a => ({ ...a.toObject(), id: a._id }));
        res.json(mapped);
    } catch (error) {
        console.error('Get event attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/attendance/today
// @desc    Get today's attendance records
router.get('/today', auth, async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const attendance = await Attendance.find({
            timestamp: { $gte: todayStart },
        }).sort({ timestamp: -1 });

        // Populate with event and registration details
        const results = [];
        for (const record of attendance) {
            const event = await Event.findById(record.eventId);
            const attendedUser = await User.findById(record.userId).select('name');

            results.push({
                eventId: record.eventId,
                userId: record.userId,
                userName: attendedUser?.name || 'Unknown User',
                eventName: event?.title || 'Unknown Event',
                timestamp: record.timestamp,
                status: 'valid',
            });
        }

        res.json(results);
    } catch (error) {
        console.error('Get today attendance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

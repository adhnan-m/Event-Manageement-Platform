const express = require('express');
const Event = require('../models/Event');
const Club = require('../models/Club');
const Registration = require('../models/Registration');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/events
// @desc    Get all approved upcoming events
router.get('/', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        // Auto-mark past events
        await Event.updateMany(
            { date: { $lt: today }, isPast: false, status: 'approved' },
            { $set: { isPast: true } }
        );

        const events = await Event.find({ status: 'approved', isPast: false })
            .populate('clubId', 'name')
            .sort({ date: 1 });
        const mapped = await Promise.all(events.map(async (e) => {
            const obj = e.toObject();
            const regCount = await Registration.countDocuments({ eventId: e._id });
            return {
                ...obj,
                id: e._id,
                clubName: obj.clubId?.name || obj.clubName || '',
                currentParticipants: regCount,
            };
        }));
        res.json(mapped);
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/events/past
// @desc    Get past events
router.get('/past', async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        await Event.updateMany(
            { date: { $lt: today }, isPast: false, status: 'approved' },
            { $set: { isPast: true } }
        );

        const events = await Event.find({ status: 'approved', isPast: true })
            .populate('clubId', 'name')
            .sort({ date: -1 });
        const mapped = await Promise.all(events.map(async (e) => {
            const obj = e.toObject();
            const regCount = await Registration.countDocuments({ eventId: e._id });
            return {
                ...obj,
                id: e._id,
                clubName: obj.clubId?.name || obj.clubName || '',
                currentParticipants: regCount,
            };
        }));
        res.json(mapped);
    } catch (error) {
        console.error('Get past events error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/events/:id
// @desc    Get single event
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('clubId', 'name');
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        const obj = event.toObject();
        const regCount = await Registration.countDocuments({ eventId: event._id });
        res.json({ ...obj, id: event._id, clubName: obj.clubId?.name || obj.clubName || '', currentParticipants: regCount });
    } catch (error) {
        console.error('Get event error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/events
// @desc    Create a new event (clubAdmin)
router.post('/', auth, async (req, res) => {
    try {
        const { title, description, date, time, venue, category, maxParticipants, posterUrl, clubId, clubName } = req.body;

        // Look up the actual club name from the database
        let resolvedClubName = clubName || '';
        if (clubId) {
            const club = await Club.findById(clubId);
            if (club) {
                resolvedClubName = club.name;
            }
        }

        const event = await Event.create({
            title,
            description,
            date,
            time,
            venue,
            category,
            maxParticipants: Number(maxParticipants),
            posterUrl: posterUrl || '',
            clubId: clubId || null,
            clubName: resolvedClubName,
            createdBy: req.user._id,
            status: 'pending',
            currentParticipants: 0,
        });

        res.status(201).json({ ...event.toObject(), id: event._id });
    } catch (error) {
        console.error('Create event error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/events/:id
// @desc    Update an event
router.put('/:id', auth, async (req, res) => {
    try {
        // Verify the event exists and check authorization
        const existingEvent = await Event.findById(req.params.id);
        if (!existingEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Only the event creator or a collegeAdmin can update
        const isOwner = existingEvent.createdBy && existingEvent.createdBy.toString() === req.user._id.toString();
        const isCollegeAdmin = req.user.role === 'collegeAdmin';
        if (!isOwner && !isCollegeAdmin) {
            return res.status(403).json({ message: 'Not authorized to update this event' });
        }

        // Only allow specific fields to be updated
        const allowedFields = ['title', 'description', 'date', 'time', 'venue', 'category',
            'maxParticipants', 'posterUrl', 'clubName', 'status', 'isPast'];
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }

        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json({ ...event.toObject(), id: event._id });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

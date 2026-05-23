const express = require('express');
const Request = require('../models/Request');
const Club = require('../models/Club');
const Event = require('../models/Event');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/requests
// @desc    Get all requests (collegeAdmin)
router.get('/', auth, async (req, res) => {
    try {
        // Only college admins can view requests
        if (req.user.role !== 'collegeAdmin') {
            return res.status(403).json({ message: 'Only college admins can view requests' });
        }

        const requests = await Request.find()
            .populate('submittedBy', 'name email')
            .sort({ createdAt: -1 });

        const mapped = requests.map(r => {
            const obj = r.toObject();
            return {
                ...obj,
                id: obj._id,
                submittedById: obj.submittedBy?._id || obj.submittedBy,
                submittedBy: obj.submittedBy?.name || 'Unknown',
                submittedEmail: obj.submittedBy?.email || '',
                submittedAt: obj.createdAt,
            };
        });
        res.json(mapped);
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/requests
// @desc    Create a new request (event or club)
router.post('/', auth, async (req, res) => {
    try {
        const { type, title, description, relatedId } = req.body;

        // Validate type
        if (!['club', 'event'].includes(type)) {
            return res.status(400).json({ message: 'Request type must be "club" or "event"' });
        }

        // Validate required fields
        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }
        if (!description || !description.trim()) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const request = await Request.create({
            type,
            title,
            description,
            submittedBy: req.user._id,
            submittedEmail: req.user.email,
            status: 'pending',
            relatedId: relatedId || undefined,
        });

        res.status(201).json({ ...request.toObject(), id: request._id });
    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/requests/:id
// @desc    Approve or reject a request
router.put('/:id', auth, async (req, res) => {
    try {
        // Only college admins can approve/reject requests
        if (req.user.role !== 'collegeAdmin') {
            return res.status(403).json({ message: 'Only college admins can approve or reject requests' });
        }

        const { status } = req.body; // 'approved' or 'rejected'

        // Fetch the full request first to get the submittedBy ObjectId
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        request.status = status;
        await request.save();

        // If approved and it's a club request, approve the club and update user role
        if (status === 'approved' && request.type === 'club' && request.relatedId) {
            await Club.findByIdAndUpdate(request.relatedId, { status: 'approved' });
            await User.findByIdAndUpdate(request.submittedBy, { role: 'clubAdmin' });
        }

        // If approved and it's an event request, approve the event
        if (status === 'approved' && request.type === 'event' && request.relatedId) {
            await Event.findByIdAndUpdate(request.relatedId, { status: 'approved' });
        }

        res.json({ ...request.toObject(), id: request._id });
    } catch (error) {
        console.error('Update request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

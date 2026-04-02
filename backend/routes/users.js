const express = require('express');
const User = require('../models/User');
const Club = require('../models/Club');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ ...user.toObject(), id: user._id });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/profile
// @desc    Update current user profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, semester, department, phoneNumber } = req.body;

        // Validate field lengths
        if (name !== undefined && (name.length === 0 || name.length > 100)) {
            return res.status(400).json({ message: 'Name must be between 1 and 100 characters' });
        }
        if (semester !== undefined && semester.length > 50) {
            return res.status(400).json({ message: 'Semester must be less than 50 characters' });
        }
        if (department !== undefined && department.length > 50) {
            return res.status(400).json({ message: 'Department must be less than 50 characters' });
        }
        if (phoneNumber !== undefined && phoneNumber.length > 0) {
            const phoneRegex = /^[0-9+\-\s()]{6,15}$/;
            if (!phoneRegex.test(phoneNumber)) {
                return res.status(400).json({ message: 'Please provide a valid phone number' });
            }
        }

        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (semester !== undefined) updateFields.semester = semester;
        if (department !== undefined) updateFields.department = department;
        if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updateFields },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ ...user.toObject(), id: user._id });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



// @route   GET /api/users/students
// @desc    Get all students and this club's volunteers (for volunteer assignment)
router.get('/students', auth, async (req, res) => {
    try {
        // Find the club admin's club to get their specific volunteers
        const club = await Club.findOne({ adminId: req.user._id });
        const clubVolunteerIds = club ? club.volunteers.map(id => id.toString()) : [];

        // Get all students, volunteers, and other club admins (excluding self)
        const users = await User.find({
            role: { $in: ['student', 'volunteer', 'clubAdmin'] },
            _id: { $ne: req.user._id },
        })
            .select('-password')
            .sort({ name: 1 });

        // Mark users as 'volunteer' only if they are in this club's volunteers list
        const mapped = users.map(u => {
            const obj = u.toObject();
            const userId = (obj._id).toString();
            const isClubVolunteer = clubVolunteerIds.includes(userId);
            return {
                ...obj,
                id: obj._id,
                role: isClubVolunteer ? 'volunteer' : 'student',
            };
        });

        res.json(mapped);
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/users/my-clubs
// @desc    Get all clubs where the current user is a volunteer
router.get('/my-clubs', auth, async (req, res) => {
    try {
        const clubs = await Club.find({ volunteers: req.user._id })
            .populate('adminId', 'name email');

        const mapped = clubs.map(c => {
            const obj = c.toObject();
            return {
                id: obj._id,
                clubName: obj.name,
                clubAdminName: obj.adminId?.name || 'Unknown',
                assignedDate: obj.createdAt,
            };
        });

        res.json(mapped);
    } catch (error) {
        console.error('Get my clubs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/transfer-admin
// NOTE: This MUST be defined BEFORE /:id/role to avoid Express treating 'transfer-admin' as :id
// @desc    Transfer club admin position to a student (current admin becomes volunteer)
router.put('/transfer-admin', auth, async (req, res) => {
    try {
        if (req.user.role !== 'clubAdmin') {
            return res.status(403).json({ message: 'Only club admins can transfer their position' });
        }

        const { targetUserId } = req.body;
        if (!targetUserId) {
            return res.status(400).json({ message: 'Target user ID is required' });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Target user not found' });
        }

        if (!['student', 'volunteer'].includes(targetUser.role)) {
            return res.status(400).json({ message: 'Can only transfer admin to a student or volunteer' });
        }

        // Promote target user to clubAdmin
        targetUser.role = 'clubAdmin';
        await targetUser.save();

        // Demote current admin to volunteer
        const currentAdmin = await User.findById(req.user._id);
        currentAdmin.role = 'volunteer';
        await currentAdmin.save();

        // Update the club's adminId and adminName
        const Club = require('../models/Club');
        await Club.findOneAndUpdate(
            { adminId: req.user._id },
            { adminId: targetUser._id, adminName: targetUser.name }
        );

        res.json({
            message: `Club admin position transferred to ${targetUser.name}`,
            newRole: 'volunteer',
        });
    } catch (error) {
        console.error('Transfer admin error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/users/:id/role
// @desc    Assign or remove volunteer role for this club (clubAdmin only)
router.put('/:id/role', auth, async (req, res) => {
    try {
        // Only clubAdmin can assign volunteers
        if (req.user.role !== 'clubAdmin') {
            return res.status(403).json({ message: 'Only club admins can assign volunteers' });
        }

        const { role } = req.body; // 'volunteer' or 'student'
        if (!['student', 'volunteer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be student or volunteer' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Can only change students to volunteers and vice versa
        if (!['student', 'volunteer'].includes(user.role)) {
            return res.status(400).json({ message: 'Can only assign volunteer role to students' });
        }

        // Find this club admin's club
        const club = await Club.findOne({ adminId: req.user._id });
        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        if (role === 'volunteer') {
            // Add user to this club's volunteers list
            if (!club.volunteers.map(id => id.toString()).includes(req.params.id)) {
                club.volunteers.push(req.params.id);
                await club.save();
            }
            // Set user role to volunteer
            user.role = 'volunteer';
            await user.save();
        } else {
            // Remove user from this club's volunteers list
            club.volunteers = club.volunteers.filter(id => id.toString() !== req.params.id);
            await club.save();

            // Only revert to student if user is not a volunteer in any other club
            const otherClubs = await Club.findOne({
                _id: { $ne: club._id },
                volunteers: req.params.id,
            });
            if (!otherClubs) {
                user.role = 'student';
                await user.save();
            }
        }

        res.json({ ...user.toObject(), id: user._id, password: undefined });
    } catch (error) {
        console.error('Assign role error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

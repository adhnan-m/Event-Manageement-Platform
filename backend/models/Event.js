const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
    },
    date: {
        type: String,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    venue: {
        type: String,
        required: true,
    },
    posterUrl: {
        type: String,
        default: '',
    },
    clubId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Club',
    },
    clubName: {
        type: String,
        default: '',
    },
    maxParticipants: {
        type: Number,
        required: true,
    },
    currentParticipants: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    category: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    isPast: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Event', eventSchema);

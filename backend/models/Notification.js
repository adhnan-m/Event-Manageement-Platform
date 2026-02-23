const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['ticket', 'announcement', 'volunteer'],
        default: 'announcement',
    },
    subject: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        default: '',
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
    },
    registrationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Registration',
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);

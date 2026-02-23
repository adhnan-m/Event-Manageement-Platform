const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    userData: {
        name: String,
        semester: String,
        department: String,
        phoneNumber: String,
    },
    attended: {
        type: Boolean,
        default: false,
    },
    attendedAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

// Compound index to prevent duplicate registrations
registrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);

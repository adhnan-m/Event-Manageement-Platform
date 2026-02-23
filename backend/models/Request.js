const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['event', 'club'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: '',
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    submittedEmail: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Request', requestSchema);

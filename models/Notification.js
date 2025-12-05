const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    notifies: [
        {
            title: {
                type: String,
                required: true,
            },
            content: {
                type: String,
                required: true,
            },
            isRead: {
                type: Boolean,
                required: true,
            },
            type: {
                type: String,
                required: true,
            },
            toUrl: {
                type: String,
            },
            createAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
});

module.exports = mongoose.model('Notification', notificationSchema);

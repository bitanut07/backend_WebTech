const mongoose = require('mongoose');
const returnRequestSchema = new mongoose.Schema(
    {
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        images: [String],
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
        created_at: {
            type: Date,
            default: Date.now,
        },
        processed_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        processed_at: Date,
        notes: String,
    },
    { timestamps: true },
);

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);

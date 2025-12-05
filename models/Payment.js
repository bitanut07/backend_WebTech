const mongoose = require('mongoose');
const paymentSchema = new mongoose.Schema({
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
    date_payment: {
        type: Date,
        default: Date.now,
    },
    method_payment: {
        type: String,
    },
    amount: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model('Payment', paymentSchema);

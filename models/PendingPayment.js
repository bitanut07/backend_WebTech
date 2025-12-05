const mongoose = require('mongoose');
const pendingPaymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    orderData: {
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                },
                color: String,
                quantity: Number,
                price: Number,
            },
        ],
        info_receive: {
            name: String,
            phone: String,
            address: String,
            note: String,
        },
        address_shipping: String,
        shipping_fee: Number,
        discount: Number,
        total_price: Number,
        payment_method: {
            type: String,
            enum: ['cash', 'payment_online'],
            default: 'payment_online',
        },
    },
    momoOrderId: String,
    createdAt: { type: Date, default: Date.now, expires: 3600 }, // Tự động xóa sau 1 giờ
});


module.exports = mongoose.model('PendingPayment', pendingPaymentSchema);
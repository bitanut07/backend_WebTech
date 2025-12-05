const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    order_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date_order: {
        type: Date,
        default: Date.now(),
    },
    total_price: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['Processing', 'confirmed ', 'Shipped', 'Delivered', 'Return Pending', 'Cancelled'],
        default: 'Processing',
    },
    return_request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReturnRequest',
    },
    info_receive: {
        name: {
            type: String,
        },
        phone: {
            type: String,
        },
        address: {
            type: String,
        },
        note: {
            type: String,
        },
    },
    address_shipping: {
        type: String,
    },
    shipping_fee: {
        type: Number,
    },
    discount: {
        type: Number,
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
            color: {
                type: String,
            },
            quantity: Number,
            price: Number,
        },
    ],
    payment_method: {
        type: String,
        enum: ['cash', 'payment_online'],
        required: true,
        default: 'cash',
    },
    is_payment: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model('Order', orderSchema);

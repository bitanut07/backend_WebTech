const mongoose = require('mongoose');

const shoppingCartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    cart: {
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                },
                quantity: {
                    type: Number,
                    default: 1,
                },
                total: {
                    type: Number,
                    default: 0,
                },
                color: {
                    type: String,
                },
            },
        ],
        quantity: {
            type: Number,
            default: 0,
        },
        subtotal: {
            type: Number,
            default: 0,
        },
    },
});

module.exports = mongoose.model('ShoppingCart', shoppingCartSchema);

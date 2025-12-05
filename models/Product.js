const mongoose = require('mongoose');
const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        nameDetail: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            require: true,
        },
        thumbnail: {
            type: String,
            require: true,
        },
        listImage: [
            {
                type: String,
            },
        ],
        color: [
            {
                type: String,
            },
        ],
        version: {
            type: String,
        },
        quantity: {
            type: Number,
        },
        price: {
            type: Number,
            required: true,
        },
        isFeature: {
            type: Boolean,
            required: true,
        },
        ratings: [
            {
                star: {
                    type: Number,
                },
                postedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
                comment: {
                    type: String,
                },
            },
        ],
        avgStar: {
            type: Number,
            default: 0,
        },
        product_category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductCategory',
        },
        special_features: { type: String },
    },
    {
        discriminatorKey: 'productType',
        collection: 'products',
    },
);

module.exports = mongoose.model('Product', productSchema);

const mongoose = require('mongoose');
const crypto = require('crypto');
const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
        },
        birthday: {
            type: Date,
            default: null,
        },
        address: [
            {
                type: String,
            },
        ],
        email: {
            type: String,
            required: true,
            minlength: 10,
            maxlength: 50,
            unique: true,
        },
        phone: {
            type: String,
        },
        username: {
            type: String,
            minlength: 6,
            maxlength: 20,
        },
        password: {
            type: String,
            minlength: 6,
        },
        avatar: {
            type: String,
            default: '',
        },
        admin: {
            type: Boolean,
            default: false,
        },
        shoppingCart: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ShoppingCart',
        },
        wishlist: [
            {
                type: String,
            },
        ],
        isBlock: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
        },
    },
    { timestamps: true },
);

userSchema.methods = {
    createPasswordChangedToken: function () {
        const resetToken = crypto.randomBytes(32).toString('hex');
        this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
        return resetToken;
    },
};
module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const VerifyOtpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            match: /.+\@.+\..+/,
        },
        otp: {
            type: String,
            required: true,
        },
        expiresIn: {
            type: Date,
            default: () => new Date(Date.now() + 10 * 60 * 1000),
        },
    },
    { timestamps: true },
);

module.exports = mongoose.model('VerifyOtp', VerifyOtpSchema);

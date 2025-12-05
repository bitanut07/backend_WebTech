const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');

const sendMail = asyncHandler(async ({ email, html, subject }) => {
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_NAME,
            pass: process.env.EMAIL_APP_PASSWORD,
        },
    });

    const info = await transporter.sendMail({
        from: '"TechShop" <TechShop@gmail.com>',
        to: email,
        subject: subject,
        html: html,
    });

    console.log('Message sent: %s', info.messageId);
    return info;
});

module.exports = sendMail;

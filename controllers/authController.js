const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const createToken = require('uniqid');
const sendMail = require('../ultils/sendMail');
const { oauth2client } = require('../ultils/googleConfig');
const generateOTP = require('../ultils/generateOtp');
const VerifyOtp = require('../models/verifyOtp');
const generateRandomString = require('../ultils/generateString');
const axios = require('axios');
const authController = {
    registerUser: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await User.findOne({ email });
            if (user) return res.json({ success: false, mes: 'Email này đã tồn tại !!!' });
            else {
                res.cookie('infoRegister', { ...req.body }, { httpOnly: true, maxAge: 10 * 60 * 1000 });
                await VerifyOtp.findOneAndDelete({ email });

                const otp = generateOTP();
                const newOtp = new VerifyOtp({ email, otp });
                await newOtp.save();

                const html = `Mã OTP của bạn là: ${otp}. Thời gian hiệu lực là 10 phút`;

                const data = {
                    email,
                    html,
                    subject: 'Verify register',
                };
                await sendMail(data);
                return res.json({ success: true, mes: 'Vui lòng kiểm tra email để xác nhận tài khoản.' });
            }
        } catch (error) {
            return res.status(500).json({ success: false, mes: 'Có lỗi xảy ra, vui lòng thử lại sau.' });
        }
    },
    verifyOtp: async (req, res) => {
        try {
            const cookie = req.cookies;
            // Xử lý opt đăng ký
            if (req.body.isRegister) {
                if (!cookie?.infoRegister?.email || !cookie?.infoRegister) {
                    return res.json({
                        success: false,
                        mess: 'Thông tin không đầy đủ để xác minh.',
                    });
                }

                const email = cookie.infoRegister.email;
                const { otp } = req.body;
                const isOtp = await VerifyOtp.findOne({ email });
                if (!isOtp) {
                    return res.json({
                        success: false,
                        mes: 'OTP không tồn tại hoặc không hợp lệ.',
                    });
                }
                if (otp !== isOtp.otp) {
                    return res.json({
                        success: false,
                        mes: 'OTP không chính xác.',
                    });
                }

                if (isOtp.expire < new Date()) {
                    return res.json({
                        success: false,
                        mes: 'Mã OTP này đã hết hạn.',
                    });
                }

                await VerifyOtp.findOneAndDelete({ email });

                const salt = await bcrypt.genSalt(10);
                const hashed = await bcrypt.hash(cookie.infoRegister.password, salt);

                const newUser = new User({
                    ...cookie.infoRegister,
                    password: hashed,
                });

                const user = await newUser.save();

                if (user) {
                    return res.json({
                        success: true,
                        mes: 'Đăng ký thành công',
                    });
                } else {
                    return res.json({
                        success: false,
                        mes: 'Đăng ký thất bại',
                    });
                }
                // Xử lý otp quên mật khẩu
            } else {
                const email = req.cookies.email;
                if (!email) {
                    return res.json({
                        success: false,
                        mess: 'Thông tin không đầy đủ để xác minh.',
                    });
                }
                const { otp } = req.body;

                const isOtp = await VerifyOtp.findOne({ email });
                if (!isOtp) {
                    return res.json({
                        success: false,
                        mes: 'OTP không tồn tại hoặc không hợp lệ.',
                    });
                }
                console.log('otp: ', isOtp);
                if (otp !== isOtp.otp) {
                    return res.json({
                        success: false,
                        mes: 'OTP không chính xác.',
                    });
                }

                if (isOtp.expire < new Date()) {
                    return res.json({
                        success: false,
                        mes: 'Mã OTP này đã hết hạn.',
                    });
                }

                await VerifyOtp.findOneAndDelete({ email });
                const token = jwt.sign(
                    {
                        email: email,
                        otp: otp,
                    },
                    process.env.ACCESS_KEY,
                    { expiresIn: '10m' },
                );
                res.cookie('token', token, { httpOnly: true, maxAge: 10 * 60 * 1000 });
                return res.json({
                    success: true,
                    mes: 'Xác thực OPT thành công !',
                });
            }
        } catch (error) {
            return res.json({
                success: false,
                // mes: 'Có lỗi xảy ra',
                mes: error.message,
            });
        }
    },
    verifyChangePassword: async (req, res) => {
        try {
            const token = req.cookies.token;
            console.log('token', token);
            if (!token) {
                return res.json({
                    success: false,
                    mes: 'Token không tồn tại hoặc không hợp lệ.',
                });
            }

            let decoded;
            try {
                decoded = jwt.verify(token, process.env.ACCESS_KEY);
            } catch (error) {
                return res.json({
                    success: false,
                    mes: 'Token không hợp lệ hoặc đã hết hạn.',
                });
            }
            const { password } = req.body;
            if (!password) {
                return res.json({
                    success: false,
                    mes: 'Mật khẩu mới không được để trống.',
                });
            }

            const user = await User.findOne({ email: decoded.email });
            if (!user) {
                return res.json({
                    success: false,
                    mes: 'Người dùng không tồn tại.',
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user.password = hashedPassword;
            await user.save();

            res.clearCookie('token');

            return res.json({
                success: true,
                mes: 'Mật khẩu đã được thay đổi thành công.',
            });
        } catch (error) {
            return res.json({
                success: false,
                mes: 'Có lỗi xảy ra.',
            });
        }
    },
    // Login
    loginUser: async (req, res) => {
        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) {
                return res.json({
                    success: false,
                    mes: 'Email không chính xác',
                });
            }
            if (!user.password) {
                return res.json({
                    success: false,
                    mes: 'Email này đã được liên kết với tài khoản google',
                });
            }
            const validPassword = await bcrypt.compare(req.body.password, user.password);
            if (!validPassword) {
                return res.json({
                    success: false,
                    mes: 'Mật khẩu không chính xác',
                });
            }
            if (user.isBlock === true) {
                return res.json({
                    success: false,
                    mes: 'Tài khoản của bạn đã bị khóa',
                });
            }
            const accessToken = jwt.sign(
                {
                    id: user._id,
                    admin: user.admin,
                },
                process.env.ACCESS_KEY,
                { expiresIn: '2d' },
            );
            const newRefreshToken = jwt.sign(
                {
                    id: user._id,
                    admin: user.admin,
                },
                process.env.REFRESH_KEY,
                { expiresIn: '10d' },
            );

            await User.findByIdAndUpdate(user.id, { refreshToken: newRefreshToken }, { new: true });
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: false,
                path: '/',
                sameSize: 'strict',
                maxAge: 10 * 24 * 60 * 60 * 1000,
            });
            const { password, refreshToken, ...userData } = user._doc;
            return res.status(200).json({ success: true, userData, accessToken });
        } catch (error) {
            res.status(500).json({ success: false, mes: 'Login failed' });
        }
    },
    logoutUser: async (req, res) => {
        const cookie = req.cookies;
        if (!cookie || !cookie.refreshToken) {
            return res.json({
                success: false,
                message: 'Refresh token not found',
            });
        }

        await User.findOneAndUpdate({ refreshToken: cookie.refreshToken }, { refreshToken: '' }, { new: true });
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
        });
        return res.status(200).json({
            success: true,
            mes: 'Đăng xuất thành công',
        });
    },
    refreshToken: async (req, res) => {
        console.log(1000)
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(401).json("You're not authenticated");
        jwt.verify(refreshToken, process.env.REFRESH_KEY, async (err, user) => {
            if (err) {
                return res.status(403).json({
                    success: false,
                    mes: 'Refresh token is not valid',
                });
            }
            const newAccessToken = jwt.sign(
                {
                    id: user.id,
                    admin: user.admin,
                },
                process.env.ACCESS_KEY,
                { expiresIn: '2d' },
            );
            res.status(200).json({
                success: user ? true : false,
                accessToken: newAccessToken,
            });
        });
    },
    googleLogin: async (req, res) => {
        try {
            const { code } = req.query;
            const googleRes = await oauth2client.getToken(code);
            oauth2client.setCredentials(googleRes.tokens);
            const userRes = await axios.get(
                `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`,
            );

            const { email, name, picture } = userRes.data;
            var user = await User.findOne({ email });
            if (!user) {
                user = await User.create({
                    fullName: name,
                    username: generateRandomString(10),
                    email,
                    avatar: picture,
                });
            }
            const accessToken = jwt.sign(
                {
                    id: user._id,
                    admin: user.admin,
                },
                process.env.ACCESS_KEY,
                { expiresIn: '2d' },
            );
            const newRefreshToken = jwt.sign(
                {
                    id: user._id,
                    admin: user.admin,
                },
                process.env.REFRESH_KEY,
                { expiresIn: '10d' },
            );
            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: false,
                path: '/',
                sameSize: 'strict',
                maxAge: 10 * 24 * 60 * 60 * 1000,
            });
            const { password, refreshToken, ...userData } = user._doc;
            return res.status(200).json({ success: true, userData, accessToken });
        } catch (error) {
            throw error;
        }
    },
};
module.exports = authController;

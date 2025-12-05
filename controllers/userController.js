const User = require('../models/User');
// const asyncHandler = require('express-async-handler')
const sendMail = require('../ultils/sendMail');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const generateOTP = require('../ultils/generateOtp');
const VerifyOtp = require('../models/verifyOtp');
const userController = {
    //GET ALL USER
    getAllUsers: async (req, res) => {
        try {
            const users = await User.find();
            const formattedUsers = users.map((user) => ({
                id: user._id,
                avatar: user.avatar,
                name: user.fullName || 'Unnamed Custome',
                email: user.email,
                status: user.isBlock ? 'Blocked' : 'Active',
                orders: user.orders?.length || 0,
                balance: user.balance || 0,
            }));

            res.status(200).json({
                success: true,
                data: {
                    users: formattedUsers,
                },
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
            });
        }
    },
    getUserById: async (req, res) => {
        try {
            const userId = req.params.id;
            const user = await User.findById(userId).select('-refreshToken -password -admin');

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng',
                });
            }

            res.status(200).json({
                success: true,
                user: user,
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Lỗi server',
                error: err.message,
            });
        }
    },
    //DELETE A USER
    deleteUser: async (req, res) => {
        try {
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json({
                success: true,
                message: "'User deleted'",
            });
        } catch (err) {
            res.status(500).json(err);
        }
    },

    // get user current
    getUserCurrent: async (req, res) => {
        try {
            const { id } = req.user;
            const user = await User.findById(id).select('-refreshToken -password');
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            
            return res.status(200).json({
                success: true,
                data: user
            });
        } catch (error) {
            console.error('Error in getUserCurrent:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get user'
            });
        }
    },
    updateUser: async (req, res) => {
        try {
            const { id } = req.user;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
            }
            
            if (Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update',
                });
            }
            
            // Don't allow updating sensitive fields
            const { password, refreshToken, admin, ...updateData } = req.body;
            
            const response = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-refreshToken -password');
            
            if (!response) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            res.status(200).json({
                success: true,
                updateUser: response
            });
        } catch (error) {
            console.error('Error in updateUser:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to update user'
            });
        }
    },

    forgotPassword: async (req, res) => {
        try {
            const { email } = req.query;
            if (!email) throw new Error('Missing email');
            const user = await User.findOne({ email });

            if (!user) {
                return res.json({
                    success: false,
                    mes: 'Không tồn tài email này trên hệ thống',
                });
            }
            res.cookie('email', email, { httpOnly: true, maxAge: 10 * 60 * 1000 });
            await VerifyOtp.findOneAndDelete({ email });
            const otp = generateOTP();
            const newOtp = new VerifyOtp({ email, otp });
            newOtp.save();
            const html = `Mã OTP của bạn để thay đổi mật khẩu là: ${otp}. Nó sẽ hết hạn sau 10 phút.`;
            const data = {
                email,
                html,
                subject: 'Reset password',
            };
            const content = await sendMail(data);
            return res.status(200).json({
                success: content ? true : false,
                mes: content ? 'Gửi otp thành công' : 'Gửi mã otp thất bại',
            });
        } catch (error) {
            res.json({
                success: false,
                mes: 'Có lỗi xảy ra',
            });
        }
    },

    resetPassword: async (req, res) => {
        const { password, token } = req.body;
        const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({ passwordResetToken, passwordResetExpires: { $gt: Date.now() } });
        if (!user) throw new Error('invalid reset token');
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);
        user.password = hashed;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return res.status(200).json({
            success: user ? true : false,
        });
    },
    updateUserAddress: async (req, res) => {
        try {
            const { id } = req.user;
            if (!req.body.address) {
                throw new Error('Address not found');
            }

            const response = await User.findByIdAndUpdate(
                id,
                { $push: { address: req.body.address } },
                { new: true },
            ).select('-password -Admin -accessToken -refreshToken');

            res.status(200).json({
                status: !!response,
                updateUser: response || 'Not found User to update',
            });
        } catch (error) {
            res.status(400).json({
                status: false,
                message: error.message,
            });
        }
    },
    // updateUserByAdmin: async (req, res) => {
    //     try {
    //         const userId = req.params.id
    //         const data = req.body
    //         if (!userId) {
    //             return res.status(400).json('User is required')
    //         }
    //         const checkUser = await User.findOne({
    //             _id: userId
    //         })
    //         if (!checkUser) {
    //             return res.status(400).json('User is not found')
    //         }

    //         const updateUser = await User.findByIdAndUpdate(userId, data, { new: true })
    //         return res.status(200).json({ updateUser })
    //     } catch (error) {
    //         console.log(error)
    //         return res.status(404).json(error)
    //     }
    // },
    updateWishlist: async (req, res) => {
        const pid = req.params.pid;
        const { id } = req.user;

        // Tìm user từ database
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found!' });
        }
        const checkWishlist = user.wishlist?.find((e) => e.toString() === pid.toString());

        if (checkWishlist) {
            const response = await User.findByIdAndUpdate(id, { $pull: { wishlist: pid } }, { new: true });
            return res.json({
                success: response ? true : false,
                message: response ? 'Removed from wishlist successfully!' : 'Update wishlist failed!',
            });
        } else {
            const response = await User.findByIdAndUpdate(id, { $push: { wishlist: pid } }, { new: true });
            return res.json({
                success: response ? true : false,
                message: response ? 'Added to wishlist successfully!' : 'Update wishlist failed!',
            });
        }
    },

    // Block user
    blockUser: async (req, res) => {
        const { user_id } = req.body;
        try {
            const user = await User.findById(user_id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found!' });
            }

            user.isBlock = !user.isBlock;
            await user.save();
            return res.status(200).json({
                success: true,
                message: 'Update status block user successfully',
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Update failed',
            });
        }
    },
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const { id } = req.user;

            // Find user
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng',
                });
            }

            // Validate current password
            const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Mật khẩu hiện tại không đúng',
                });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedNewPassword = await bcrypt.hash(newPassword, salt);
            user.password = hashedNewPassword;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Đổi mật khẩu thành công',
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi server',
            });
        }
    },
    getWishlist: async (req, res) => {
        try {
            const { id } = req.user;

            const user = await User.findById(id).select('wishlist').populate({
                path: 'wishlist',
                select: 'name price thumbnail description brand status',
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng',
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    wishlist: user.wishlist || [],
                    total: user.wishlist?.length || 0,
                },
                message: 'Lấy danh sách yêu thích thành công',
            });
        } catch (error) {
            console.error('Get wishlist error:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy danh sách yêu thích',
            });
        }
    },
    getDetailForAdmin: async (req, res) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id, 'name email address fullname phone username avatar isBlock');
            return res.json({
                success: user ? true : false,
                user: user ? user : 'User not found',
            });
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'Failed',
            });
        }
    },
    uploadAvatar: async (req, res) => {
        try {
            const { id } = req.user;
            const avatar = req.file.path;
            const user = await User.findById(id);
            user.avatar = avatar;
            await user.save();
            return res.json({
                success: true,
            });
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'Failed',
            });
        }
    },
};

module.exports = userController;

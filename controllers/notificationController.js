const Notification = require('../models/Notification');
const { getIO, getUserSockets } = require('../socket');
const User = require('../models/User');
const notificationController = {
    createNotifications: async (req, res) => {
        try {
            var { userIds, title, content, type, toUrl } = req.body;
            if (userIds.length === 0) {
                const allUsers = await User.find();
                userIds = allUsers.map((user) => {
                    return user._id;
                });
            }
            const isSingleUser = Array.isArray(userIds) && userIds.length === 1;
            const newNotification = {
                title,
                content,
                type,
                toUrl,
                isRead: false,
                createAt: new Date(),
            };

            if (isSingleUser) {
                const userId = userIds[0];
                let userNotification = await Notification.findOne({ user: userId });

                if (!userNotification) {
                    userNotification = new Notification({
                        user: userId,
                        notifies: [],
                    });
                }

                userNotification.notifies.push(newNotification);
                await userNotification.save();
                const userSockets = getUserSockets();
                const socketId = userSockets.get(userId);
                const newNotificationId = userNotification.notifies[userNotification.notifies.length - 1]._id;
                console.log('test: ', newNotificationId);
                if (socketId) {
                    getIO()
                        .to(socketId)
                        .emit('new_notification', { ...newNotification, _id: newNotificationId });
                }

                return res.status(200).json({
                    success: true,
                    notify: userNotification.notifies[userNotification.notifies.length - 1],
                });
            } else {
                // if (!Array.isArray(userIds) || userIds.length === 0) {
                //     return res.status(400).json({ error: 'Danh sách userIds không hợp lệ' });
                // }

                const bulkOperations = [];
                const usersToCreate = [];

                const existingUsers = await Notification.find({ user: { $in: userIds } });
                const existingUserIds = existingUsers.map((doc) => doc.user.toString());

                for (const userId of userIds) {
                    if (existingUserIds.includes(userId.toString())) {
                        bulkOperations.push({
                            updateOne: {
                                filter: { user: userId },
                                update: { $push: { notifies: newNotification } },
                            },
                        });
                    } else {
                        usersToCreate.push({
                            user: userId,
                            notifies: [newNotification],
                        });
                    }
                }

                let results = [];
                if (bulkOperations.length > 0) {
                    results = await Notification.bulkWrite(bulkOperations);
                }
                if (usersToCreate.length > 0) {
                    await Notification.insertMany(usersToCreate);
                }
                const userSockets = getUserSockets();
                const io = getIO();
                const updatedNotifications = await Notification.find({
                    user: { $in: userIds },
                    'notifies.createAt': newNotification.createAt,
                });
                updatedNotifications.forEach((notification) => {
                    const latestNotify = notification.notifies[notification.notifies.length - 1];
                    const socketId = userSockets.get(notification.user.toString());
                    if (socketId) {
                        io.to(socketId).emit('new_notification', {
                            ...newNotification,
                            _id: latestNotify._id,
                        });
                    }
                });
                return res.status(200).json({
                    success: true,
                    message: `Đã gửi thông báo cho ${userIds.length} người dùng`,
                    notification: newNotification,
                });
            }
        } catch (error) {
            console.error('Error in createNotifications:', error);
            return res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to create notifications' 
            });
        }
    },

    getUserNotifications: async (req, res) => {
        try {
            const userId = req.params.userId;
            const mongoose = require('mongoose');
            
            if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid user ID format',
                    notifications: []
                });
            }
            
            const userNotification = await Notification.findOne({ user: userId });

            if (!userNotification || !userNotification.notifies) {
                return res.status(200).json({
                    success: true,
                    notifications: []
                });
            }

            const sortedNotifications = userNotification.notifies
                .sort((a, b) => new Date(b.createAt) - new Date(a.createAt));

            res.status(200).json({
                success: true,
                notifications: sortedNotifications || []
            });
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to get notifications',
                notifications: []
            });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const { id: userId } = req.user;
            const { notificationId } = req.params;
            console.log('id: ', userId);
            console.log('noti: ', notificationId);
            const result = await Notification.findOneAndUpdate(
                {
                    user: userId,
                    'notifies._id': notificationId,
                },
                {
                    $set: { 'notifies.$.isRead': true },
                },
                { new: true },
            );

            if (!result) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            const updatedNotification = result.notifies.find((notify) => notify._id.toString() === notificationId);

            res.status(200).json({
                success: true,
                notification: updatedNotification
            });
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to mark notification as read' 
            });
        }
    },

    markAllAsRead: async (req, res) => {
        try {
            const { id: userId } = req.user;

            const result = await Notification.findOneAndUpdate(
                { user: userId },
                { $set: { 'notifies.$[].isRead': true } },
                { new: true },
            );

            if (!result) {
                return res.status(404).json({ 
                    success: false,
                    message: 'User notifications not found' 
                });
            }

            res.status(200).json({ 
                success: true,
                message: 'All notifications marked as read'
            });
        } catch (error) {
            console.error('Mark all as read error:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to mark all notifications as read' 
            });
        }
    },

    deleteNotification: async (req, res) => {
        try {
            const { id: userId } = req.user;
            const { notificationId } = req.params;
            const mongoose = require('mongoose');
            
            if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid notification ID format' 
                });
            }

            const result = await Notification.findOneAndUpdate(
                { user: userId },
                { $pull: { notifies: { _id: notificationId } } },
                { new: true },
            );

            if (!result) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Notification not found' 
                });
            }

            res.status(200).json({ 
                success: true,
                message: 'Notification deleted successfully'
            });
        } catch (error) {
            console.error('Delete notification error:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to delete notification' 
            });
        }
    },
};

module.exports = notificationController;

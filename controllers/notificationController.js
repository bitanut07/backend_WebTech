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
            console.error('Error:', error);
            return res.status(500).json({ error: error.message });
        }
    },

    getUserNotifications: async (req, res) => {
        try {
            const userId = req.params.userId;
            console.log('user: ', userId);
            const userNotification = await Notification.findOne({ user: userId });

            if (!userNotification) {
                return res.status(200).json([]);
            }

            const sortedNotifications = userNotification.notifies.sort((a, b) => b.createAt - a.createAt);

            res.status(200).json(sortedNotifications);
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({ error: error.message });
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

            res.status(200).json(updatedNotification);
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({ error: error.message });
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
                return res.status(404).json({ error: 'User notifications not found' });
            }

            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Mark all as read error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    deleteNotification: async (req, res) => {
        try {
            const { id: userId } = req.user;
            const { notificationId } = req.params;

            const result = await Notification.findOneAndUpdate(
                { user: userId },
                { $pull: { notifies: { _id: notificationId } } },
                { new: true },
            );

            if (!result) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Delete notification error:', error);
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = notificationController;

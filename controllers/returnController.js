const ReturnRequest = require('../models/returnOrder');
const Order = require('../models/Order');

const returnController = {
    createReturn: async (req, res) => {
        try {
            const { orderId, reason } = req.body;
            const userId = req.user.id;

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found' });
            }

            const images = req.files ? req.files.map((file) => file.path) : [];

            const returnRequest = await ReturnRequest.create({
                order: orderId,
                user: userId,
                reason,
                images,
            });

            await Order.findByIdAndUpdate(orderId, {
                status: 'Return Pending',
                return_request: returnRequest._id,
            });

            res.json({ success: true, returnRequest });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    getReturns: async (req, res) => {
        try {
            const returns = await ReturnRequest.find()
                .populate('order')
                .populate('user', 'fullName email')
                .populate('processed_by', 'fullName email');
            res.json({ success: true, returns });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    getReturnDetail: async (req, res) => {
        try {
            const return_request = await ReturnRequest.findById(req.params.id)
                .populate('order')
                .populate('user', 'fullName email phone')
                .populate('processed_by', 'fullName email');

            if (!return_request) {
                return res.status(404).json({ success: false, message: 'Return request not found' });
            }

            res.json({ success: true, return_request });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    processReturn: async (req, res) => {
        try {
            const { status, notes } = req.body;
            const adminId = req.user.id;

            const return_request = await ReturnRequest.findByIdAndUpdate(
                req.params.id,
                {
                    status,
                    processed_by: adminId,
                    processed_at: Date.now(),
                    notes,
                },
                { new: true },
            ).populate('order');

            if (!return_request) {
                return res.status(404).json({ success: false, message: 'Return request not found' });
            }

            if (status === 'Approved') {
                await Order.findByIdAndUpdate(return_request.order._id, {
                    status: 'Returned',
                });
            }

            res.json({ success: true, return_request });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    // Get user's return requests
    getUserReturns: async (req, res) => {
        try {
            const userId = req.user.id;
            const returns = await ReturnRequest.find({ user: userId })
                .populate({
                    path: 'order',
                    select: 'items totalAmount status',
                    populate: {
                        path: 'items.product',
                        select: 'name price',
                    },
                })
                .select('reason status createdAt');

            if (returns.length === 0) {
                return res.status(404).json({ success: false, message: 'No return requests found.' });
            }

            res.json({ success: true, returns });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    },
};

module.exports = returnController;

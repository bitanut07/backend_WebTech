const ReturnRequest = require('../models/returnOrder');
const Order = require('../models/Order');

const returnController = {
    createReturn: async (req, res) => {
        try {
            const { orderId, reason } = req.body;
            const userId = req.user.id;
            const mongoose = require('mongoose');

            // Validation
            if (!orderId || !reason) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Missing required fields: orderId, reason' 
                });
            }

            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid order ID format' 
                });
            }

            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Order not found' 
                });
            }

            // Check if order belongs to user
            if (order.order_by.toString() !== userId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You can only return your own orders' 
                });
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

            res.status(201).json({ 
                success: true, 
                returnRequest 
            });
        } catch (error) {
            console.error('Error in createReturn:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to create return request' 
            });
        }
    },

    getReturns: async (req, res) => {
        try {
            const returns = await ReturnRequest.find()
                .populate('order')
                .populate('user', 'fullName email')
                .populate('processed_by', 'fullName email')
                .sort({ createdAt: -1 })
                .lean();
            res.json({ 
                success: true, 
                returns: returns || [],
                count: returns.length
            });
        } catch (error) {
            console.error('Error in getReturns:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to get return requests',
                returns: []
            });
        }
    },

    getReturnDetail: async (req, res) => {
        try {
            const { id } = req.params;
            const mongoose = require('mongoose');
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid return request ID format' 
                });
            }
            
            const return_request = await ReturnRequest.findById(id)
                .populate('order')
                .populate('user', 'fullName email phone')
                .populate('processed_by', 'fullName email')
                .lean();

            if (!return_request) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Return request not found' 
                });
            }

            res.json({ 
                success: true, 
                return_request 
            });
        } catch (error) {
            console.error('Error in getReturnDetail:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to get return request detail' 
            });
        }
    },

    processReturn: async (req, res) => {
        try {
            const { status, notes } = req.body;
            const adminId = req.user.id;
            const { id } = req.params;
            const mongoose = require('mongoose');
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid return request ID format' 
                });
            }
            
            if (!status) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Status is required' 
                });
            }

            const validStatuses = ['Pending', 'Approved', 'Rejected'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid status value' 
                });
            }

            const return_request = await ReturnRequest.findByIdAndUpdate(
                id,
                {
                    status,
                    processed_by: adminId,
                    processed_at: Date.now(),
                    notes,
                },
                { new: true },
            ).populate('order');

            if (!return_request) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Return request not found' 
                });
            }

            if (status === 'Approved' && return_request.order) {
                await Order.findByIdAndUpdate(return_request.order._id, {
                    status: 'Returned',
                });
            }

            res.json({ 
                success: true, 
                return_request 
            });
        } catch (error) {
            console.error('Error in processReturn:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to process return request' 
            });
        }
    },

    // Get user's return requests
    getUserReturns: async (req, res) => {
        try {
            const userId = req.user.id;
            const returns = await ReturnRequest.find({ user: userId })
                .populate({
                    path: 'order',
                    select: 'items total_price status',
                    populate: {
                        path: 'items.product',
                        select: 'name price',
                    },
                })
                .select('reason status createdAt images')
                .sort({ createdAt: -1 })
                .lean();

            res.json({ 
                success: true, 
                returns: returns || [],
                count: returns.length
            });
        } catch (error) {
            console.error('Error in getUserReturns:', error);
            res.status(500).json({ 
                success: false, 
                message: error.message || 'Failed to get user return requests',
                returns: []
            });
        }
    },
};

module.exports = returnController;

const Coupon = require('../models/Coupon');
const couponController = {
    createCoupon: async (req, res) => {
        try {
            const { name, discount, expire } = req.body;
            if (!name || !discount || !expire) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: name, discount, expire',
                });
            }

            // Validate discount
            if (isNaN(discount) || discount <= 0 || discount > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Discount must be a number between 0 and 100',
                });
            }

            const newCoupon = await Coupon.create({
                ...req.body,
                expire: expire,
            });

            return res.status(201).json({
                success: true,
                newCoupon,
            });
        } catch (error) {
            console.error('Error in createCoupon:', error);
            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: 'Coupon name already exists',
                });
            }

            return res.status(500).json({
                success: false,
                message: error.message || 'Internal server error',
            });
        }
    },
    getCoupons: async (req, res) => {
        try {
            const coupons = await Coupon.find()
                .select('-createdAt -updatedAt')
                .sort({ expire: 1 })
                .lean();
            return res.status(200).json({
                success: true,
                coupons: coupons || [],
            });
        } catch (error) {
            console.error('Error in getCoupons:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to get coupons',
                coupons: []
            });
        }
    },
    updateCoupon: async (req, res) => {
        try {
            const { id } = req.params;
            const mongoose = require('mongoose');
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid coupon ID format',
                });
            }
            
            if (Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update',
                });
            }

            const coupon = await Coupon.findById(id);
            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Coupon not found',
                });
            }

            const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
            return res.status(200).json({
                success: true,
                updatedCoupon,
            });
        } catch (error) {
            console.error('Error in updateCoupon:', error);
            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: 'Coupon name already exists',
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to update coupon',
            });
        }
    },
    deleteCoupon: async (req, res) => {
        try {
            const { id } = req.params;
            const mongoose = require('mongoose');
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid coupon ID format',
                });
            }
            
            const coupon = await Coupon.findById(id);
            if (!coupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Coupon not found',
                });
            }
            
            const response = await Coupon.findByIdAndDelete(id);
            return res.json({
                success: true,
                message: 'Coupon deleted successfully',
            });
        } catch (error) {
            console.error('Error in deleteCoupon:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete coupon',
            });
        }
    },
};

module.exports = couponController;

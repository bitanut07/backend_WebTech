const Coupon = require('../models/Coupon');
const couponController = {
    createCoupon: async (req, res) => {
        const { name, discount, expire } = req.body;
        if (!name || !discount || !expire) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
            });
        }

        try {
            const newCoupon = await Coupon.create({
                ...req.body,
                expire: expire,
            });

            return res.status(200).json({
                success: true,
                newCoupon,
            });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: 'Coupon name already exists',
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
            });
        }
    },
    getCoupons: async (req, res) => {
        const coupons = await Coupon.find().select('-createdAt -updatedAt');
        return res.status(200).json({
            success: !!coupons,
            coupons: coupons ? coupons : 'Get coupons failed!!',
        });
    },
    updateCoupon: async (req, res) => {
        const { id } = req.params;
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Missing fields!!',
            });
        }

        try {
            const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, { new: true });
            if (!updatedCoupon) {
                return res.status(404).json({
                    success: false,
                    message: 'Coupon not found with the given ID',
                });
            }

            return res.status(200).json({
                success: true,
                updatedCoupon,
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
    deleteCoupon: async (req, res) => {
        const { id } = req.params;
        try {
            const response = await Coupon.findByIdAndDelete(id);
            return res.json({
                success: !!response,
                message: response ? response : 'Delete coupon failed!!',
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    },
};

module.exports = couponController;

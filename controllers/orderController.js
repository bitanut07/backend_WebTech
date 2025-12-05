const Order = require('../models/Order');
const crypto = require('crypto');
const MyError = require('../error.js');
const PendingPayment = require('../models/PendingPayment.js');
const axios = require('axios');
const orderController = {
    createOrder: async (req, res) => {
        try {
            const { id } = req.user;
            const { infoReceive, items, total_price, payment_method, coupon } = req.body;

            // Validation
            if (!infoReceive || !items || !total_price || !payment_method) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: infoReceive, items, total_price, payment_method'
                });
            }

            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Items must be a non-empty array'
                });
            }

            const newOrder = await Order.create({
                items: items,
                total_price: total_price,
                info_receive: infoReceive,
                order_by: id,
                address_shipping: infoReceive.address,
                payment_method: payment_method,
                coupon: coupon || null,
                discount: coupon ? total_price * coupon.discount : 0,
            });

            return res.status(201).json({
                success: true,
                newOrder: newOrder
            });
        } catch (error) {
            console.error('Error in createOrder:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Error creating order' 
            });
        }
    },
    updateStatus: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID format'
                });
            }
            
            if (!status) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing status',
                });
            }
            
            const validStatuses = ['Processing', 'confirmed ', 'Shipped', 'Delivered', 'Return Pending', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status value'
                });
            }
            
            const order = await Order.findById(id);
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
            
            const response = await Order.findByIdAndUpdate(id, { status }, { new: true });
            return res.json({
                success: true,
                order: response
            });
        } catch (error) {
            console.error('Error in updateStatus:', error);
            next(new MyError(500, error.message, error.stack));
        }
    },
    getOrderUser: async (req, res, next) => {
        try {
            const { id } = req.user;
            const orders = await Order.find({ order_by: id })
                .populate({
                    path: 'items.product',
                    select: 'name price thumbnail',
                })
                .sort({ date_order: -1 })
                .lean();

            res.json({
                success: true,
                orders: orders || [],
                count: orders.length
            });
        } catch (error) {
            console.error('Error in getOrderUser:', error);
            next(new MyError(500, error.message, error.stack));
        }
    },
    getOrderAdmin: async (req, res, next) => {
        try {
            const orders = await Order.find()
                .populate('order_by', 'fullName email')
                .populate({
                    path: 'items.product',
                    select: 'name price thumbnail',
                })
                .sort({ date_order: -1 })
                .lean();
                
            res.json({
                success: true,
                orders: orders || [],
                count: orders.length
            });
        } catch (error) {
            console.error('Error in getOrderAdmin:', error);
            next(new MyError(500, error.message, error.stack));
        }
    },
    getOrderById: async (req, res, next) => {
        try {
            const orderId = req.params.id;
            
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(orderId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid order ID format'
                });
            }
            
            const order = await Order.findById(orderId)
                .populate('order_by', 'fullName email phone')
                .populate({
                    path: 'items.product',
                    select: 'name price listImage',
                })
                .lean();
                
            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order not found'
                });
            }
            
            return res.json({
                success: true,
                order: order
            });
        } catch (error) {
            console.error('Error in getOrderById:', error);
            next(new MyError(500, error.message, error.stack));
        }
    },
    // getRevenueReport: async (req, res, next) => {
    //     try {
    //         const { year, month } = req.body;
    //         const startDate = new Date(year, month ? month - 1 : 0, 1);
    //         const endDate = month ? new Date(year, month, 0) : new Date(year + 1, 0, 1);

    //         const matchQuery = {
    //             date_order: {
    //                 $gte: startDate,
    //                 $lte: endDate,
    //             },
    //         };

    //         const revenueReport = await Order.aggregate([
    //             {
    //                 $match: matchQuery,
    //             },
    //             {
    //                 $group: {
    //                     _id: month ? { day: { $dayOfMonth: '$date_order' } } : { month: { $month: '$date_order' } },
    //                     totalRevenue: { $sum: '$total_price' },
    //                     totalOrders: { $sum: 1 },
    //                 },
    //             },
    //             {
    //                 $sort: { _id: 1 },
    //             },
    //         ]);

    //         return res.json({
    //             success: true,
    //             revenueReport,
    //         });
    //     } catch (error) {
    //         console.error('Error generating report:', error);
    //         return res.status(500).json({
    //             success: false,
    //             msg: 'Có lỗi xảy ra khi tạo báo cáo',
    //         });
    //     }
    // },
    getRevenueReport: async (req, res, next) => {
        try {
            const { year, month } = req.body;
            const startDate = new Date(year, month ? month - 1 : 0, 1);
            const endDate = month ? new Date(year, month, 0) : new Date(year + 1, 0, 1);

            console.log('Date Range:', {
                startDate,
                endDate,
                year,
                month,
                isMonthMode: !!month,
            });

            const matchQuery = {
                date_order: {
                    $gte: startDate,
                    $lte: endDate,
                },
            };

            const groupStage = month
                ? {
                      _id: { day: { $dayOfMonth: '$date_order' } },
                      totalRevenue: { $sum: '$total_price' },
                      totalOrders: { $sum: 1 },
                  }
                : {
                      _id: { month: { $month: '$date_order' } },
                      totalRevenue: { $sum: '$total_price' },
                      totalOrders: { $sum: 1 },
                  };

            const revenueReport = await Order.aggregate([
                {
                    $match: matchQuery,
                },
                {
                    $group: groupStage,
                },
                {
                    $sort: { '_id.day': 1, '_id.month': 1 },
                },
            ]);

            console.log('Revenue Report:', revenueReport);

            return res.json({
                success: true,
                revenueReport,
            });
        } catch (error) {
            console.error('Error generating report:', error);
            return res.status(500).json({
                success: false,
                msg: 'Có lỗi xảy ra khi tạo báo cáo',
            });
        }
    },
    initiatePayment: async (req, res) => {
        try {
            const { orderData } = req.body;
            orderData.address_shipping = orderData.infoReceive.address
            orderData.info_receive = orderData.infoReceive;
            delete orderData.infoReceive;
            console.log("orderData: ", orderData)
            const pendingPayment = await PendingPayment.create({
                userId: req.user.id,
                orderData,
                momoOrderId: `MOMO_${Date.now()}`,
            });

            const accessKey = process.env.ACCESS_KEY_PAYMENT;
            const secretKey = process.env.SECRET_KEY_PAYMENT;
            const partnerCode = 'MOMO';
            const orderId = pendingPayment.momoOrderId;
            const requestId = orderId;
            const amount = orderData.total_price;
            const orderInfo = 'Thanh toan don hang';
            const redirectUrl = `${process.env.URL_CLIENT}/user/order-check`;
            const ipnUrl = `${process.env.IPN_URL}/order/callback`;
            const requestType = 'payWithMethod';

            const rawSignature =
                'accessKey=' +
                accessKey +
                '&amount=' +
                amount +
                '&extraData=' +
                '&ipnUrl=' +
                ipnUrl +
                '&orderId=' +
                orderId +
                '&orderInfo=' +
                orderInfo +
                '&partnerCode=' +
                partnerCode +
                '&redirectUrl=' +
                redirectUrl +
                '&requestId=' +
                requestId +
                '&requestType=' +
                requestType;

            const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            const response = await axios({
                method: 'POST',
                url: 'https://test-payment.momo.vn/v2/gateway/api/create',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: {
                    partnerCode,
                    partnerName: 'Test',
                    storeId: 'MomoTestStore',
                    requestId,
                    amount,
                    orderId,
                    orderInfo,
                    redirectUrl,
                    ipnUrl,
                    lang: 'vi',
                    requestType,
                    autoCapture: true,
                    extraData: '',
                    orderGroupId: '',
                    signature,
                },
            });

            return res.json({
                success: true,
                data: response.data,
            });
        } catch (error) {
            console.error('Payment initiation error:', error);
            return res.status(500).json({
                success: false,
                message: 'Có lỗi xảy ra khi khởi tạo thanh toán',
            });
        }
    },

    callbackPayment: async (req, res) => {
        try {
            const {
                orderId,
                requestId,
                amount,
                orderInfo,
                orderType,
                transId,
                resultCode,
                message,
                payType,
                responseTime,
                extraData,
                signature,
            } = req.body;
            console.log('req.bodY: ', req.body);
            if (resultCode === 0) {
                const pendingPayment = await PendingPayment.findOne({
                    momoOrderId: orderId,
                });

                if (!pendingPayment) {
                    return res.status(404).json({
                        message: 'Không tìm thấy thông tin thanh toán',
                    });
                }

                const newOrder = await Order.create({
                    order_by: pendingPayment.userId,
                    date_order: new Date(),
                    total_price: pendingPayment.orderData.total_price,
                    status: 'Processing',
                    info_receive: pendingPayment.orderData.info_receive,
                    address_shipping: pendingPayment.orderData.address_shipping,
                    shipping_fee: pendingPayment.orderData.shipping_fee,
                    discount: pendingPayment.orderData.discount,
                    items: pendingPayment.orderData.items,
                    payment_method: 'payment_online',
                    is_payment: true,
                });

                await pendingPayment.deleteOne();

                return res.json({
                    message: 'Tạo đơn hàng thành công',
                    orderId: newOrder._id,
                });
            } else {
                return res.status(400).json({
                    message: `Thanh toán thất bại: ${message}`,
                    resultCode,
                });
            }
        } catch (error) {
            console.error('Callback error:', error);
            return res.status(500).json({
                message: 'Có lỗi xử lý callback',
            });
        }
    },
    getOrdersByUserId: async (req, res, next) => {
        try {
            const id = req.params.id;
            const orders = await Order.find({ order_by: id });

            res.json({
                success: orders.length > 0,
                orders: orders.length > 0 ? orders : 'Order not found',
            });
        } catch (error) {
            next(new MyError(500, error.message, error.stack));
        }
    },
};
module.exports = orderController;

const router = require('express').Router();
const orderController = require('../controllers/orderController');
const middlewareController = require('../controllers/middlewareController');

router.post('/', middlewareController.verifyToken, orderController.createOrder);
router.get('/', middlewareController.verifyToken, orderController.getOrderUser);
router.get(
    '/allOrders',
    [middlewareController.verifyToken, middlewareController.isAdmin],
    orderController.getOrderAdmin,
);
router.post(
    '/report',
    [middlewareController.verifyToken, middlewareController.isAdmin],
    orderController.getRevenueReport,
),
router.post('/payment', middlewareController.verifyToken, orderController.initiatePayment);
router.post('/callback', orderController.callbackPayment);

router.put('/:id', [middlewareController.verifyToken], orderController.updateStatus);

router.get('/user-order/:id', middlewareController.verifyToken, orderController.getOrdersByUserId)

router.get('/:id', middlewareController.verifyToken, orderController.getOrderById);

module.exports = router;

const router = require('express').Router();
const couponController = require('../controllers/couponController');
const middlewareController = require('../controllers/middlewareController');
router.post('/', [middlewareController.verifyToken, middlewareController.isAdmin], couponController.createCoupon);
router.get('/', couponController.getCoupons);
router.put('/:id', [middlewareController.verifyToken, middlewareController.isAdmin], couponController.updateCoupon);
router.delete('/:id', [middlewareController.verifyToken, middlewareController.isAdmin], couponController.deleteCoupon);
module.exports = router;

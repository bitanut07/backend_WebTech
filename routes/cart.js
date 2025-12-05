const router = require('express').Router();
const cartController = require('../controllers/cartController');
const middlewareController = require('../controllers/middlewareController');

router.post('/', middlewareController.verifyToken, cartController.addToCart);
router.get('/', middlewareController.verifyToken, cartController.showToCart);
router.put('/', middlewareController.verifyToken, cartController.updateCart);
router.delete('/', middlewareController.verifyToken, cartController.removeItem);

module.exports = router;

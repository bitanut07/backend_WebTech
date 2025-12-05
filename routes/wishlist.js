const router = require('express').Router();
const middlewareController = require('../controllers/middlewareController.js');
const wishlistController = require('../controllers/wishlistController.js');
router.get('/', middlewareController.verifyToken, wishlistController.getWishlist);
router.post('/', middlewareController.verifyToken, wishlistController.addProductToWishlist);
router.delete('/', middlewareController.verifyToken, wishlistController.removeProductToWishlist);
module.exports = router;

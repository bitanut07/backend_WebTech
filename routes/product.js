const router = require('express').Router();
const productController = require('../controllers/productController');
const middlewareController = require('../controllers/middlewareController');
const uploader = require('../config/cloudinary.config.js');
router.get('/feature-product', productController.getFeaturedProducts);
router.get('/product-similar', productController.getProductsBySeries);
router.get('/product-category/:category', productController.getProductByCategory);


router.post(
    '/',
    [middlewareController.verifyToken, middlewareController.isAdmin],
    uploader.fields([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'listImage', maxCount: 10 },
    ]),
    productController.addProduct,
);


router.get('/', productController.getAllProducts);
router.put('/ratings', middlewareController.verifyToken, productController.ratings);
router.get('/:id', productController.getAnProductByID);
router.delete('/:id', [middlewareController.verifyToken, middlewareController.isAdmin], productController.deleteProduct)
module.exports = router;

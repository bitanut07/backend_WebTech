const router = require('express').Router();
const userController = require('../controllers/userController');
const middlewareController = require('../controllers/middlewareController');
const uploader = require('../config/cloudinary.config.js');

router.get('/allUsers', [middlewareController.verifyToken, middlewareController.isAdmin], userController.getAllUsers);
router.get('/forgot-password', userController.forgotPassword);
router.put('/reset-password', userController.resetPassword);
router.get('/user-current', middlewareController.verifyToken, userController.getUserCurrent);
router.put('/update-user', middlewareController.verifyToken, userController.updateUser);
router.put('/update-address', middlewareController.verifyToken, userController.updateUserAddress);
router.put('/wishlist/:pid', middlewareController.verifyToken, userController.updateWishlist);
router.get('/user-detail/:id', [middlewareController.verifyToken, middlewareController.isAdmin], userController.getDetailForAdmin)
router.put('/upload-avatar', middlewareController.verifyToken, uploader.single('avatar') , userController.uploadAvatar)
router.delete(
    '/delete/:id',
    [middlewareController.verifyToken, middlewareController.isAdmin],
    userController.deleteUser,
);

module.exports = router;
router.put('/block', [middlewareController.verifyToken, middlewareController.isAdmin], userController.blockUser);
router.put('/change-password', 
    middlewareController.verifyToken, 
    userController.changePassword
);
router.get('/wishlist', middlewareController.verifyToken, userController.getWishlist);

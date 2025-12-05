const router = require('express').Router();
const middlewareController = require('../controllers/middlewareController');
const authController = require('../controllers/authController');
router.post('/register', authController.registerUser);
// router.get('/verify-register/:token', authController.verifyRegister);
router.post('/login', authController.loginUser);
router.post('/refreshToken', authController.refreshToken);
router.post('/verify-otp', authController.verifyOtp)
router.post('/verify-change-pass', authController.verifyChangePassword)
router.post('/logout', authController.logoutUser);
router.get('/google', authController.googleLogin)
module.exports = router;

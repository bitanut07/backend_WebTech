// return.routes.js
const router = require('express').Router();
const returnController = require('../controllers/returnController');
const middlewareController = require('../controllers/middlewareController');
const uploader = require('../config/cloudinary.config.js');

// User routes
router.post('/', middlewareController.verifyToken, uploader.array('images', 5), returnController.createReturn);

router.get('/user', middlewareController.verifyToken, returnController.getUserReturns);

// Admin routes
router.get('/admin', [middlewareController.verifyToken, middlewareController.isAdmin], returnController.getReturns);

router.get(
    '/admin/:id',
    [middlewareController.verifyToken, middlewareController.isAdmin],
    returnController.getReturnDetail,
);

router.put(
    '/admin/:id',
    [middlewareController.verifyToken, middlewareController.isAdmin],
    returnController.processReturn,
);

module.exports = router;

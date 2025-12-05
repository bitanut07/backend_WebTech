const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const middlewareController = require('../controllers/middlewareController')

router.get('/:userId', notificationController.getUserNotifications);
// router.post('/', notificationController.createNotification)
router.put('/mark-read/:notificationId', middlewareController.verifyToken, notificationController.markAsRead)
router.post('/create', notificationController.createNotifications)
router.delete('/delete/:notificationId', middlewareController.verifyToken, notificationController.deleteNotification)
router.put('/mark-all-read', middlewareController.verifyToken, notificationController.markAllAsRead)


module.exports = router;

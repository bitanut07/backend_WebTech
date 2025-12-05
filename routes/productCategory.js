const router = require('express').Router()
const categoryController = require('../controllers/categoryController')
const middlewareController = require('../controllers/middlewareController')
router.post('/', [middlewareController.verifyToken, middlewareController.isAdmin], categoryController.createCategory)
router.get('/', categoryController.getCategories)
router.delete('/:id', [middlewareController.verifyToken, middlewareController.isAdmin], categoryController.deleteCategory)
router.put('/:id', [middlewareController.verifyToken, middlewareController.isAdmin], categoryController.updateCategory)
module.exports = router
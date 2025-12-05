const ProductCategory = require('../models/ProductCategory')

const categoryController = {
    createCategory: async (req, res) => {
        try {
            const response = await ProductCategory.create(req.body);
            return res.status(200).json({ success: true, newCategory: response });
        } catch (error) {
            const message = error.name === 'SequelizeUniqueConstraintError'
                ? "Category with this title already exists!"
                : "An error occurred while creating category";
            return res.status(500).json({ success: false, message });
        }
    },

    getCategories: async (req, res) => {
        try {
            const response = await ProductCategory.find().select('title')
            return res.status(200).json({
                success: true,
                categories: response
            })

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error
            })
        }

    },
    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params
            const response = await ProductCategory.findByIdAndDelete(id)
            return res.status(200).json({
                success: true,
                message: "Delete successfully"
            })
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error
            })
        }
    },
    updateCategory: async (req, res) => {
        try {
            const { id } = req.params
            const response = await ProductCategory.findByIdAndUpdate(id, req.body, { new: true })
            return res.status(200).json({
                success: true,
                update: response
            })
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error
            })
        }
    }
}

module.exports = categoryController
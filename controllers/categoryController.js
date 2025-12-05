const ProductCategory = require('../models/ProductCategory')
const mongoose = require('mongoose');

const categoryController = {
    createCategory: async (req, res) => {
        try {
            const { title } = req.body;
            if (!title) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Category title is required' 
                });
            }
            
            const response = await ProductCategory.create({ title });
            return res.status(200).json({ 
                success: true, 
                newCategory: response 
            });
        } catch (error) {
            console.error('Error in createCategory:', error);
            if (error.code === 11000) {
                return res.status(409).json({ 
                    success: false, 
                    message: "Category with this title already exists!" 
                });
            }
            return res.status(500).json({ 
                success: false, 
                message: error.message || "An error occurred while creating category" 
            });
        }
    },

    getCategories: async (req, res) => {
        try {
            const response = await ProductCategory.find().select('title').lean();
            return res.status(200).json({
                success: true,
                categories: response || []
            });
        } catch (error) {
            console.error('Error in getCategories:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to get categories',
                categories: []
            });
        }
    },
    
    deleteCategory: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID format'
                });
            }
            
            const category = await ProductCategory.findById(id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }
            
            const response = await ProductCategory.findByIdAndDelete(id);
            return res.status(200).json({
                success: true,
                message: "Delete successfully"
            });
        } catch (error) {
            console.error('Error in deleteCategory:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete category'
            });
        }
    },
    
    updateCategory: async (req, res) => {
        try {
            const { id } = req.params;
            
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID format'
                });
            }
            
            if (Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
            }
            
            const category = await ProductCategory.findById(id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }
            
            const response = await ProductCategory.findByIdAndUpdate(id, req.body, { new: true });
            return res.status(200).json({
                success: true,
                update: response
            });
        } catch (error) {
            console.error('Error in updateCategory:', error);
            if (error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: 'Category title already exists'
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message || 'Failed to update category'
            });
        }
    }
}

module.exports = categoryController
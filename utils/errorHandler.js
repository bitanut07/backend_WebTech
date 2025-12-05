/**
 * Standardized error handler utility
 * Provides consistent error responses across all API endpoints
 */

const errorHandler = {
    /**
     * Handle and format errors consistently
     */
    handleError: (error, req, res, customMessage = null) => {
        console.error('=== API Error ===');
        console.error('URL:', req.originalUrl);
        console.error('Method:', req.method);
        console.error('Error:', error);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
        console.error('================');

        // Mongoose validation error
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: customMessage || 'Validation error',
                errors: Object.values(error.errors).map(e => e.message)
            });
        }

        // Mongoose cast error (invalid ID)
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: customMessage || 'Invalid ID format'
            });
        }

        // Duplicate key error
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: customMessage || 'Duplicate entry',
                field: Object.keys(error.keyPattern)[0]
            });
        }

        // JWT errors
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: customMessage || 'Authentication failed'
            });
        }

        // Default error
        return res.status(error.status || 500).json({
            success: false,
            message: customMessage || error.message || 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { 
                error: error.message,
                stack: error.stack 
            })
        });
    },

    /**
     * Validate required fields
     */
    validateRequired: (data, requiredFields) => {
        const missing = requiredFields.filter(field => !data[field]);
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
    },

    /**
     * Validate ObjectId
     */
    validateObjectId: (id, fieldName = 'ID') => {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`Invalid ${fieldName} format`);
        }
        return true;
    },

    /**
     * Safe async handler wrapper
     */
    asyncHandler: (fn) => {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch((error) => {
                errorHandler.handleError(error, req, res);
            });
        };
    }
};

module.exports = errorHandler;


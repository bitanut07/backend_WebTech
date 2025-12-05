const Wishlist = require('../models/Wishlist.js');
const MyError = require('../error.js');
const wishlistController = {
    getWishlist: async (req, res, next) => {
        try {
            const { id } = req.user;
            const wishlist = await Wishlist.findOne({ userID: id }).populate(
                'products',
                'name thumbnail price avgStar',
            );
            res.json({
                success: true,
                wishlist: wishlist ? wishlist : { products: [] },
            });
        } catch (error) {
            console.error('Error in getWishlist:', error);
            next(new MyError(500, error.message, error.stack));
        }
    },
    addProductToWishlist: async (req, res, next) => {
        try {
            const { id } = req.user;
            const productID = req.body.productID;
            
            const mongoose = require('mongoose');
            if (!productID || !mongoose.Types.ObjectId.isValid(productID)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID',
                });
            }
            
            let userWishlist = await Wishlist.findOne({ userID: id });
            if (!userWishlist) {
                userWishlist = await Wishlist.create({
                    userID: id,
                    products: [productID],
                });
            } else {
                if (!userWishlist.products.includes(productID)) {
                    userWishlist.products.push(productID);
                    await userWishlist.save();
                }
            }
            return res.json({
                success: true,
                userWishlist,
            });
        } catch (error) {
            console.error('Error in addProductToWishlist:', error);
            next(new MyError(500, error.message, error.stack));
        }
    },
    removeProductToWishlist: async (req, res, next) => {
        try {
            const { id } = req.user;
            const productID = req.body.productID;
            
            const mongoose = require('mongoose');
            if (!productID || !mongoose.Types.ObjectId.isValid(productID)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID',
                });
            }
            
            let userWishlist = await Wishlist.findOne({ userID: id });
            if (!userWishlist) {
                return res.status(404).json({
                    success: false,
                    message: 'Wishlist not found',
                });
            }
            
            const initialLength = userWishlist.products.length;
            userWishlist.products = userWishlist.products.filter((id) => id.toString() !== productID);
            
            if (userWishlist.products.length === initialLength) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found in wishlist',
                });
            }
            
            await userWishlist.save();

            res.status(200).json({
                success: true,
                userWishlist,
            });
        } catch (error) {
            console.error('Error in removeProductToWishlist:', error);
            next(new MyError(500, error.message, error.stack));
        }
    },
};

module.exports = wishlistController;

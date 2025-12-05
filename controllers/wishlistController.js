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
                success: wishlist ? true : false,
                wishlist: wishlist ? wishlist : [],
            });
        } catch (error) {
            next(new MyError(500, error.message, error.stack));
        }
    },
    addProductToWishlist: async (req, res, next) => {
        try {
            const { id } = req.user;
            const productID = req.body.productID;
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
            next(new MyError(500, error.message, error.stack));
        }
    },
    removeProductToWishlist: async (req, res, next) => {
        try {
            const { id } = req.user;
            const productID = req.body.productID;
            let userWishlist = await Wishlist.findOne({ userID: id });
            if (!userWishlist) {
                return res.json({
                    success: false,
                    message: 'Not found',
                });
            }
            userWishlist.products = userWishlist.products.filter((id) => id.toString() !== productID);
            await userWishlist.save();

            res.status(200).json({
                success: true,
                userWishlist,
            });
        } catch (error) {
            next(new MyError(500, error.message, error.stack));
        }
    },
};

module.exports = wishlistController;

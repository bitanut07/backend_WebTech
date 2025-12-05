const mongoose = require('mongoose');
const shoppingCart = require('../models/ShoppingCart');
const Product = require('../models/Product');

const cartController = {
    addToCart: async (req, res) => {
        let ProductId = req.body.id;
        let quantity = isNaN(req.body.quantity) ? 0 : parseInt(req.body.quantity);
        let color = req.body.color;

        if (!mongoose.Types.ObjectId.isValid(ProductId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        try {
            if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
                return res.status(400).json({ message: 'Invalid user ID' });
            }

            let newProduct = await Product.findById(ProductId);

            let Cart = await shoppingCart.findOne({ user: req.user.id });
            if (!Cart) {
                Cart = new shoppingCart({
                    user: req.user.id,
                    cart: {},
                });
            }

            if (Cart.cart.items.length === 0) {
                Cart.cart.items.push({
                    product: newProduct,
                    quantity: quantity,
                    total: newProduct.price * quantity,
                    color: color,
                });
            } else {
                let index = Cart.cart.items.findIndex(
                    (item) => item.product.equals(newProduct.id) && item.color === color,
                );
                if (index === -1) {
                    Cart.cart.items.push({
                        product: newProduct,
                        quantity: quantity,
                        total: newProduct.price * quantity,
                        color: color,
                    });
                } else {
                    Cart.cart.items[index].quantity += quantity;
                    Cart.cart.items[index].total = Cart.cart.items[index].quantity * newProduct.price;
                }
            }

            Cart.cart.quantity = Cart.cart.items.reduce((total, item) => total + item.quantity, 0);
            Cart.cart.subtotal = Cart.cart.items.reduce((total, item) => total + item.total, 0);

            await Cart.save();
            return res.json({ 
                success: true,
                quantity: Cart.cart.quantity 
            });
        } catch (error) {
            console.error('Error in addToCart:', error);
            return res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to add product to cart' 
            });
        }
    },
    // Hiển thị giỏ hàng
    showToCart: async (req, res) => {
        try {
            let Cart = await shoppingCart.findOne({ user: req.user.id });
            if (!Cart || !Cart.cart || !Cart.cart.items) {
                return res.status(200).json({
                    success: true,
                    items: [],
                    quantity: 0,
                    subtotal: 0,
                });
            }
            
            const items = await Promise.all(
                Cart.cart.items.map(async (item) => {
                    try {
                        const product = await Product.findById(item.product);
                        if (!product) {
                            return null; // Skip deleted products
                        }
                        return {
                            product,
                            color: item.color,
                            quantity: item.quantity,
                            total: item.total,
                        };
                    } catch (err) {
                        console.error('Error loading product:', err);
                        return null;
                    }
                }),
            );
            
            // Filter out null items (deleted products)
            const validItems = items.filter(item => item !== null);
            
            return res.json({
                success: true,
                items: validItems,
                quantity: Cart.cart.quantity || 0,
                subtotal: Cart.cart.subtotal || 0,
            });
        } catch (error) {
            console.error('Error in showToCart:', error);
            return res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to get cart' 
            });
        }
    },
    // Cập nhật giỏ hàng
    updateCart: async (req, res) => {
        let ProductId = req.body.id;
        let quantity = isNaN(req.body.quantity) ? 0 : parseInt(req.body.quantity);
        let color = req.body.color;

        if (!mongoose.Types.ObjectId.isValid(ProductId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }
        try {
            if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
                return res.status(400).json({ message: 'Invalid user ID' });
            }
            Cart = await shoppingCart.findOne({ user: req.user.id });
            if (!Cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            //Kiểm tra xem sản phẩm có thỏa điều kiện để update không
            let storedProduct = Cart.cart.items.find((item) => item.product.equals(ProductId) && item.color === color);
            if (quantity < 1) {
                return res.status(400).json({ message: 'Invalid quantity' });
            }
            if (!storedProduct) {
                return res.status(404).json({ message: 'Product not found in Cart' });
            }

            //Cập nhật lại số lượng sản phẩm
            storedProduct.quantity = quantity;

            let product = await Product.findById(ProductId);
            storedProduct.total = quantity * product.price;

            //Cập nhật lại số lượng sản phẩm trong giỏ hàng
            Cart.cart.quantity = Cart.cart.items.reduce((total, item) => total + item.quantity, 0);
            Cart.cart.subtotal = Cart.cart.items.reduce((total, item) => total + item.total, 0);

            await Cart.save();
            return res.status(200).json({ 
                success: true,
                message: 'Update cart successfully' 
            });
        } catch (error) {
            console.error('Error in updateCart:', error);
            return res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to update cart' 
            });
        }
    },
    removeItem: async (req, res) => {
        let ProductId = req.body.id;
        let color = req.body.color;

        if (!mongoose.Types.ObjectId.isValid(ProductId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        try {
            if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
                return res.status(400).json({ message: 'Invalid user ID' });
            }

            let Cart = await shoppingCart.findOne({ user: req.user.id });
            if (!Cart) {
                return res.status(404).json({ message: 'Cart not found' });
            }

            // Lọc sản phẩm cần xóa
            let updatedItems = Cart.cart.items.filter(
                (item) => !(item.product.equals(ProductId) && item.color === color),
            );

            if (updatedItems.length === Cart.cart.items.length) {
                return res.status(404).json({ message: 'Product not found in cart' });
            }

            Cart.cart.items = updatedItems;
            Cart.cart.quantity = Cart.cart.items.reduce((total, item) => total + item.quantity, 0);
            Cart.cart.subtotal = Cart.cart.items.reduce((total, item) => total + item.total, 0);

            await Cart.save();
            return res.status(200).json({ 
                success: true,
                message: 'Remove product from cart successfully' 
            });
        } catch (error) {
            console.error('Error in removeItem:', error);
            return res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to remove item from cart' 
            });
        }
    },
};

module.exports = cartController;

const jwt = require('jsonwebtoken');
const middlewareController = {
    verifyToken: (req, res, next) => {
        const token = req.headers['authorization'];
        if (token) {
            const accessToken = token.split(' ')[1];
            jwt.verify(accessToken, process.env.ACCESS_KEY, (err, user) => {
                if (err) {
                    return res.status(403).json({
                        success: false,
                        mes: "'Token is not valid'",
                    });
                }
                req.user = user;

                next();
            });
        } else {
            return res.status(401).json({
                success: false,
                mes: "You're not authenticated",
            });
        }
    },
    isAdmin: (req, res, next) => {
        const { admin } = req.user;
        if (!admin) {
            return res.status(401).json({
                success: false,
                mes: 'REQUIRE ADMIN ROLE',
            });
        }
        next();
    },

    //Khởi tạo giỏ hàng
    initializeCart: (req, res, next) => {
        req.session.cart = new Cart(req.session.cart ? req.session.cart : {});
        res.locals.quantity = req.session.cart.quantity;
        next();
    },
};
module.exports = middlewareController;

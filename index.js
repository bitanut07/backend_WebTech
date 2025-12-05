const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const dotenv = require('dotenv');
const routerProduct = require('./routes/product');
const routerUser = require('./routes/user');
const authRoute = require('./routes/auth');
const cartRoute = require('./routes/cart');
const categoryRoute = require('./routes/productCategory');
const couponRoute = require('./routes/coupon');
const orderRoute = require('./routes/order');
const wishlistRoute = require('./routes/wishlist.js');
const notificationRoute = require('./routes/notification.js');
const returnOrderRoute = require('./routes/returnOrder.js');
const session = require('express-session');
const { createServer } = require('http');
const { Server } = require('socket.io');
dotenv.config();
const dbConnect = require('./config/dbconnect.js');
const { initializeSocket } = require('./socket');
const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(morgan('common'));

// CORS configuration - cho phép tất cả origins trong development, chỉ production trong production
const corsOptions = {
    origin: process.env.URL_CLIENT || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

dbConnect();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
    session({
        secret: 'Group16',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 20 * 60 * 1000,
        },
    }),
);
// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'TechShop API Server',
        status: 'running',
        version: '1.0.0',
        baseURL: req.protocol + '://' + req.get('host'),
        endpoints: {
            health: '/health',
            products: '/product',
            productsAlias: '/products', // Alias for /product
            users: '/user',
            auth: '/auth',
            cart: '/cart',
            category: '/category',
            coupon: '/coupon',
            order: '/order',
            wishlist: '/wishlist',
            notification: '/notification',
            returnOrder: '/returnOrder'
        },
        documentation: {
            note: 'All endpoints support standard HTTP methods (GET, POST, PUT, DELETE, PATCH)',
            authentication: 'Most endpoints require authentication via Bearer token in Authorization header',
            cors: 'CORS is enabled for configured origins'
        }
    });
});

// Alias for /products -> /product
app.use('/products', routerProduct);

app.use('/product', routerProduct);
app.use('/user', routerUser);
app.use('/auth', authRoute);
app.use('/cart', cartRoute);
app.use('/category', categoryRoute);
app.use('/coupon', couponRoute);
app.use('/order', orderRoute);
app.use('/wishlist', wishlistRoute);
app.use('/notification', notificationRoute);
app.use('/returnOrder', returnOrderRoute);

// Handle GET requests to /login and /auth/login (informational)
app.get('/login', (req, res) => {
    res.status(405).json({
        error: 'Method not allowed',
        message: 'Please use POST /auth/login for authentication'
    });
});

app.get('/auth/login', (req, res) => {
    res.status(405).json({
        error: 'Method not allowed',
        message: 'Please use POST /auth/login for authentication'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path,
    });
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

const httpServer = createServer(app);

initializeSocket(httpServer);

httpServer.listen(process.env.PORT_SERVER || 8000, () => {
    console.log('Server is running ...');
});

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

// CORS configuration - hỗ trợ multiple origins cho production
const allowedOrigins = process.env.URL_CLIENT 
    ? process.env.URL_CLIENT.split(',').map(url => url.trim())
    : ['http://localhost:3000', 'http://localhost:3001'];

// Log CORS configuration để debug
console.log('=== CORS Configuration ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('URL_CLIENT:', process.env.URL_CLIENT || 'Not set (using defaults)');
console.log('Allowed Origins:', allowedOrigins);
console.log('========================');

const corsOptions = {
    origin: function (origin, callback) {
        // Cho phép requests không có origin (mobile apps, Postman, etc.)
        if (!origin) {
            console.log('CORS: Allowing request without origin (Postman, mobile apps, etc.)');
            return callback(null, true);
        }
        
        // Log để debug
        console.log(`CORS: Checking origin: ${origin}`);
        console.log(`CORS: Allowed origins:`, allowedOrigins);
        
        // Cho phép nếu origin trong danh sách allowed hoặc đang ở development
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            console.log(`CORS: ✅ Allowing origin: ${origin}`);
            callback(null, true);
        } else {
            console.warn(`CORS: ❌ BLOCKED origin: ${origin}`);
            console.warn(`CORS: Allowed origins are:`, allowedOrigins);
            console.warn(`CORS: To fix, add this URL to URL_CLIENT env var in backend`);
            callback(new Error(`Not allowed by CORS. Origin: ${origin} not in allowed list. Please add it to URL_CLIENT environment variable.`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
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
// Session configuration cho production
const isProduction = process.env.NODE_ENV === 'production';
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'Group16',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: isProduction, // true cho HTTPS trong production
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 20 * 60 * 1000,
        },
    }),
);
// Root route
app.get('/', (req, res) => {
    // Detect HTTPS correctly (Render và các platform khác dùng proxy)
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
    const host = req.get('host');
    const baseURL = `${protocol}://${host}`;
    
    res.json({
        message: 'TechShop API Server',
        status: 'running',
        version: '1.0.0',
        baseURL: baseURL,
        cors: {
            allowedOrigins: allowedOrigins,
            configured: !!process.env.URL_CLIENT,
        },
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
    // Log error với thông tin chi tiết
    console.error('=== Error Handler ===');
    console.error('Error:', err);
    console.error('Request URL:', req.originalUrl);
    console.error('Request Method:', req.method);
    if (err.stack) {
        console.error('Error Stack:', err.stack);
    }
    console.error('===================');
    
    // Nếu là CORS error, trả về 403 với message rõ ràng
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: err.message,
            type: 'CORS_ERROR',
            hint: 'Please check URL_CLIENT environment variable in backend'
        });
    }
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { 
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
        }),
    });
});

const httpServer = createServer(app);

initializeSocket(httpServer);

httpServer.listen(process.env.PORT_SERVER || 8000, () => {
    console.log('Server is running ...');
});

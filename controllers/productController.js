const { get } = require('mongoose');
const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const ProductTypes = require('../models/ProductTypes');
const Laptop = require('../models/ProductTypes').Laptop;
const Phone = require('../models/ProductTypes').Phone;
const TV = require('../models/ProductTypes').TV;
const Watch = require('../models/ProductTypes').Watch;
const Camera = require('../models/ProductTypes').Camera;
const PC = require('../models/ProductTypes').PC;
const Monitor = require('../models/ProductTypes').Monitor;
const productModels = {
    Laptop,
    Phone,
    TV,
    Watch,
    Camera,
    PC,
    Monitor,
};

const productController = {
    addProduct: async (req, res) => {
        try {
            const { name, description, productType } = req.body;
            const thumbnail = req.files?.thumbnail?.[0]?.path;
            const listImage = req.files?.listImage?.map((el) => el.path);

            if (!name || !description || !thumbnail || !productType || !listImage || listImage.length === 0) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Missing required fields: name, description, thumbnail, productType, listImage' 
                });
            }

            const category = await ProductCategory.findOne({ title: productType });
            if (!category) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid product type' 
                });
            }
            
            const ProductModel = productModels[productType];
            if (!ProductModel) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid product type' 
                });
            }
            
            const newProduct = new ProductModel({
                ...req.body,
                thumbnail,
                listImage,
                productCategory: category._id,
            });
            
            const savedProduct = await newProduct.save();
            return res.status(201).json({
                success: true,
                product: savedProduct
            });
        } catch (error) {
            console.error('Error in addProduct:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to create product' 
            });
        }
    },

    // Lấy sản phẩm theo id
    getAnProductByID: async (req, res) => {
        try {
            const id = req.params.id;
            
            // Validate ObjectId
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid product ID format' 
                });
            }
            
            const product = await Product.findById(id).populate({
                path: 'ratings.postedBy',
                select: 'fullName avatar',
            });
            
            if (!product) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Không tìm thấy sản phẩm' 
                });
            }
            
            res.status(200).json({
                success: true,
                product
            });
        } catch (error) {
            console.error('Error in getAnProductByID:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to get product' 
            });
        }
    },

    // Lấy tất cả sản phẩm
    getAllProducts: async (req, res) => {
        try {
            let { page, per_page, productType, sortBy = 'avgStar', order = 'asc', ...filters } = req.query;

            // Cài đặt bộ lọc
            const query = {};
            if (productType) {
                query['productType'] = productType;
                productType = productType.toLowerCase();

                Object.keys(filters).forEach((key) => {
                    if (filters[key].includes(',')) {
                        // Nếu có dấu phẩy, chia thành mảng và sử dụng $regex cho mỗi phần tử
                        const values = filters[key].split(',').map((item) => item.trim());
                        filters[key] = {
                            $in: values.map((value) => new RegExp(value, 'i')),
                        };
                    } else {
                        // Nếu không có dấu phẩy, chỉ sử dụng $regex
                        filters[key] = { $regex: new RegExp(filters[key], 'i') };
                    }
                });

                switch (productType) {
                    case 'laptop': {
                        if (filters.brand) query['brand'] = filters.brand;
                        if (filters.ram) query['ram'] = filters.ram;
                        if (filters.CPU) query['CPU'] = filters.CPU;
                        if (filters.screen_size) query['screen_size'] = filters.screen_size;
                        if (filters.hard_drive) query['hard_drive'] = filters.hard_drive;
                        if (filters.graphics_card) query['graphics_card'] = filters.graphics_card;
                        break;
                    }
                    case 'phone': {
                        if (filters.brand) query['name'] = filters.brand;
                        if (filters.internal_storage) query['internal_storage'] = filters.internal_storage;
                        if (filters.RAM_capacity) query['RAM_capacity'] = filters.RAM_capacity;
                        if (filters.operating_system) query['operating_system'] = filters.operating_system;
                        if (filters.screen_size) query['screen_size'] = filters.screen_size;
                        if (filters.usage_demand) query['usage_demand'] = filters.usage_demand;
                        break;
                    }
                    case 'tv': {
                        if (filters.brand) query['brand'] = filters.brand;
                        if (filters.screen_size) query['screen_size'] = filters.screen_size;
                        if (filters.resolution) query['resolution'] = filters.resolution;
                        if (filters.screen_type) query['screen_type'] = filters.screen_type;
                        break;
                    }
                    case 'watch': {
                        if (filters.brand) query['brand'] = filters.brand;
                        if (filters.health_features) query['health_features'] = filters.health_features;
                        if (filters.compatibility) query['compatibility'] = filters.compatibility;
                        if (filters.strap_material) query['strap_material'] = filters.strap_material;
                        if (filters.battery_life) query['battery_life'] = filters.battery_life;
                        break;
                    }
                    case 'camera': {
                        if (filters.brand) query['brand'] = filters.brand;
                        if (filters.camera_type) query['camera_type'] = filters.camera_type;
                        if (filters.camera_resolution) query['camera_resolution'] = filters.camera_resolution;
                        if (filters.camera_sensor) query['camera_sensor'] = filters.camera_sensor;
                        if (filters.screen_size) query['screen_size'] = filters.screen_size;
                        break;
                    }
                    case 'pc': {
                        if (filters.brand) query['name'] = filters.brand;
                        if (filters.CPU) query['CPU'] = filters.CPU;
                        if (filters.RAM) query['RAM'] = filters.RAM;
                        if (filters.graphics_card) query['graphics_card'] = filters.graphics_card;
                        if (filters.hard_drive) query['hard_drive'] = filters.hard_drive;
                        break;
                    }
                    case 'monitor': {
                        if (filters.brand) query['name'] = filters.brand;
                        if (filters.Monitor_size) query['Monitor_size'] = filters.Monitor_size;
                        if (filters.refresh_rate) query['refresh_rate'] = filters.refresh_rate;
                        if (filters.screen_type) query['screen_type'] = filters.screen_type;
                        break;
                    }
                }
            }

            let sortQuery = {};
            if (sortBy === 'price') {
                sortQuery.price = order === 'desc' ? -1 : 1;
            } else if (sortBy === 'avgStar') {
                sortQuery.avgStar = order === 'desc' ? -1 : 1;
            } else if (sortBy === 'createdAt') {
                sortQuery.createdAt = order === 'desc' ? -1 : 1;
            }

            page = parseInt(page) || 1;
            per_page = parseInt(per_page) || 10;

            const skip = (page - 1) * per_page;
            const products = await Product.find(query).skip(skip).limit(per_page).sort(sortQuery);

            const totalProducts = await Product.countDocuments(query);
            res.status(200).json({
                success: true,
                page,
                per_page,
                totalProducts,
                totalPages: Math.ceil(totalProducts / per_page),
                products: products || [],
            });
        } catch (error) {
            console.error('Error in getAllProducts:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to get products',
                products: []
            });
        }
    },

    // Lấy sản phẩm theo category
    getProductByCategory: async (req, res) => {
        try {
            const category = req.params.category?.toLowerCase();
            let products = [];
            
            if (!category) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Category is required' 
                });
            }
            
            switch (category) {
                case 'laptop':
                    products = await Laptop.find().lean();
                    break;
                case 'phone':
                    products = await Phone.find().lean();
                    break;
                case 'tv':
                    products = await TV.find().lean();
                    break;
                case 'watch':
                    products = await Watch.find().lean();
                    break;
                case 'camera':
                    products = await Camera.find().lean();
                    break;
                case 'pc':
                    products = await PC.find().lean();
                    break;
                case 'monitor':
                    products = await Monitor.find().lean();
                    break;
                default:
                    return res.status(400).json({ 
                        success: false,
                        message: 'Invalid category' 
                    });
            }
            
            res.status(200).json({
                success: true,
                products: products || [],
                count: products.length
            });
        } catch (error) {
            console.error('Error in getProductByCategory:', error);
            res.status(500).json({ 
                success: false,
                message: error.message || 'Failed to get products by category',
                products: []
            });
        }
    },
    // danh gia
    ratings: async (req, res) => {
        const { id } = req.user;
        const { star, comment, productId } = req.body;
        if (!star || !productId) throw new Error('invalid');

        const product = await Product.findById(productId);
        const isRating = product?.ratings?.some((e) => e?.postedBy?.toString() === id);
        if (isRating) {
            return res.status(400).json({
                success: false,
                mes: 'Bạn đã đánh giá sản phẩm này',
            });
        } else {
            const res = await Product.findByIdAndUpdate(
                productId,
                {
                    $push: { ratings: { star, comment, postedBy: id } },
                },
                { new: true },
            );
        }

        const updateProduct = await Product.findById(productId).populate({
            path: 'ratings.postedBy',
            select: 'fullName avatar',
        });
        const numberStar = updateProduct.ratings.length;
        const sumStar = updateProduct.ratings.reduce((sum, e) => {
            return sum + +e.star;
        }, 0);
        updateProduct.avgStar = (sumStar / numberStar).toFixed(1);
        await updateProduct.save();
        return res.status(200).json({
            status: true,
            updateProduct,
        });
    },
    getFeaturedProducts: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 5;
            
            // Query với fallback nếu isFeature không tồn tại
            // Sử dụng $or để handle cả true và undefined/null
            const featuredProducts = await Product.find({ 
                $or: [
                    { isFeature: true },
                    { isFeature: { $exists: false } } // Fallback cho products cũ
                ]
            })
            .limit(limit)
            .sort({ avgStar: -1, createdAt: -1 }) // Sort by rating và date
            .lean(); // Use lean() for better performance

            // Nếu không có featured products, trả về top products by rating
            if (!featuredProducts || featuredProducts.length === 0) {
                const topProducts = await Product.find()
                    .sort({ avgStar: -1, createdAt: -1 })
                    .limit(limit)
                    .lean();
                
                return res.status(200).json({
                    success: true,
                    featuredProducts: topProducts || [],
                    message: topProducts.length > 0 ? 'Top rated products' : 'No products available'
                });
            }

            res.status(200).json({
                success: true,
                featuredProducts,
            });
        } catch (error) {
            console.error('Error in getFeaturedProducts:', error);
            res.status(500).json({ 
                success: false,
                message: 'Internal server error', 
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },
    getProductsBySeries: async (req, res) => {
        try {
            const name = req.body?.name || req.query?.name;
            
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Product name is required',
                    products: []
                });
            }
            
            const products = await Product.find({ 
                name: { $regex: name, $options: 'i' } 
            }).limit(10).lean();
            
            return res.json({
                success: true,
                products: products || [],
                count: products.length
            });
        } catch (error) {
            console.error('Error in getProductsBySeries:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'Có lỗi xảy ra',
                products: []
            });
        }
    },
    deleteProduct: async (req, res) => {
        try {
            const id = req.params.id;
            
            // Validate ObjectId
            const mongoose = require('mongoose');
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Invalid product ID format' 
                });
            }
            
            const product = await Product.findById(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found'
                });
            }
            
            const response = await Product.findByIdAndDelete(id);
            res.status(200).json({
                success: true,
                message: 'Xóa sản phẩm thành công',
            });
        } catch (error) {
            console.error('Error in deleteProduct:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete product',
            });
        }
    },
};

module.exports = productController;

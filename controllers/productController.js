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
            const thumbnail = req.files?.thumbnail[0].path;
            const listImage = req.files?.listImage?.map((el) => el.path);

            if (!name || !description || !thumbnail || !productType || !listImage) {
                return res.status(400).json({ message: 'Missing input' });
            }

            const category = await ProductCategory.findOne({ title: productType });
            if (!category) {
                return res.status(400).json({ message: 'Invalid product type' });
            }
            const ProductModel = productModels[productType];
            if (!ProductModel) {
                return res.status(400).json({ message: 'Invalid product type' });
            }
            const newProduct = new ProductModel({
                ...req.body,
                thumbnail,
                listImage,
                productCategory: category._id,
            });
            const savedProduct = await newProduct.save();
            return res.status(201).json(savedProduct);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Lấy sản phẩm theo id
    getAnProductByID: async (req, res) => {
        const id = req.params.id;
        try {
            const product = await Product.findById(id).populate({
                path: 'ratings.postedBy',
                select: 'fullName avatar',
            });
            if (!product) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            }
            res.status(200).json(product);
        } catch (error) {
            res.status(500).json({ message: error.message });
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
                page,
                per_page,
                totalProducts,
                totalPages: Math.ceil(totalProducts / per_page),
                products,
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Lấy sản phẩm theo category
    getProductByCategory: async (req, res) => {
        const category = req.params.category.toLowerCase();
        let products;
        try {
            if (category === 'laptop') {
                products = await Laptop.find();
            } else if (category === 'phone') {
                products = await Phone.find();
            } else if (category === 'tv') {
                products = await TV.find();
            } else if (category === 'watch') {
                products = await Watch.find();
            } else if (category === 'camera') {
                products = await Camera.find();
            } else if (category === 'pc') {
                products = await PC.find();
            } else if (category === 'monitor') {
                products = await Monitor.find();
            }
            if (products.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            }
            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ message: error.message });
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
            const featuredProducts = await Product.find({ isFeature: true }).limit(limit);

            if (!featuredProducts.length) {
                return res.status(404).json({ message: 'No featured products found.' });
            }

            res.status(200).json({
                success: true,
                featuredProducts,
            });
        } catch (error) {
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    },
    getProductsBySeries: async (req, res) => {
        try {
            const name = req.body.name;
            const products = await Product.find({ name: name });
            return res.json({
                success: true,
                products,
            });
        } catch (error) {
            return res.json({
                success: false,
                mes: 'Có lỗi xảy ra',
            });
        }
    },
    deleteProduct: async (req, res) => {
        try {
            const id = req.params.id;
            const response = await Product.findByIdAndDelete({ _id: id });
            res.status(200).json({
                success: true,
                mes: 'Xóa sản phẩm thành công',
            });
        } catch (error) {
            return res.json({
                success: false,
                mes: 'Có lỗi xảy ra',
            });
        }
    },
};

module.exports = productController;

const mongoose = require('mongoose');
const Product = require('./Product');

const laptopSchema = new mongoose.Schema({
    ram: { type: String, required: true },
    screen_size: { type: String, required: true },
    CPU: { type: String, required: true },
    hard_drive: { type: String, required: true },
    usage_demain: { type: String },
    graphics_card: { type: String },
    brand: { type: String },
    weight: { type: String },
    resolution: { type: String },
});
const Laptop = Product.discriminator('Laptop', laptopSchema);

const tvSchema = new mongoose.Schema({
    tv_size: { type: String, required: true },
    resolution_type: { type: String, required: true },
    CPU: { type: String, required: true },
    screen_type: { type: String, required: true },
    tv_type: { type: String },
    refresh_rate: { type: String },
    brand: { type: String },
    processor: { type: String },
    product_location: { type: String },
    sound_technologies: { type: String },
    operating_system: { type: String },
    other_utilities: { type: String },
});

const TV = Product.discriminator('TV', tvSchema);

const phoneSchema = new mongoose.Schema({
    internal_storage: { type: String, required: true },
    RAM_capacity: { type: String, required: true },
    screen_size: { type: String, required: true },
    special_features: { type: String },
    operating_system: { type: String, required: true },
    usage_demand: { type: String },
});
const Phone = Product.discriminator('Phone', phoneSchema);

const watchesSchema = new mongoose.Schema({
    screen: { type: String, required: true },
    water_dust_resistance: { type: String },
    battery_life: { type: String },
    charging_time: { type: String },
    weight: { type: String },
    brand: { type: String, required: true },
    compatibility: { type: String },
    health_features: { type: String },
    strap_material: { type: String },
    training_modes: { type: String },
});
const Watch = Product.discriminator('Watch', watchesSchema);

const cameraSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    camera_type: { type: String, required: true },
    camera_sensor: { type: String, required: true },
    camera_resolution: { type: String, required: true },
    camera_lens: { type: String },
    autofocus_system: { type: String },
    image_stabilization: { type: String },
    battery_life: { type: String },
    water_dust_resistance: { type: String },
    connectivity: { type: String },
    size: { type: String },
    included_accessories: { type: String },
    screen_type: { type: String },
});
const Camera = Product.discriminator('Camera', cameraSchema);

const pcSchema = new mongoose.Schema({
    PC_weight: { type: String },
    PC_type: { type: String, required: true }, // Ví dụ: "desktop", "tower"
    power_supply: { type: String },
    PC_socket: { type: String },
    graphics_card: { type: String },
    CPU_type: { type: String, required: true },
    RAM_capacity: { type: String, required: true },
    RAM_type: { type: String },
    number_of_RAM_slots: { type: Number },
    hard_drive: { type: String },
    chipset: { type: String },
    features_of_rear_IO_ports: { type: String },
    features_of_front_IO_ports: { type: String },
});
const PC = Product.discriminator('PC', pcSchema);

const monitorSchema = new mongoose.Schema({
    Monitor_size: { type: String, required: true },
    Monitor_weight: { type: String },
    refresh_rate: { type: String },
    response_time: { type: String },
    monitor_ratio: { type: String },
    dynamic_contrast_ratio: { type: String },
    static_contrast_ratio: { type: String },
    brightness: { type: String },
    viewing_angle: { type: String },
    color_coverage: { type: String },
    resolution: { type: String, required: true },
    screen_type: { type: String },
    connectivity_ports: { type: String },
    other_utilities: { type: String },
});
const Monitor = Product.discriminator('Monitor', monitorSchema);

module.exports = {
    Laptop,
    Phone,
    Watch,
    Camera,
    PC,
    Monitor,
    TV,
};

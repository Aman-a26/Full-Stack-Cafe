const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: String,
    category: String,
    price: Number,
    description: String,
    image: String,
    stock: Number,
    isActive: { type: Boolean, default: true } // <-- Add this line
});

module.exports = mongoose.model('Product', productSchema);
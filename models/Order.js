const mongoose = require('mongoose');
module.exports = mongoose.model('Order', new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, name: String, quantity: Number, price: Number }],
    totalAmount: Number,
    address: String,
    paymentMethod: String,
    status: { type: String, default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
}));
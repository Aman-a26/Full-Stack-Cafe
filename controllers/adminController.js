const Product = require('../models/Product');
const Order = require('../models/Order');

exports.getDashboard = async (req, res) => {
  const products = await Product.find({});
  res.render('admin-dashboard', { user: req.session.user, products });
};

exports.getOrders = async (req, res) => {
  const all = await Order.find({}).populate('user', 'username').sort({ createdAt: -1 }).lean();
  res.render('admin-orders', {
    user: req.session.user,
    liveOrders: all.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled'),
    doneOrders: all.filter(o => o.status === 'Delivered' || o.status === 'Cancelled')
  });
};

exports.addProduct = async (req, res) => {
  const { name, category, price, description, stock } = req.body;
  const image = req.file ? '/image/' + req.file.filename : '';
  await Product.create({ name, category, price, description, image, stock });
  res.redirect('/admin-dashboard');
};

exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect('/admin-dashboard');
};

exports.updateStatus = async (req, res) => {
  await Order.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
  res.redirect('/admin-orders');
};
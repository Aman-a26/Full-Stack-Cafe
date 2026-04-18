const Product = require('../models/Product');
const Order = require('../models/Order');

// 1. Admin Dashboard with Pagination
exports.getDashboard = async (req, res) => {
    try {
        const perPage = 6; 
        const page = parseInt(req.query.page) || 1;

        const products = await Product.find({})
            .skip((perPage * page) - perPage)
            .limit(perPage)
            .sort({ createdAt: -1 });

        const count = await Product.countDocuments();

        res.render('admin-dashboard', { 
            user: req.session.user, 
            products: products,
            current: page,
            pages: Math.ceil(count / perPage),
            error: req.query.error || null // Support for duplicate error messages
        });
    } catch (err) {
        console.error("Dashboard Error:", err);
        res.status(500).send("Error loading admin dashboard");
    }
};

// 2. Order Management Logic
exports.getOrders = async (req, res) => {
    try {
        const all = await Order.find({})
            .populate('user', 'username')
            .sort({ createdAt: -1 })
            .lean();

        res.render('admin-orders', {
            user: req.session.user,
            // Filters orders for the "Live" section
            liveOrders: all.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled'),
            // Filters orders for the "History" section
            doneOrders: all.filter(o => o.status === 'Delivered' || o.status === 'Cancelled')
        });
    } catch (err) {
        console.error("Orders Fetch Error:", err);
        res.redirect('/admin-dashboard');
    }
};

// 3. Add Product (WITH DUPLICATE PROTECTION)
exports.addProduct = async (req, res) => {
    try {
        const { name, category, price, description, stock } = req.body;
        
        // --- REPEAT ITEM PROTECTION ---
        // We trim and use a case-insensitive check to see if the item exists
        const cleanName = name.trim();
        const existingProduct = await Product.findOne({ 
            name: { $regex: new RegExp("^" + cleanName + "$", "i") } 
        });

        if (existingProduct) {
            return res.redirect('/admin-dashboard?error=Product already exists in menu');
        }

        // Ensure '/uploads/' matches your static folder setup
        // If using 'public/uploads', the browser path is just '/uploads/filename'
        const imagePath = req.file ? '/uploads/' + req.file.filename : '/uploads/default.jpg';
        
        await Product.create({ 
            name: cleanName, 
            category, 
            price: parseFloat(price), 
            description: description.trim(), 
            image: imagePath, 
            stock: parseInt(stock),
            isActive: true 
        });

        res.redirect('/admin-dashboard');
    } catch (err) {
        console.error("Add Product Error:", err);
        res.redirect('/admin-dashboard?error=Failed to add product');
    }
};

// 4. Delete Product
exports.deleteProduct = async (req, res) => {
    try {
        // Find the product first to potentially delete the physical image file if needed
        await Product.findByIdAndDelete(req.params.id);
        res.redirect('/admin-dashboard');
    } catch (err) {
        console.error("Delete Error:", err);
        res.redirect('/admin-dashboard');
    }
};

// 5. Update Order Status
exports.updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await Order.findByIdAndUpdate(orderId, { status: status });
        res.redirect('/admin-orders');
    } catch (err) {
        console.error("Status Update Error:", err);
        res.redirect('/admin-orders');
    }
};

// 6. Toggle Product Activation
exports.toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.redirect('/admin-dashboard');

        product.isActive = !product.isActive;
        await product.save();

        res.redirect('/admin-dashboard');
    } catch (err) {
        console.error("Toggle Error:", err);
        res.redirect('/admin-dashboard');
    }
};

// 7. Render Add Product Page
exports.getAddProduct = (req, res) => {
    res.render('add-product', { user: req.session.user });
};

// 8. Render Edit Product Page
exports.getEditProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.redirect('/admin-dashboard');
        res.render('edit-product', { user: req.session.user, product });
    } catch (err) {
        console.error("Get Edit Product Error:", err);
        res.redirect('/admin-dashboard');
    }
};

// 9. Handle Edit Product Submission
exports.postEditProduct = async (req, res) => {
    try {
        const { name, category, price, description, stock } = req.body;
        const updateData = {
            name: name.trim(),
            category,
            price: parseFloat(price),
            description: description.trim(),
            stock: parseInt(stock)
        };

        if (req.file) {
            updateData.image = '/uploads/' + req.file.filename;
        }

        await Product.findByIdAndUpdate(req.params.id, updateData);
        res.redirect('/admin-dashboard');
    } catch (err) {
        console.error("Post Edit Product Error:", err);
        res.redirect('/admin-dashboard');
    }
};
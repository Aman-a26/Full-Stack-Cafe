const Product = require('../models/Product');
const Order = require('../models/Order');

// 1. Dashboard: Paginated & Open to Everyone
exports.getDashboard = async (req, res) => {
    try {
        const perPage = 6; // Fixed 6 products per page
        const page = parseInt(req.query.page) || 1;

        // Fetch products with skip and limit for pagination
        const products = await Product.find({})
            .skip((perPage * page) - perPage)
            .limit(perPage);

        // Count total products to determine total pages
        const count = await Product.countDocuments();

        // Only fetch orders if a user is logged in
        const orders = req.session.userId 
            ? await Order.find({ user: req.session.userId }).sort({ createdAt: -1 }) 
            : [];
            
        res.render('user-dashboard', { 
            user: req.session.user || null, 
            products, 
            orders,
            current: page,
            pages: Math.ceil(count / perPage)
        });
    } catch (err) {
        res.status(500).send('Error loading dashboard');
    }
};

// 2. Add to Cart: With Stock Validation
exports.addToCart = async (req, res) => {
    try {
        const product = await Product.findById(req.body.productId);
        
        // Validation: Check if product exists and is in stock
        if (!product || product.stock <= 0) {
            return res.json({ success: false, message: 'Sorry, this item is out of stock!' });
        }

        const existingItem = req.session.cart.find(i => i.id === req.body.productId);
        
        // Validation: Ensure they don't add more than available stock
        if (existingItem && existingItem.quantity >= product.stock) {
            return res.json({ success: false, message: 'Maximum stock reached!' });
        }

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            req.session.cart.push({
                id: product._id.toString(),
                name: product.name,
                price: product.price,
                quantity: 1
            });
        }
        
        req.session.save(() => res.json({ success: true }));
    } catch (err) {
        res.json({ success: false });
    }
};

// 3. View Cart: Shows total for Guests & Users
exports.getCart = (req, res) => {
    const total = req.session.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    
    res.render('cart', { 
        user: req.session.user || null, 
        cart: req.session.cart, 
        total, 
        error: null 
    });
};

// 4. Update Cart: Manage quantities
exports.updateCart = (req, res) => {
    const { action, id } = req.params;
    const itemIndex = req.session.cart.findIndex(i => i.id === id);

    if (itemIndex !== -1) {
        if (action === 'inc') {
            req.session.cart[itemIndex].quantity++;
        } else if (action === 'dec') {
            if (req.session.cart[itemIndex].quantity > 1) {
                req.session.cart[itemIndex].quantity--;
            } else {
                req.session.cart.splice(itemIndex, 1);
            }
        } else if (action === 'rem') {
            req.session.cart.splice(itemIndex, 1);
        }
    }
    
    req.session.save(() => res.redirect('/cart'));
};

// 5. Checkout: PROTECTED
exports.checkout = async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');
    if (req.session.cart.length === 0) return res.redirect('/cart');
    
    try {
        const total = req.session.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
        
        await Order.create({
            user: req.session.userId,
            items: req.session.cart.map(i => ({
                product: i.id,
                name: i.name,
                quantity: i.quantity,
                price: i.price
            })),
            totalAmount: total,
            status: 'Pending'
        });
        
        // Optional: You could decrease product stock here in the DB
        // for (let item of req.session.cart) {
        //     await Product.findByIdAndUpdate(item.id, { $inc: { stock: -item.quantity } });
        // }

        req.session.cart = [];
        req.session.save(() => res.redirect('/user-dashboard'));
    } catch (err) {
        res.redirect('/cart');
    }
};
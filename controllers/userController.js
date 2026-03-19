const Product = require('../models/Product');
const Order = require('../models/Order');

// 1. Dashboard: Open to everyone (Guests & Users)
exports.getDashboard = async (req, res) => {
    try {
        const products = await Product.find({});
        
        // FIX: If a guest visits, req.session.userId is undefined.
        // We only fetch orders if the user is actually logged in.
        const orders = req.session.userId 
            ? await Order.find({ user: req.session.userId }).sort({ createdAt: -1 }) 
            : [];
            
        res.render('user-dashboard', { 
            // We pass null if guest, or the user object if logged in
            user: req.session.user || null, 
            products, 
            orders 
        });
    } catch (err) {
        res.status(500).send('Error loading dashboard');
    }
};

// 2. Add to Cart: Open to everyone
exports.addToCart = async (req, res) => {
    try {
        const product = await Product.findById(req.body.productId);
        if (product) {
            // Sessions work for guests too! This builds the cart before login.
            const existingItem = req.session.cart.find(i => i.id === req.body.productId);
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
        }
    } catch (err) {
        res.json({ success: false });
    }
};

// 3. View Cart: Open to everyone
exports.getCart = (req, res) => {
    const total = req.session.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    
    // We pass the user status so the HTML can show "Login to Checkout" for guests
    res.render('cart', { 
        user: req.session.user || null, 
        cart: req.session.cart, 
        total, 
        error: null 
    });
};

// 4. Update Cart (Inc/Dec/Rem): Open to everyone
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

// 5. Checkout: PROTECTED (Only for logged-in users)
exports.checkout = async (req, res) => {
    // Safety check: Even if the route is protected, we double-check here.
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
        
        // Clear the cart only after a successful order
        req.session.cart = [];
        req.session.save(() => res.redirect('/user-dashboard'));
    } catch (err) {
        res.redirect('/cart');
    }
};
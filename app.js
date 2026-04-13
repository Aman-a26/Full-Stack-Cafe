require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const app = express();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// --- HTTP Request Logging ---
app.use(morgan('dev'));

// --- 2. View Engine & Static Files ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// --- 3. Body Parsers ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- 4. Session Configuration ---
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// --- 5. FIX: Prevent Browser Caching (Logout Security) ---
// This ensures that when a user logs out, they cannot click "Back" 
// in the browser to see their private dashboard data.
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
});

// --- 6. FIX: Global Variables for EJS (The Amazon Flow) ---
app.use((req, res, next) => {
    // Ensure cart exists even for guests
    if (!req.session.cart) {
        req.session.cart = [];
    }

    // These variables are now available in EVERY .ejs file automatically
    // You don't need to pass them in res.render() anymore.
    res.locals.user = req.session.user || null;
    res.locals.cart = req.session.cart;
    res.locals.cartCount = req.session.cart.length;
    
    next();
});

// --- 7. Use Routes ---
app.use('/', require('./routes/authRoutes'));
app.use('/', require('./routes/adminRoutes'));
app.use('/', require('./routes/userRoutes'));

// --- 8. Landing Logic (Amazon Style) ---
app.get('/', (req, res) => {
    // Instead of forcing login, we send everyone to the menu first.
    res.redirect('/user-dashboard');
});

exports.addToCart = async (req, res) => {
    try {
        const product = await Product.findById(req.body.productId);
        
        // Block if not active OR no stock
        if (!product || !product.isActive || product.stock <= 0) {
            return res.json({ success: false, message: 'This item is currently unavailable.' });
        }

        // ... existing cart logic ...
    } catch (err) {
        res.json({ success: false });
    }
};

// --- 9. Server Start ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Cafe Food Server running at: http://localhost:${PORT}`);
});
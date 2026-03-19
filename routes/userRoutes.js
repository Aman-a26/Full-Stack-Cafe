const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');

// --- 1. Middleware: The Login Barrier ---
// We define this but ONLY apply it to the checkout route.
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next(); // User is logged in, proceed to checkout
    }
    // User is a guest, send them to login
    res.redirect('/login');
};

// --- 2. Public Routes (Amazon Style) ---
// Anyone can visit these without logging in.
router.get('/user-dashboard', userCtrl.getDashboard);
router.get('/cart', userCtrl.getCart);
router.post('/add-to-cart', userCtrl.addToCart);

// --- 3. Protected Routes ---
// This handles the increase/decrease/remove logic. 
// We keep this public so guests can manage their cart.
router.get('/cart/:action/:id', userCtrl.updateCart);

// This is the ONLY route that requires a login.
// When a guest clicks "Checkout", they are sent to the login page.
router.post('/checkout', isAuthenticated, userCtrl.checkout);

module.exports = router;
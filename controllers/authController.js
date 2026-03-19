const User = require('../models/User');
const bcrypt = require('bcryptjs');

// 1. Render Pages
exports.getLogin = (req, res) => res.render('login', { error: null });
exports.getSignup = (req, res) => res.render('signup', { error: null });

// 2. Login Logic: Optimized for Guest-to-User Flow
exports.postLogin = async (req, res) => {
    try {
        const { email, password, userType } = req.body;
        const user = await User.findOne({ email, role: userType });

        if (user && await bcrypt.compare(password, user.password)) {
            // --- SESSION STORAGE ---
            req.session.user = user;
            req.session.userId = user._id;
            req.session.userType = user.role;

            // Save session before redirecting to ensure data is written to DB
            return req.session.save(() => {
                // If they have items in their cart, send them back to the cart to checkout
                if (req.session.cart && req.session.cart.length > 0 && user.role === 'student') {
                    return res.redirect('/cart');
                }
                
                // Otherwise, send to their respective dashboard
                res.redirect(user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
            });
        }
        res.render('login', { error: 'Invalid Email or Password' });
    } catch (err) {
        res.render('login', { error: 'Login failed. Please try again.' });
    }
};

// 3. Signup Logic
exports.postSignup = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashed = await bcrypt.hash(password, 10);
        
        await User.create({ 
            username, 
            email, 
            password: hashed, 
            role: 'student' // Default role
        });
        
        res.redirect('/login');
    } catch (err) {
        res.render('signup', { error: 'Registration failed. Email might already exist.' });
    }
};

// 4. Logout Logic: THE FIX
exports.logout = (req, res) => {
    // 1. Destroy the session on the server
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout Error:", err);
            return res.redirect('/user-dashboard');
        }

        // 2. Clear the browser cookie (connect.sid is the default)
        res.clearCookie('connect.sid');

        // 3. Redirect to login
        // Because of the Cache-Control in app.js, the user is now 100% logged out
        res.redirect('/login');
    });
};
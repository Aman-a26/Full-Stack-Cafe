const User = require('../models/user');
const bcrypt = require('bcryptjs');

// 1. Render Pages
exports.getLogin = (req, res) => res.render('login', { error: null });
exports.getSignup = (req, res) => res.render('signup', { error: null });

// 2. Login Logic
exports.postLogin = async (req, res) => {
    try {
        let { email, password, userType } = req.body;

        // Normalize email: trim spaces and make lowercase
        const cleanEmail = email.trim().toLowerCase();

        // Find user by normalized email AND the specific role
        const user = await User.findOne({ email: cleanEmail, role: userType });

        if (user && await bcrypt.compare(password, user.password)) {
            // --- SESSION STORAGE ---
            req.session.user = user;
            req.session.userId = user._id;
            req.session.userType = user.role;

            return req.session.save(() => {
                // If they have items in their cart, send them back to the cart
                if (req.session.cart && req.session.cart.length > 0 && user.role === 'student') {
                    return res.redirect('/cart');
                }
                
                // Redirect based on role
                res.redirect(user.role === 'admin' ? '/admin-dashboard' : '/user-dashboard');
            });
        }
        
        // If it fails, we show exactly which field was likely the issue
        res.render('login', { error: 'Invalid Email, Password, or Role' });
    } catch (err) {
        console.error("Login Error:", err);
        res.render('login', { error: 'Login failed. Please try again.' });
    }
};

// 3. Signup Logic
exports.postSignup = async (req, res) => {
    try {
        const { username, email, collegeId, password, confirmPassword } = req.body;

        // Validation 1: Check if any fields are blank
        if (!username || !email || !collegeId || !password || !confirmPassword) {
            return res.render('signup', { error: 'All fields are required!' });
        }

        // Validation 2: Check if passwords match
        if (password !== confirmPassword) {
            return res.render('signup', { error: 'Passwords do not match!' });
        }

        // Validation 3: Password length check
        if (password.length < 6) {
            return res.render('signup', { error: 'Password must be at least 6 characters long.' });
        }

        // Normalize email for storage
        const cleanEmail = email.trim().toLowerCase();

        // Validation 4: Check if email is already registered
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
            return res.render('signup', { error: 'Email is already registered! Please log in.' });
        }

        const hashed = await bcrypt.hash(password, 10);
        
        await User.create({ 
            username: username.trim(), 
            email: cleanEmail, 
            collegeId: collegeId.trim(), 
            password: hashed, 
            role: 'student' 
        });
        
        res.redirect('/login');
    } catch (err) {
        console.error("Signup DB Error:", err);
        res.render('signup', { error: 'Registration failed. Please try again.' });
    }
};

// 4. Logout Logic
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Logout Error:", err);
            return res.redirect('/user-dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
};
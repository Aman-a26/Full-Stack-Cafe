const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

// --- LOGIN ROUTES ---
// Displays the login page
router.get('/login', authCtrl.getLogin);

// Handles the login form submission
router.post('/login', authCtrl.postLogin);


// --- SIGNUP ROUTES ---
// Displays the registration page
router.get('/signup', authCtrl.getSignup);

// Handles the registration form submission
// Note: Ensure your signup.ejs <form> has method="POST" and action="/signup"
router.post('/signup', authCtrl.postSignup);


// --- LOGOUT ROUTE ---
// Destroys session and clears cookies
router.get('/logout', authCtrl.logout);


module.exports = router;
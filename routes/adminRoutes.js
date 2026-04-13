const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure Multer for better file naming (Optional but recommended)
const storage = multer.diskStorage({
    destination: 'public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const adminController = require('../controllers/adminController');

// --- PRODUCT MANAGEMENT ROUTES ---
router.get('/admin-dashboard', adminController.getDashboard);
router.post('/add-product', upload.single('image'), adminController.addProduct);
router.get('/delete-product/:id', adminController.deleteProduct); // Changed to GET to match your <a> tag link
router.post('/toggle-product/:id', adminController.toggleProductStatus);

// --- ORDER MANAGEMENT ROUTES ---
router.get('/admin-orders', adminController.getOrders);
router.post('/update-order-status', adminController.updateStatus); // This handles the status dropdown

module.exports = router;
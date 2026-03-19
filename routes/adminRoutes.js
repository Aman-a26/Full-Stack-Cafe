const router = require('express').Router();
const adminCtrl = require('../controllers/adminController');
const multer = require('multer');
const upload = multer({ dest: 'public/image/' });

router.get('/admin-dashboard', adminCtrl.getDashboard);
router.get('/admin-orders', adminCtrl.getOrders);
router.post('/add-product', upload.single('image'), adminCtrl.addProduct);
router.get('/delete-product/:id', adminCtrl.deleteProduct);
router.post('/admin/update-order-status', adminCtrl.updateStatus);
module.exports = router;
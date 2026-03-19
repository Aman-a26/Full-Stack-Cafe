const router = require('express').Router();
const authCtrl = require('../controllers/authController');
router.get('/login', authCtrl.getLogin);
router.post('/login', authCtrl.postLogin);
router.get('/signup', authCtrl.getSignup);
router.post('/signup', authCtrl.postSignup);
router.get('/logout', authCtrl.logout);
module.exports = router;
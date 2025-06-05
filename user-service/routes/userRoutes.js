const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/login', userController.loginUser);
router.post('/register', userController.registerUser);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.put('/:id', authMiddleware, userController.updateUser);
router.delete('/:id', authMiddleware, userController.deleteUser);

router.get('/:id/with-orders-reviews', userController.getUserWithOrdersAndReviews);

module.exports = router;
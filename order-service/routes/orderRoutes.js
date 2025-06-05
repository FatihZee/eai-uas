const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', authMiddleware, orderController.createOrder);
router.put('/:id', authMiddleware, orderController.updateOrder);
router.delete('/:id', authMiddleware, orderController.deleteOrder);

router.get('/user/:userId', orderController.getOrdersByUserId);
router.get('/menu/:menuId', orderController.getOrderCountByMenuId);

module.exports = router;
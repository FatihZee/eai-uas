const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Webhook endpoint FIRST (no auth needed)
router.post('/webhook/midtrans', paymentController.handleMidtransWebhook);

// Specific routes BEFORE generic parameter routes
router.get('/order/:orderId/status', authMiddleware, paymentController.getPaymentStatusByOrderId);

// Protected routes (butuh authentication)
router.get('/', authMiddleware, paymentController.getAllPayments);
router.get('/user/:userId', authMiddleware, paymentController.getPaymentsByUserId);
router.get('/order/:orderId', authMiddleware, paymentController.getPaymentsByOrderId);
router.post('/', authMiddleware, paymentController.createPayment);

// Payment status check route - AFTER webhook to avoid conflict
router.get('/:id/status', authMiddleware, paymentController.checkPaymentStatus);
router.get('/:id', authMiddleware, paymentController.getPaymentById);

module.exports = router;

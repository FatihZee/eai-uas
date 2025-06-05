const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protected routes (butuh authentication)
router.get('/', authMiddleware, paymentController.getAllPayments);
router.get('/:id', authMiddleware, paymentController.getPaymentById);
router.get('/user/:userId', authMiddleware, paymentController.getPaymentsByUserId);
router.get('/order/:orderId', authMiddleware, paymentController.getPaymentsByOrderId);
router.post('/', authMiddleware, paymentController.createPayment);

// Webhook endpoint (biasanya tidak butuh auth, tapi butuh verifikasi signature)
router.post('/webhook/midtrans', paymentController.handleMidtransWebhook);

module.exports = router;

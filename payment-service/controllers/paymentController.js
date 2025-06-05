const axios = require('axios');
const snap = require('../config/midtrans');
const Payment = require('../models/paymentModel');
const PaymentService = require('../services/paymentService');

exports.createPayment = async (req, res) => {
    const userId = req.user.id;

    const { order_id } = req.body;

    try {
        // ✅ Cek user
        const userRes = await axios.get(`http://localhost:3001/users/${userId}`);
        if (!userRes.data) {
            return res.status(404).json({ message: 'User not found' });
        }

        // ✅ Cek order
        const orderRes = await axios.get(`http://localhost:3003/orders/${order_id}`);
        if (!orderRes.data) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const midtransOrderId = `ORDER-${order_id}-${Date.now()}`;

        const order = orderRes.data;

        const amount = order.total_price;

        const parameter = {
            transaction_details: {
                order_id: midtransOrderId,
                gross_amount: amount,
            },
            customer_details: {
                first_name: userRes.data.name,
                email: userRes.data.email,
            }
        };

        const transaction = await snap.createTransaction(parameter);

        const payment = await Payment.create({
            user_id: userRes.data.id,
            order_id,
            midtrans_order_id: midtransOrderId,
            amount,
            snap_token: transaction.token,
            redirect_url: transaction.redirect_url,
            status: 'pending'
        });

        res.status(201).json({
            message: 'Payment created',
            payment,
            redirect_url: transaction.redirect_url
        });

    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json({ message: error.response.data.message });
        }

        console.error(error);
        res.status(500).json({ message: 'Failed to create payment', error: error.message });
    }
};

module.exports = {
  getAllPayments: async (req, res) => {
    try {
      // Implementasi untuk admin atau dengan filter tertentu
      // Untuk sekarang, return empty array atau error karena ini tidak umum untuk payment
      res.status(403).json({ error: 'Access denied. Use specific payment queries instead.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get payments', detail: error.message });
    }
  },

  getPaymentById: async (req, res) => {
    const id = req.params.id;
    const token = req.headers.authorization;
    try {
      const payment = await PaymentService.getPaymentById(id);
      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Enrich dengan user dan order details
      const user = await PaymentService._fetchUserDetails(payment.user_id, token);
      const order = await PaymentService._fetchOrderDetails(payment.order_id, token);
      
      res.json({
        ...payment.toJSON(),
        user,
        order
      });
    } catch (error) {
      res.status(500).json({ error: `Failed to get payment ${id}`, detail: error.message });
    }
  },

  getPaymentsByUserId: async (req, res) => {
    const userId = req.params.userId;
    const requestingUserId = req.user?.id;
    
    // Security: User hanya bisa melihat payment miliknya sendiri
    if (parseInt(userId) !== requestingUserId) {
      return res.status(403).json({ error: 'Access denied. You can only view your own payments.' });
    }

    try {
      const payments = await PaymentService.getPaymentsByUserId(userId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: `Failed to get payments for user ${userId}`, detail: error.message });
    }
  },

  getPaymentsByOrderId: async (req, res) => {
    const orderId = req.params.orderId;
    try {
      const payments = await PaymentService.getPaymentsByOrderId(orderId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: `Failed to get payments for order ${orderId}`, detail: error.message });
    }
  },

  createPayment: async (req, res) => {
    const userId = req.user.id; // Dari authMiddleware
    const { order_id } = req.body;
    const token = req.headers.authorization;

    try {
      const result = await PaymentService.createPayment(userId, order_id, token);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error in PaymentController.createPayment:', error.message);
      let statusCode = 500;
      if (error.message.includes('not found') || error.message.includes('Invalid')) {
        statusCode = 400;
      }
      if (error.message.includes('not belong')) {
        statusCode = 403;
      }
      res.status(statusCode).json({ 
        error: 'Failed to create payment', 
        detail: error.message 
      });
    }
  },

  // Endpoint untuk webhook Midtrans (jika diperlukan)
  handleMidtransWebhook: async (req, res) => {
    try {
      // Implementasi webhook handler sesuai dokumentasi Midtrans
      const notification = req.body;
      
      // Verifikasi signature dan update status payment
      // ... implementasi webhook logic
      
      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process webhook', detail: error.message });
    }
  }
};

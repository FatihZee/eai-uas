const axios = require('axios');
const crypto = require('crypto');
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

exports.getAllPayments = async (req, res) => {
  try {
    // For admin only - implement proper authorization
    const payments = await PaymentService.getAllPayments(req.headers.authorization);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get payments', detail: error.message });
  }
};

exports.getPaymentById = async (req, res) => {
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
      ...payment,
      user,
      order
    });
  } catch (error) {
    res.status(500).json({ error: `Failed to get payment ${id}`, detail: error.message });
  }
};

exports.getPaymentsByUserId = async (req, res) => {
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
};

exports.getPaymentsByOrderId = async (req, res) => {
  const orderId = req.params.orderId;
  try {
    const payments = await PaymentService.getPaymentsByOrderId(orderId);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: `Failed to get payments for order ${orderId}`, detail: error.message });
  }
};

exports.handleMidtransWebhook = async (req, res) => {
  try {
    const notification = req.body;
    console.log('Midtrans notification received:', notification);

    // Verify signature
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_time,
      transaction_id
    } = notification;

    // Create signature for verification
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const hash = crypto
      .createHash('sha512')
      .update(order_id + status_code + gross_amount + serverKey)
      .digest('hex');

    if (hash !== signature_key) {
      console.error('Invalid signature from Midtrans');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Find payment by midtrans_order_id
    const payment = await Payment.findOne({
      where: { midtrans_order_id: order_id }
    });

    if (!payment) {
      console.error(`Payment not found for order_id: ${order_id}`);
      return res.status(404).json({ message: 'Payment not found' });
    }

    let newStatus = payment.status; // Default to current status

    // Determine new status based on transaction_status
    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        newStatus = 'pending';
      } else if (fraud_status === 'accept') {
        newStatus = 'paid';
      }
    } else if (transaction_status === 'settlement') {
      newStatus = 'paid';
    } else if (transaction_status === 'cancel' || 
               transaction_status === 'deny' || 
               transaction_status === 'expire') {
      newStatus = 'failed';
    } else if (transaction_status === 'pending') {
      newStatus = 'pending';
    }

    // Update payment status
    await payment.update({
      status: newStatus,
      payment_method: payment_type || payment.payment_method,
      transaction_time: transaction_time ? new Date(transaction_time) : payment.transaction_time
    });

    console.log(`Payment ${payment.id} status updated to: ${newStatus}`);

    // Send success response to Midtrans
    res.status(200).json({ 
      message: 'Notification processed successfully',
      payment_id: payment.id,
      new_status: newStatus
    });

  } catch (error) {
    console.error('Error processing Midtrans webhook:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook', 
      detail: error.message 
    });
  }
};

exports.checkPaymentStatus = async (req, res) => {
  const { id } = req.params;
  
  try {
    const payment = await Payment.findByPk(id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check status from Midtrans
    const midtrans = require('midtrans-client');
    const core = new midtrans.CoreApi({
      isProduction: process.env.NODE_ENV === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    const statusResponse = await core.transaction.status(payment.midtrans_order_id);
    
    let newStatus = payment.status;
    
    if (statusResponse.transaction_status === 'settlement') {
      newStatus = 'paid';
    } else if (statusResponse.transaction_status === 'pending') {
      newStatus = 'pending';
    } else if (['cancel', 'deny', 'expire'].includes(statusResponse.transaction_status)) {
      newStatus = 'failed';
    }

    // Update if status changed
    if (newStatus !== payment.status) {
      await payment.update({ status: newStatus });
    }

    res.json({
      payment_id: payment.id,
      current_status: newStatus,
      midtrans_response: statusResponse
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ 
      error: 'Failed to check payment status', 
      detail: error.message 
    });
  }
};

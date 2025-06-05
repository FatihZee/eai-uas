const Payment = require('../models/paymentModel');
const axios = require('axios');
const snap = require('../config/midtrans');
require('dotenv').config();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const USER_SERVICE_GRAPHQL_URL = process.env.USER_SERVICE_GRAPHQL_URL || 'http://localhost:4001/graphql';
const ORDER_SERVICE_GRAPHQL_URL = process.env.ORDER_SERVICE_GRAPHQL_URL || 'http://localhost:4003/graphql';

class PaymentService {
  // GET ALL PAYMENTS (for admin)
  static async getAllPayments(token) {
    try {
      const payments = await Payment.findAll({
        order: [['transaction_time', 'DESC']]
      });
      
      // Enrich with user and order details
      const enrichedPayments = await Promise.all(
        payments.map(async (payment) => {
          const user = await this._fetchUserDetails(payment.user_id, token);
          const order = await this._fetchOrderDetails(payment.order_id, token);
          return {
            ...payment.toJSON(),
            user,
            order
          };
        })
      );
      
      return enrichedPayments;
    } catch (error) {
      throw new Error(`Failed to get all payments: ${error.message}`);
    }
  }

  static async getPaymentById(id, token) {
    try {
      const payment = await Payment.findByPk(id);
      if (!payment) return null;
      
      // Enrich with user and order details
      const user = await this._fetchUserDetails(payment.user_id, token);
      const order = await this._fetchOrderDetails(payment.order_id, token);
      
      return {
        ...payment.toJSON(),
        user,
        order
      };
    } catch (error) {
      throw new Error(`Failed to get payment ${id}: ${error.message}`);
    }
  }

  static async getPaymentsByUserId(userId, token) {
    try {
      const payments = await Payment.findAll({ 
        where: { user_id: userId },
        order: [['transaction_time', 'DESC']]
      });
      
      // Enrich with user and order details
      const enrichedPayments = await Promise.all(
        payments.map(async (payment) => {
          const user = await this._fetchUserDetails(payment.user_id, token);
          const order = await this._fetchOrderDetails(payment.order_id, token);
          return {
            ...payment.toJSON(),
            user,
            order
          };
        })
      );
      
      return enrichedPayments;
    } catch (error) {
      throw new Error(`Failed to get payments for user ${userId}: ${error.message}`);
    }
  }

  static async getPaymentsByOrderId(orderId, token) {
    try {
      const payments = await Payment.findAll({ 
        where: { order_id: orderId },
        order: [['transaction_time', 'DESC']]
      });
      
      // Enrich with user and order details
      const enrichedPayments = await Promise.all(
        payments.map(async (payment) => {
          const user = await this._fetchUserDetails(payment.user_id, token);
          const order = await this._fetchOrderDetails(payment.order_id, token);
          return {
            ...payment.toJSON(),
            user,
            order
          };
        })
      );
      
      return enrichedPayments;
    } catch (error) {
      throw new Error(`Failed to get payments for order ${orderId}: ${error.message}`);
    }
  }

  static async getPaymentsByStatus(status, token) {
    try {
      const payments = await Payment.findAll({ 
        where: { status },
        order: [['transaction_time', 'DESC']]
      });
      
      // Enrich with user and order details
      const enrichedPayments = await Promise.all(
        payments.map(async (payment) => {
          const user = await this._fetchUserDetails(payment.user_id, token);
          const order = await this._fetchOrderDetails(payment.order_id, token);
          return {
            ...payment.toJSON(),
            user,
            order
          };
        })
      );
      
      return enrichedPayments;
    } catch (error) {
      throw new Error(`Failed to get payments with status ${status}: ${error.message}`);
    }
  }

  static async getPaymentStats() {
    try {
      const totalPayments = await Payment.count();
      const totalAmount = await Payment.sum('amount') || 0;
      const pendingCount = await Payment.count({ where: { status: 'pending' } });
      const paidCount = await Payment.count({ where: { status: 'paid' } });
      const failedCount = await Payment.count({ where: { status: 'failed' } });
      const cancelledCount = await Payment.count({ where: { status: 'cancelled' } });
      
      return {
        total_payments: totalPayments,
        total_amount: totalAmount,
        pending_count: pendingCount,
        paid_count: paidCount,
        failed_count: failedCount,
        cancelled_count: cancelledCount
      };
    } catch (error) {
      throw new Error(`Failed to get payment stats: ${error.message}`);
    }
  }

  static async getPaymentStatsByUser(userId) {
    try {
      const totalPayments = await Payment.count({ where: { user_id: userId } });
      const totalAmount = await Payment.sum('amount', { where: { user_id: userId } }) || 0;
      const paidAmount = await Payment.sum('amount', { where: { user_id: userId, status: 'paid' } }) || 0;
      const pendingAmount = await Payment.sum('amount', { where: { user_id: userId, status: 'pending' } }) || 0;
      
      return {
        user_id: userId,
        total_payments: totalPayments,
        total_amount: totalAmount,
        pending_amount: pendingAmount,
        paid_amount: paidAmount
      };
    } catch (error) {
      throw new Error(`Failed to get payment stats for user ${userId}: ${error.message}`);
    }
  }

  // Fix CREATE PAYMENT method
  static async createPayment(input, userId, token) {
    try {
      const { orderId } = input;
      
      // Fetch user dari GraphQL
      const user = await this._fetchUserDetails(userId, token);
      if (!user) {
        throw new Error('User not found');
      }

      // Fetch order dari GraphQL  
      const order = await this._fetchOrderDetails(orderId, token);
      if (!order) {
        throw new Error('Order not found');
      }

      // Validasi order belongs to user
      if (order.user_id !== parseInt(userId)) {
        throw new Error('Order does not belong to the authenticated user.');
      }

      const amount = order.total_price;
      if (amount == null || amount <= 0) {
        throw new Error('Invalid order amount for payment.');
      }

      const midtransOrderId = `ORDER-${orderId}-${Date.now()}`;

      const parameter = {
        transaction_details: {
          order_id: midtransOrderId,
          gross_amount: amount,
        },
        customer_details: {
          first_name: user.name,
          email: user.email,
        },
      };

      const transaction = await snap.createTransaction(parameter);

      // Save to database using Sequelize
      const newPayment = await Payment.create({
        user_id: userId,
        order_id: orderId,
        midtrans_order_id: midtransOrderId,
        amount,
        snap_token: transaction.token,
        redirect_url: transaction.redirect_url,
        status: 'pending'
      });

      return {
        message: 'Payment created successfully, redirect to Midtrans.',
        payment: newPayment.toJSON(),
        redirect_url: transaction.redirect_url,
      };

    } catch (error) {
      console.error('Error in PaymentService.createPayment:', error.message);
      if (error.response && error.response.data) {
        throw new Error(`Failed to create payment: ${error.response.data.message || error.message}`);
      }
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  // Helper untuk GraphQL - fetch user details via GraphQL
  static async _fetchUserDetails(userId, token) {
    if (!userId) return null;
    try {
      const response = await axios.post(USER_SERVICE_GRAPHQL_URL, {
        query: `query GetUser($id: ID!) { user(id: $id) { id name email } }`,
        variables: { id: userId.toString() }
      }, { 
        headers: { 
          'Content-Type': 'application/json', 
          ...(token && { 'Authorization': token }) 
        },
        timeout: 5000 
      });
      
      if (response.data.errors) {
        throw new Error(response.data.errors.map(e => e.message).join(', '));
      }
      return response.data.data.user;
    } catch (error) {
      console.error(`Error fetching user ${userId} from UserService:`, error.message);
      return { id: userId, name: 'Unknown User (Fetch Error)', email: 'unknown@example.com' };
    }
  }

  // Helper untuk GraphQL - fetch order details via GraphQL
  static async _fetchOrderDetails(orderId, token) {
    if (!orderId) return null;
    try {
      const response = await axios.post(ORDER_SERVICE_GRAPHQL_URL, {
        query: `query GetOrder($id: ID!) { order(id: $id) { id total_price created_at user_id menu_id quantity } }`,
        variables: { id: orderId.toString() }
      }, { 
        headers: { 
          'Content-Type': 'application/json', 
          ...(token && { 'Authorization': token }) 
        },
        timeout: 5000 
      });
      
      if (response.data.errors) {
        throw new Error(response.data.errors.map(e => e.message).join(', '));
      }
      return response.data.data.order;
    } catch (error) {
      console.error(`Error fetching order ${orderId} from OrderService:`, error.message);
      return { id: orderId, total_price: 0, user_id: null };
    }
  }

  static async processPayment(paymentId, userId, token) {
    try {
      const payment = await Payment.findByPk(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update status to paid
      await payment.update({ 
        status: 'paid',
        transaction_time: new Date()
      });

      // Return enriched payment
      const user = await this._fetchUserDetails(payment.user_id, token);
      const order = await this._fetchOrderDetails(payment.order_id, token);

      return {
        ...payment.toJSON(),
        user,
        order
      };
    } catch (error) {
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  static async cancelPayment(paymentId, userId, token) {
    try {
      const payment = await Payment.findByPk(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      // Update status to cancelled
      await payment.update({ status: 'cancelled' });

      // Return enriched payment
      const user = await this._fetchUserDetails(payment.user_id, token);
      const order = await this._fetchOrderDetails(payment.order_id, token);

      return {
        ...payment.toJSON(),
        user,
        order
      };
    } catch (error) {
      throw new Error(`Failed to cancel payment: ${error.message}`);
    }
  }
}

module.exports = PaymentService;
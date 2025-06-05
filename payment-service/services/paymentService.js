const Payment = require('../models/paymentModel');
const axios = require('axios');
const snap = require('../config/midtrans');
require('dotenv').config();

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
const USER_SERVICE_GRAPHQL_URL = process.env.USER_SERVICE_GRAPHQL_URL || 'http://localhost:4001/graphql';
const ORDER_SERVICE_GRAPHQL_URL = process.env.ORDER_SERVICE_GRAPHQL_URL || 'http://localhost:4003/graphql';

class PaymentService {
  static async getPaymentById(id) {
    try {
      const payment = await Payment.findByPk(id);
      if (!payment) return null;
      
      // Convert Sequelize instance to plain object
      return payment.toJSON();
    } catch (error) {
      throw new Error(`Failed to get payment ${id}: ${error.message}`);
    }
  }

  static async getPaymentsByUserId(userId) {
    try {
      const payments = await Payment.findAll({ where: { user_id: userId } });
      return payments.map(payment => payment.toJSON());
    } catch (error) {
      throw new Error(`Failed to get payments for user ${userId}: ${error.message}`);
    }
  }

  static async getPaymentsByOrderId(orderId) {
    try {
      const payments = await Payment.findAll({ where: { order_id: orderId } });
      return payments.map(payment => payment.toJSON());
    } catch (error) {
      throw new Error(`Failed to get payments for order ${orderId}: ${error.message}`);
    }
  }

  static async createPayment(userId, orderId, token) {
    try {
      const userRes = await axios.get(`${USER_SERVICE_URL}/users/${userId}`, {
        headers: { Authorization: token }
      });
      
      if (!userRes.data) {
        throw new Error('User not found');
      }

      const orderRes = await axios.get(`${ORDER_SERVICE_URL}/orders/${orderId}`, {
        headers: { Authorization: token }
      });
      
      if (!orderRes.data) {
        throw new Error('Order not found');
      }

      const order = orderRes.data;
      const user = userRes.data;

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
      console.error('PaymentService.createPayment - Original error:', error);

      let finalMessage;
      // Prioritize specific error sources
      if (error.isAxiosError) { 
        if (error.response && error.response.data && error.response.data.message) {
          finalMessage = `Dependency Error: ${error.response.data.message}`;
        } else if (error.response && error.response.status) {
          finalMessage = `Dependency Error: Status ${error.response.status} - ${error.response.statusText || 'No further details'}`;
        } else {
          finalMessage = `Network or Dependency Error: ${error.message || 'Connection issue'}`;
        }
      } else if (error.ApiResponse && error.ApiResponse.status_message) { // Midtrans specific errors
        finalMessage = `Midtrans Payment Error: ${error.ApiResponse.status_message}`;
        if (error.ApiResponse.validation_messages && error.ApiResponse.validation_messages.length > 0) {
          finalMessage += ` (Details: ${error.ApiResponse.validation_messages.join(', ')})`;
        }
      } else if (error.name && error.name.startsWith('Sequelize')) { // Sequelize errors
        finalMessage = `Database Error: ${error.message || 'Failed to save payment data.'}`;
      } else if (error.message && error.message.trim() !== "") { // Generic errors with a non-empty message
        finalMessage = error.message;
      } else if (typeof error === 'string' && error.trim() !== "") { // If error is just a non-empty string
        finalMessage = error;
      } else {
        finalMessage = "An unexpected internal error occurred while processing the payment.";
      }
      
      // Ensure a prefix for context if the message doesn't already provide it
      if (!finalMessage.toLowerCase().includes('payment') && !finalMessage.toLowerCase().includes('dependency') && !finalMessage.toLowerCase().includes('database') && !finalMessage.toLowerCase().includes('midtrans')) {
         throw new Error(`Payment Creation Failed: ${finalMessage}`);
      } else {
         throw new Error(finalMessage); 
      }
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
        } 
      });
      
      if (response.data.errors) {
        throw new Error(response.data.errors.map(e => e.message).join(', '));
      }
      return response.data.data.user;
    } catch (error) {
      console.error(`Error fetching user ${userId} from UserService:`, error.message);
      return { id: userId, name: 'Unknown User (Fetch Error)' };
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
        } 
      });
      
      if (response.data.errors) {
        throw new Error(response.data.errors.map(e => e.message).join(', '));
      }
      return response.data.data.order;
    } catch (error) {
      console.error(`Error fetching order ${orderId} from OrderService:`, error.message);
      return { id: orderId, description: 'Unknown Order (Fetch Error)' };
    }
  }
}

module.exports = PaymentService;
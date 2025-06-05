const { GraphQLError } = require('graphql');
const PaymentService = require('../services/paymentService');
const axios = require('axios');
const crypto = require('crypto');
const snap = require('../config/midtrans');
const Payment = require('../models/paymentModel');

module.exports = {
  Query: {
    payments: async (_, __, context) => {
      try {
        return await PaymentService.getAllPayments(context.token);
      } catch (error) {
        console.error('GraphQL Error fetching all payments:', error);
        throw new GraphQLError(`Failed to fetch payments: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    payment: async (_, { id }, context) => {
      try {
        const payment = await PaymentService.getPaymentById(id, context.token);
        if (!payment) {
          throw new GraphQLError('Payment not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return payment;
      } catch (error) {
        console.error(`GraphQL Error fetching payment ${id}:`, error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(`Failed to fetch payment: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    paymentsByUser: async (_, { userId }, context) => {
      try {
        return await PaymentService.getPaymentsByUserId(userId, context.token);
      } catch (error) {
        console.error(`GraphQL Error fetching payments for user ${userId}:`, error);
        throw new GraphQLError(`Failed to fetch payments for user: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    paymentsByOrder: async (_, { orderId }, context) => {
      try {
        return await PaymentService.getPaymentsByOrderId(orderId, context.token);
      } catch (error) {
        console.error(`GraphQL Error fetching payments for order ${orderId}:`, error);
        throw new GraphQLError(`Failed to fetch payments for order: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    paymentsByStatus: async (_, { status }, context) => {
      try {
        return await PaymentService.getPaymentsByStatus(status, context.token);
      } catch (error) {
        console.error(`GraphQL Error fetching payments with status ${status}:`, error);
        throw new GraphQLError(`Failed to fetch payments by status: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    paymentStats: async () => {
      try {
        return await PaymentService.getPaymentStats();
      } catch (error) {
        console.error('GraphQL Error fetching payment stats:', error);
        throw new GraphQLError(`Failed to fetch payment stats: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    paymentStatsByUser: async (_, { userId }) => {
      try {
        return await PaymentService.getPaymentStatsByUser(userId);
      } catch (error) {
        console.error(`GraphQL Error fetching payment stats for user ${userId}:`, error);
        throw new GraphQLError(`Failed to fetch payment stats for user: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  Mutation: {
    createPayment: async (_, { input }, context) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        const payment = await PaymentService.createPayment(input, context.user.id, context.token);
        return { message: 'Payment created successfully', payment };
      } catch (error) {
        console.error('GraphQL Error creating payment:', error);
        throw new GraphQLError(`Failed to create payment: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    updatePayment: async (_, { id, input }, context) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        const payment = await PaymentService.updatePayment(id, input, context.user.id, context.token);
        return { message: 'Payment updated successfully', payment };
      } catch (error) {
        console.error(`GraphQL Error updating payment ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('not authorized')) code = 'FORBIDDEN';
        throw new GraphQLError(`Failed to update payment: ${error.message}`, {
          extensions: { code },
        });
      }
    },

    deletePayment: async (_, { id }, context) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        const result = await PaymentService.deletePayment(id, context.user.id);
        return { message: result.message, id: result.id };
      } catch (error) {
        console.error(`GraphQL Error deleting payment ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('not authorized')) code = 'FORBIDDEN';
        throw new GraphQLError(`Failed to delete payment: ${error.message}`, {
          extensions: { code },
        });
      }
    },

    processPayment: async (_, { id }, context) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        const payment = await PaymentService.processPayment(id, context.user.id, context.token);
        return { message: 'Payment processed successfully', payment };
      } catch (error) {
        console.error(`GraphQLError processing payment ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('not authorized')) code = 'FORBIDDEN';
        throw new GraphQLError(`Failed to process payment: ${error.message}`, {
          extensions: { code },
        });
      }
    },

    cancelPayment: async (_, { id }, context) => {
      if (!context.user) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        const payment = await PaymentService.cancelPayment(id, context.user.id, context.token);
        return { message: 'Payment cancelled successfully', payment };
      } catch (error) {
        console.error(`GraphQLError cancelling payment ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('not authorized')) code = 'FORBIDDEN';
        throw new GraphQLError(`Failed to cancel payment: ${error.message}`, {
          extensions: { code },
        });
      }
    },

    // Webhook handler untuk Midtrans notifications
    handleMidtransWebhook: async (req, res) => {
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
    },

    // Manual check payment status from Midtrans
    checkPaymentStatus: async (req, res) => {
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
    },
  },
};
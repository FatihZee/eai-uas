const { GraphQLError } = require('graphql');
const PaymentService = require('../services/paymentService');

module.exports = {
  Payment: {
    user: async (parent, _, context) => {
      if (!parent.user_id) return null;
      return PaymentService._fetchUserDetails(parent.user_id, context.token);
    },
    order: async (parent, _, context) => {
      if (!parent.order_id) return null;
      return PaymentService._fetchOrderDetails(parent.order_id, context.token);
    },
  },

  Query: {
    payments: async (_, __, context) => {
      try {
        // Untuk demo, return empty array atau implement logic sesuai kebutuhan
        return [];
      } catch (error) {
        console.error('GraphQL Error fetching all payments:', error);
        throw new GraphQLError(`Failed to fetch payments: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    payment: async (_, { id }) => {
      try {
        const payment = await PaymentService.getPaymentById(id);
        if (!payment) {
          throw new GraphQLError('Payment not found', { 
            extensions: { code: 'NOT_FOUND' } 
          });
        }
        return payment;
      } catch (error) {
        console.error(`GraphQL Error fetching payment ${id}:`, error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message, { 
          extensions: { code: 'INTERNAL_SERVER_ERROR' } 
        });
      }
    },

    paymentsByUser: async (_, { userId }) => {
      try {
        return await PaymentService.getPaymentsByUserId(userId);
      } catch (error) {
        console.error(`GraphQL Error fetching payments for user ${userId}:`, error);
        throw new GraphQLError(error.message, { 
          extensions: { code: 'INTERNAL_SERVER_ERROR' } 
        });
      }
    },

    paymentsByOrder: async (_, { orderId }) => {
      try {
        return await PaymentService.getPaymentsByOrderId(orderId);
      } catch (error) {
        console.error(`GraphQL Error fetching payments for order ${orderId}:`, error);
        throw new GraphQLError(error.message, { 
          extensions: { code: 'INTERNAL_SERVER_ERROR' } 
        });
      }
    },

    paymentsByStatus: async (_, { status }) => {
      try {
        // Implement this method in PaymentService if needed
        const Payment = require('../models/paymentModel');
        const payments = await Payment.findAll({ where: { status } });
        return payments.map(payment => payment.toJSON());
      } catch (error) {
        console.error(`GraphQL Error fetching payments by status ${status}:`, error);
        throw new GraphQLError(error.message, { 
          extensions: { code: 'INTERNAL_SERVER_ERROR' } 
        });
      }
    },

    paymentStats: async () => {
      try {
        // Implement basic stats
        const Payment = require('../models/paymentModel');
        const { QueryTypes } = require('sequelize');
        const sequelize = require('../config/db');
        
        const stats = await sequelize.query(`
          SELECT 
            COUNT(*) as total_payments,
            SUM(amount) as total_amount,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
          FROM payments
        `, { type: QueryTypes.SELECT });
        
        return stats[0] || {
          total_payments: 0,
          total_amount: 0,
          pending_count: 0,
          paid_count: 0,
          failed_count: 0,
          cancelled_count: 0
        };
      } catch (error) {
        console.error('GraphQL Error fetching payment stats:', error);
        throw new GraphQLError(error.message, { 
          extensions: { code: 'INTERNAL_SERVER_ERROR' } 
        });
      }
    },

    paymentStatsByUser: async (_, { userId }) => {
      try {
        const { QueryTypes } = require('sequelize');
        const sequelize = require('../config/db');
        
        const stats = await sequelize.query(`
          SELECT 
            user_id,
            COUNT(*) as total_payments,
            SUM(amount) as total_amount,
            SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
            SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount
          FROM payments 
          WHERE user_id = :userId
          GROUP BY user_id
        `, { 
          replacements: { userId },
          type: QueryTypes.SELECT 
        });
        
        return stats[0] || {
          user_id: parseInt(userId),
          total_payments: 0,
          total_amount: 0,
          pending_amount: 0,
          paid_amount: 0
        };
      } catch (error) {
        console.error(`GraphQL Error fetching payment stats for user ${userId}:`, error);
        throw new GraphQLError(error.message, { 
          extensions: { code: 'INTERNAL_SERVER_ERROR' } 
        });
      }
    },
  },

  Mutation: {
    createPayment: async (_, { input }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        const result = await PaymentService.createPayment(
          context.user.id,
          input.orderId,
          context.token
        );
        return result;
      } catch (error) { // error is the one thrown by PaymentService
        console.error('GraphQL Error in createPayment (from service):', error.message);

        let errorCode = 'INTERNAL_SERVER_ERROR';
        // Use the error.message from the service directly, as it should now be descriptive.
        const errorMessageForClient = error.message || "An unexpected error occurred while creating the payment.";

        // Determine errorCode based on the content of the descriptive message
        if (errorMessageForClient.toLowerCase().includes('not found') || 
            errorMessageForClient.toLowerCase().includes('invalid') ||
            errorMessageForClient.toLowerCase().includes('dependency error') ||
            errorMessageForClient.toLowerCase().includes('does not belong')) {
          errorCode = 'BAD_USER_INPUT';
        } else if (errorMessageForClient.toLowerCase().includes('midtrans payment error')) {
          errorCode = 'PAYMENT_GATEWAY_ERROR';
        } else if (errorMessageForClient.toLowerCase().includes('database error')) {
          errorCode = 'INTERNAL_SERVER_ERROR'; 
        }
        
        throw new GraphQLError(errorMessageForClient, {
          extensions: { code: errorCode },
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
        // Implement update logic
        const Payment = require('../models/paymentModel');
        const payment = await Payment.findByPk(id);
        
        if (!payment) {
          throw new GraphQLError('Payment not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        await payment.update(input);
        return { 
          message: 'Payment updated successfully', 
          payment: payment.toJSON() 
        };
      } catch (error) {
        console.error(`GraphQL Error updating payment ${id}:`, error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(`Failed to update payment: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
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
        const Payment = require('../models/paymentModel');
        const payment = await Payment.findByPk(id);
        
        if (!payment) {
          throw new GraphQLError('Payment not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        await payment.destroy();
        return { message: 'Payment deleted successfully', id };
      } catch (error) {
        console.error(`GraphQL Error deleting payment ${id}:`, error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(`Failed to delete payment: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
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
        const Payment = require('../models/paymentModel');
        const payment = await Payment.findByPk(id);
        
        if (!payment) {
          throw new GraphQLError('Payment not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        await payment.update({ status: 'paid' });
        return { 
          message: 'Payment processed successfully', 
          payment: payment.toJSON() 
        };
      } catch (error) {
        console.error(`GraphQL Error processing payment ${id}:`, error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(`Failed to process payment: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
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
        const Payment = require('../models/paymentModel');
        const payment = await Payment.findByPk(id);
        
        if (!payment) {
          throw new GraphQLError('Payment not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        await payment.update({ status: 'cancelled' });
        return { 
          message: 'Payment cancelled successfully', 
          payment: payment.toJSON() 
        };
      } catch (error) {
        console.error(`GraphQLError cancelling payment ${id}:`, error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(`Failed to cancel payment: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
};
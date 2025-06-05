const { GraphQLError } = require('graphql');
const PaymentService = require('../services/paymentService');

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
        const result = await PaymentService.createPayment(input, context.user.id, context.token);
        return result;
      } catch (error) {
        console.error('GraphQL Error creating payment:', error);
        throw new GraphQLError(`Failed to create payment: ${error.message}`, {
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
        const payment = await PaymentService.processPayment(id, context.user.id, context.token);
        return { message: 'Payment processed successfully', payment };
      } catch (error) {
        console.error(`GraphQL Error processing payment ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
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
        console.error(`GraphQL Error cancelling payment ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        throw new GraphQLError(`Failed to cancel payment: ${error.message}`, {
          extensions: { code },
        });
      }
    },
  },
};
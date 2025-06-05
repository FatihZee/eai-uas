const { GraphQLError } = require('graphql');
const OrderService = require('../services/orderService');

module.exports = {
  Order: {
    // Field resolver untuk user
    user: async (parent, _, context) => {
      try {
        return await OrderService.getUserDetails(parent.user_id, context.token);
      } catch (error) {
        console.error(`Error fetching user for order ${parent.id}:`, error);
        return null;
      }
    },
    
    // Field resolver untuk menu
    menu: async (parent, _, context) => {
      try {
        return await OrderService.getMenuDetails(parent.menu_id, context.token);
      } catch (error) {
        console.error(`Error fetching menu for order ${parent.id}:`, error);
        return null;
      }
    },
    
    // Fix date formatting
    created_at: (parent) => {
      if (!parent.created_at) return null;
      try {
        return new Date(parent.created_at).toISOString();
      } catch (error) {
        console.error('Error formatting created_at:', error);
        return null;
      }
    }
  },

  Query: {
    orders: async (_, __, context) => {
      try {
        return await OrderService.getAllOrders(context.token);
      } catch (error) {
        console.error('GraphQL Error fetching all orders:', error);
        throw new GraphQLError(error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    order: async (_, { id }, context) => {
      try {
        const order = await OrderService.getOrderById(id, context.token);
        if (!order) {
          throw new GraphQLError('Order not found', {
            extensions: { code: 'NOT_FOUND' }
          });
        }
        return order;
      } catch (error) {
        console.error(`GraphQL Error fetching order ${id}:`, error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    ordersByUser: async (_, { userId }, context) => {
      try {
        return await OrderService.getOrdersByUserId(userId, context.token);
      } catch (error) {
        console.error(`GraphQL Error fetching orders for user ${userId}:`, error);
        throw new GraphQLError(error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    },

    orderCountByMenu: async (_, { menuId }, context) => {
      try {
        const count = await OrderService.getOrderCountByMenuId(menuId, context.token);
        return { count };
      } catch (error) {
        console.error(`GraphQL Error fetching order count for menu ${menuId}:`, error);
        throw new GraphQLError(error.message, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  },

  Mutation: {
    createOrder: async (_, { menuId, quantity }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        const order = await OrderService.createOrder({
          menuId,
          quantity,
          userId: context.user.id
        }, context.token);

        return {
          message: 'Order created successfully',
          order
        };
      } catch (error) {
        console.error('GraphQL Error creating order:', error);
        throw new GraphQLError(error.message, {
          extensions: { 
            code: error.message.includes('not found') ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR' 
          }
        });
      }
    },

    updateOrder: async (_, { id, menuId, quantity }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        const order = await OrderService.updateOrder(id, {
          menuId,
          quantity,
          userId: context.user.id
        }, context.token);

        return {
          message: 'Order updated successfully',
          order
        };
      } catch (error) {
        console.error(`GraphQL Error updating order ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('own orders')) code = 'FORBIDDEN';
        
        throw new GraphQLError(error.message, {
          extensions: { code }
        });
      }
    },

    deleteOrder: async (_, { id }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' }
        });
      }

      try {
        await OrderService.deleteOrder(id, context.user.id, context.token);
        return {
          message: 'Order deleted successfully',
          id
        };
      } catch (error) {
        console.error(`GraphQL Error deleting order ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('own orders')) code = 'FORBIDDEN';
        
        throw new GraphQLError(error.message, {
          extensions: { code }
        });
      }
    }
  }
};
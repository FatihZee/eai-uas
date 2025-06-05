const { GraphQLError } = require('graphql');
const OrderService = require('../services/orderService'); // Menggunakan OrderService

module.exports = {
  Query: {
    orders: async (_, __, context) => {
      try {
        const orders = await OrderService.getAllOrders();
        return OrderService.enrichMultipleOrdersDetails(orders, context.token);
      } catch (error) {
        console.error('GraphQL Error fetching all orders:', error);
        throw new GraphQLError(`Failed to fetch orders: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    order: async (_, { id }, context) => {
      try {
        const order = await OrderService.getOrderById(id);
        if (!order) {
          throw new GraphQLError('Order not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return OrderService.enrichOrderDetails(order, context.token);
      } catch (error) {
        console.error(`GraphQL Error fetching order ${id}:`, error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(`Failed to fetch order: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    ordersByUser: async (_, { userId }, context) => {
      try {
        const orders = await OrderService.getOrdersByUserId(userId);
        return OrderService.enrichMultipleOrdersDetails(orders, context.token);
      } catch (error) {
        console.error(`GraphQL Error fetching orders for user ${userId}:`, error);
        throw new GraphQLError(`Failed to fetch user orders: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
    orderCountByMenu: async (_, { menuId }) => {
      try {
        return await OrderService.getOrderCountByMenuId(menuId);
      } catch (error) {
        console.error(`GraphQL Error fetching order count for menu ${menuId}:`, error);
        throw new GraphQLError(`Failed to fetch order count: ${error.message}`, {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },
  Mutation: {
    createOrder: async (_, { menuId, quantity }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        const newOrder = await OrderService.createOrder(
          context.user.id,
          menuId,
          quantity,
          context.token
        );
        return {
          message: 'Order created successfully',
          order: newOrder,
        };
      } catch (error) {
        console.error('GraphQL Error creating order:', error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found') || error.message.includes('Status: 404')) code = 'BAD_USER_INPUT';
        if (error.message.includes('required')) code = 'BAD_USER_INPUT';
        throw new GraphQLError(`Failed to create order: ${error.message}`, {
          extensions: { code },
        });
      }
    },
    updateOrder: async (_, { id, menuId, quantity }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        const updatedOrder = await OrderService.updateOrder(
          id,
          context.user.id,
          menuId,
          quantity,
          context.token
        );
        return {
          message: 'Order updated successfully',
          order: updatedOrder,
        };
      } catch (error) {
        console.error(`GraphQL Error updating order ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('required')) code = 'BAD_USER_INPUT';
        if (error.message.includes('authorized')) code = 'FORBIDDEN';
        throw new GraphQLError(`Failed to update order: ${error.message}`, {
          extensions: { code },
        });
      }
    },
    deleteOrder: async (_, { id }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      try {
        // Anda mungkin ingin menambahkan logika di OrderService untuk memeriksa otorisasi
        const result = await OrderService.deleteOrder(id);
        return { message: result.message, id: result.id };
      } catch (error) {
        console.error(`GraphQL Error deleting order ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        throw new GraphQLError(`Failed to delete order: ${error.message}`, {
          extensions: { code },
        });
      }
    },
  },
  Order: {
    user: async (parentOrder, _, context) => {
      if (parentOrder.user && typeof parentOrder.user === 'object' && parentOrder.user.id) {
        return parentOrder.user;
      }
      if (!parentOrder.user_id) return null;
      if (!context.token && (process.env.USER_SERVICE_URL || 'http://localhost:3001').includes('localhost')) {
        // If user service is local and requires auth, but no token, likely won't work.
        // console.warn(`Order.user: Attempting to fetch user ${parentOrder.user_id} without a token.`);
      }
      try {
        const userRes = await require('axios').get(`${process.env.USER_SERVICE_URL || 'http://localhost:3001'}/users/${parentOrder.user_id}`, {
          headers: context.token ? { Authorization: context.token } : {},
        });
        const userData = userRes.data;
        if (userData) delete userData.password;
        return userData;
      } catch (error) {
        console.error(
          `Field resolver error fetching user ${parentOrder.user_id} for order ${parentOrder.id}:`,
          error.response?.status, // Log status
          error.response?.data,   // Log response data
          error.message           // Log original message
        );
        return null;
      }
    },
    menu: async (parentOrder, _, context) => {
      if (parentOrder.menu && typeof parentOrder.menu === 'object' && parentOrder.menu.id) {
        return parentOrder.menu;
      }
      if (!parentOrder.menu_id) return null;
      // The menu-service GET /menus/:id route is public, so token might not be strictly necessary.
      try {
        const menuRes = await require('axios').get(`${process.env.MENU_SERVICE_URL || 'http://localhost:3002'}/menus/${parentOrder.menu_id}`, {
          headers: context.token ? { Authorization: context.token } : {}, // Send if available
        });
        return menuRes.data;
      } catch (error) {
        console.error(
          `Field resolver error fetching menu ${parentOrder.menu_id} for order ${parentOrder.id}:`,
          error.response?.status, // Log status
          error.response?.data,   // Log response data
          error.message           // Log original message
        );
        return null;
      }
    },
  },
};
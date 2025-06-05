const Order = require('../models/orderModel');
const axios = require('axios');

// URL layanan lain
const USER_SERVICE_GRAPHQL_URL = process.env.USER_SERVICE_GRAPHQL_URL || 'http://localhost:4001/graphql';
const MENU_SERVICE_GRAPHQL_URL = process.env.MENU_SERVICE_GRAPHQL_URL || 'http://localhost:4002/graphql';

class OrderService {
  // Helper method untuk format tanggal
  static formatOrderDate(order) {
    if (!order) return null;
    
    return {
      ...order,
      created_at: order.created_at ? new Date(order.created_at).toISOString() : null,
      updated_at: order.updated_at ? new Date(order.updated_at).toISOString() : null
    };
  }

  static async getUserDetails(userId, token) {
    if (!userId) return null;
    
    try {
      const response = await axios.post(USER_SERVICE_GRAPHQL_URL, {
        query: `
          query GetUser($id: ID!) {
            user(id: $id) {
              id
              name
              email
              phone
              created_at
            }
          }
        `,
        variables: { id: userId.toString() }
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': token })
        }
      });

      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return null;
      }

      return response.data.data.user;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error.message);
      return null;
    }
  }

  static async getMenuDetails(menuId, token) {
    if (!menuId) return null;
    
    try {
      const response = await axios.post(MENU_SERVICE_GRAPHQL_URL, {
        query: `
          query GetMenu($id: ID!) {
            menu(id: $id) {
              id
              name
              description
              price
              user_id
              created_at
            }
          }
        `,
        variables: { id: menuId.toString() }
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': token })
        }
      });

      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return null;
      }

      return response.data.data.menu;
    } catch (error) {
      console.error(`Error fetching menu ${menuId}:`, error.message);
      return null;
    }
  }

  static async getAllOrders(token) {
    return new Promise((resolve, reject) => {
      Order.getAll((err, orders) => {
        if (err) {
          return reject(new Error('Failed to retrieve orders.'));
        }
        
        // Format dates
        const formattedOrders = orders.map(order => this.formatOrderDate(order));
        resolve(formattedOrders);
      });
    });
  }

  static async getOrderById(id, token) {
    return new Promise((resolve, reject) => {
      Order.getById(id, (err, results) => {
        if (err) {
          return reject(new Error(`Failed to retrieve order ${id}.`));
        }
        
        if (results.length === 0) {
          return resolve(null);
        }
        
        resolve(this.formatOrderDate(results[0]));
      });
    });
  }

  static async getOrdersByUserId(userId, token) {
    return new Promise((resolve, reject) => {
      Order.getByUserId(userId, (err, orders) => {
        if (err) {
          return reject(new Error(`Failed to retrieve orders for user ${userId}.`));
        }
        
        // Format dates
        const formattedOrders = orders.map(order => this.formatOrderDate(order));
        resolve(formattedOrders);
      });
    });
  }

  static async getOrderCountByMenuId(menuId, token) {
    return new Promise((resolve, reject) => {
      Order.countByMenuId(menuId, (err, results) => {
        if (err) {
          return reject(new Error(`Failed to get order count for menu ${menuId}.`));
        }
        
        resolve(results[0]?.count || 0);
      });
    });
  }

  static async createOrder(orderData, token) {
    const { menuId, quantity, userId } = orderData;

    if (!menuId || !quantity || !userId) {
      throw new Error('Menu ID, quantity, and user ID are required.');
    }

    // Verify menu exists
    const menu = await this.getMenuDetails(menuId, token);
    if (!menu) {
      throw new Error(`Menu with ID ${menuId} not found.`);
    }

    const totalPrice = parseFloat(menu.price) * parseInt(quantity);
    
    const newOrderData = {
      user_id: userId,
      menu_id: parseInt(menuId),
      quantity: parseInt(quantity),
      total_price: totalPrice,
      created_at: new Date(),
      updated_at: new Date()
    };

    return new Promise((resolve, reject) => {
      Order.create(newOrderData, (err, result) => {
        if (err) {
          return reject(new Error(`Failed to create order: ${err.message}`));
        }
        
        const createdOrder = {
          id: result.insertId,
          ...newOrderData
        };
        
        resolve(this.formatOrderDate(createdOrder));
      });
    });
  }

  static async updateOrder(id, orderData, token) {
    const { menuId, quantity, userId } = orderData;

    // Check if order exists and belongs to user
    const existingOrder = await this.getOrderById(id, token);
    if (!existingOrder) {
      throw new Error(`Order with ID ${id} not found.`);
    }

    if (existingOrder.user_id !== userId) {
      throw new Error('You can only update your own orders.');
    }

    // Verify menu exists if menuId is provided
    if (menuId) {
      const menu = await this.getMenuDetails(menuId, token);
      if (!menu) {
        throw new Error(`Menu with ID ${menuId} not found.`);
      }
    }

    const updateData = {
      updated_at: new Date()
    };

    if (menuId) updateData.menu_id = parseInt(menuId);
    if (quantity) updateData.quantity = parseInt(quantity);

    // Recalculate total price if menu or quantity changed
    if (menuId || quantity) {
      const finalMenuId = menuId || existingOrder.menu_id;
      const finalQuantity = quantity || existingOrder.quantity;
      
      const menu = await this.getMenuDetails(finalMenuId, token);
      updateData.total_price = parseFloat(menu.price) * parseInt(finalQuantity);
    }

    return new Promise((resolve, reject) => {
      Order.update(id, updateData, async (err, result) => {
        if (err) {
          return reject(new Error(`Failed to update order ${id}: ${err.message}`));
        }

        if (result.affectedRows === 0) {
          return reject(new Error(`Order ${id} not found for update.`));
        }

        // Return updated order
        const updatedOrder = await this.getOrderById(id, token);
        resolve(updatedOrder);
      });
    });
  }

  static async deleteOrder(id, userId, token) {
    // Check if order exists and belongs to user
    const existingOrder = await this.getOrderById(id, token);
    if (!existingOrder) {
      throw new Error(`Order with ID ${id} not found.`);
    }

    if (existingOrder.user_id !== userId) {
      throw new Error('You can only delete your own orders.');
    }

    return new Promise((resolve, reject) => {
      Order.delete(id, (err, result) => {
        if (err) {
          return reject(new Error(`Failed to delete order ${id}: ${err.message}`));
        }

        if (result.affectedRows === 0) {
          return reject(new Error(`Order ${id} not found for deletion.`));
        }

        resolve({ message: 'Order deleted successfully', id });
      });
    });
  }
}

module.exports = OrderService;
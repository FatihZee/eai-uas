const axios = require('axios');
const Order = require('../models/orderModel'); // Sesuaikan path jika berbeda

// URL layanan lain (ambil dari .env jika memungkinkan)
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const MENU_SERVICE_URL = process.env.MENU_SERVICE_URL || 'http://localhost:3002';

class OrderService {
  static async getAllOrders() {
    return new Promise((resolve, reject) => {
      Order.getAll((err, results) => {
        if (err) {
          return reject(new Error('Failed to retrieve orders from database.'));
        }
        resolve(results);
      });
    });
  }

  static async getOrderById(id) {
    return new Promise((resolve, reject) => {
      Order.getById(id, (err, results) => {
        if (err) {
          return reject(new Error(`Failed to retrieve order ${id} from database.`));
        }
        if (results.length === 0) {
          return resolve(null); // Atau throw error jika lebih sesuai
        }
        resolve(results[0]);
      });
    });
  }

  static async getOrdersByUserId(userId) {
    return new Promise((resolve, reject) => {
      Order.getByUserId(userId, (err, results) => {
        if (err) {
          return reject(new Error(`Failed to retrieve orders for user ${userId}.`));
        }
        resolve(results);
      });
    });
  }

  static async getOrderCountByMenuId(menuId) {
    return new Promise((resolve, reject) => {
      Order.countByMenuId(menuId, (err, result) => {
        if (err) {
          return reject(new Error(`Failed to count orders for menu ${menuId}.`));
        }
        resolve({ count: result[0] ? result[0].count : 0 });
      });
    });
  }

  static async createOrder(userId, menuId, quantity, token) {
    if (!userId || !menuId || !quantity || quantity <= 0) {
      throw new Error('User ID, Menu ID, and a valid quantity are required.');
    }

    try {
      const userRes = await axios.get(`${USER_SERVICE_URL}/users/${userId}`, {
        headers: { Authorization: token },
      });
      const user = userRes.data;
      const safeUserData = { ...user };
      delete safeUserData.password;

      const menuRes = await axios.get(`${MENU_SERVICE_URL}/menus/${menuId}`, {
        // Asumsi menu service mungkin tidak butuh token untuk GET by ID, tapi sertakan jika perlu
        headers: { Authorization: token },
      });
      const menu = menuRes.data;

      if (!menu || !menu.price) {
        throw new Error(`Menu with ID ${menuId} not found or has no price.`);
      }

      const totalPrice = parseFloat(menu.price) * parseInt(quantity);
      const orderData = {
        user_id: parseInt(userId),
        menu_id: parseInt(menuId),
        quantity: parseInt(quantity),
        total_price: totalPrice,
      };

      return new Promise((resolve, reject) => {
        Order.create(orderData, (err, result) => {
          if (err) {
            return reject(new Error('Failed to create order in database.'));
          }
          resolve({
            id: result.insertId,
            ...orderData,
            user: safeUserData, // Menyertakan data user yang sudah di-fetch
            menu: menu,         // Menyertakan data menu yang sudah di-fetch
          });
        });
      });
    } catch (error) {
      console.error('Error in OrderService.createOrder:', error.message);
      if (error.response) { // Error dari axios call
        throw new Error(`External service error: ${error.response.data.message || error.message} (Status: ${error.response.status})`);
      }
      throw new Error(`Failed to process order creation: ${error.message}`);
    }
  }

  static async updateOrder(orderId, userId, menuId, quantity, token) {
     if (!orderId || !userId || !menuId || !quantity || quantity <= 0) {
      throw new Error('Order ID, User ID, Menu ID, and a valid quantity are required.');
    }
    // Pertama, cek apakah order ada dan milik user yang benar (jika ada aturan seperti itu)
    const existingOrder = await this.getOrderById(orderId);
    if (!existingOrder) {
        throw new Error(`Order with ID ${orderId} not found.`);
    }
    // Anda mungkin ingin menambahkan validasi apakah userId dari token cocok dengan userId yang melakukan update
    // atau apakah order tersebut milik user yang melakukan update.
    // if (existingOrder.user_id !== parseInt(userId)) { // Contoh validasi kepemilikan
    //   throw new Error('User not authorized to update this order.');
    // }

    try {
      const userRes = await axios.get(`${USER_SERVICE_URL}/users/${userId}`, {
        headers: { Authorization: token },
      });
      const user = userRes.data;
      const safeUserData = { ...user };
      delete safeUserData.password;

      const menuRes = await axios.get(`${MENU_SERVICE_URL}/menus/${menuId}`, {
        headers: { Authorization: token },
      });
      const menu = menuRes.data;

      if (!menu || !menu.price) {
        throw new Error(`Menu with ID ${menuId} not found or has no price.`);
      }

      const totalPrice = parseFloat(menu.price) * parseInt(quantity);
      const updatedData = {
        user_id: parseInt(userId), // Atau biarkan user_id dari order asli jika tidak boleh diubah
        menu_id: parseInt(menuId),
        quantity: parseInt(quantity),
        total_price: totalPrice,
      };

      return new Promise((resolve, reject) => {
        Order.update(orderId, updatedData, (err, result) => {
          if (err) {
            return reject(new Error(`Failed to update order ${orderId} in database.`));
          }
          if (result.affectedRows === 0) {
             return reject(new Error(`Order with ID ${orderId} not found for update.`));
          }
          resolve({
            id: parseInt(orderId),
            ...updatedData,
            user: safeUserData,
            menu: menu,
          });
        });
      });
    } catch (error) {
      console.error('Error in OrderService.updateOrder:', error.message);
       if (error.response) {
        throw new Error(`External service error: ${error.response.data.message || error.message} (Status: ${error.response.status})`);
      }
      throw new Error(`Failed to process order update: ${error.message}`);
    }
  }

  static async deleteOrder(orderId) {
    return new Promise((resolve, reject) => {
      Order.delete(orderId, (err, result) => {
        if (err) {
          return reject(new Error(`Failed to delete order ${orderId} from database.`));
        }
        if (result.affectedRows === 0) {
            return reject(new Error(`Order with ID ${orderId} not found for deletion.`));
        }
        resolve({ message: 'Order deleted successfully', id: orderId });
      });
    });
  }

  // Helper untuk mengambil detail user dan menu untuk sebuah order
  static async enrichOrderDetails(order, token) {
    if (!order) return null;
    let user = null;
    let menu = null;
    let enrichmentError = null;

    try {
      // Fetch user details
      if (order.user_id) {
        const userRes = await axios.get(`${USER_SERVICE_URL}/users/${order.user_id}`, {
          headers: token ? { Authorization: token } : {},
        });
        user = userRes.data;
        if (user) delete user.password;
      }
    } catch (error) {
      console.error(
        `Failed to fetch user ${order.user_id} for order ${order.id}:`,
        error.response?.status, // Log status
        error.response?.data,   // Log response data
        error.message           // Log original message
      );
      enrichmentError = `User fetch failed: ${error.message}`;
    }

    try {
      // Fetch menu details
      if (order.menu_id) {
        const menuRes = await axios.get(`${MENU_SERVICE_URL}/menus/${order.menu_id}`, {
          // menu-service GET /menus/:id is public, token might not be strictly needed
          // but sending it if available for consistency or future changes.
          headers: token ? { Authorization: token } : {},
        });
        menu = menuRes.data;
      }
    } catch (error) {
      console.error(
        `Failed to fetch menu ${order.menu_id} for order ${order.id}:`,
        error.response?.status, // Log status
        error.response?.data,   // Log response data
        error.message           // Log original message
      );
      // Append to enrichmentError if it already exists
      const menuErrorMsg = `Menu fetch failed: ${error.message}`;
      enrichmentError = enrichmentError ? `${enrichmentError}; ${menuErrorMsg}` : menuErrorMsg;
    }

    return {
      ...order,
      user: user,
      menu: menu,
      ...(enrichmentError && { enrichmentError: enrichmentError }), // Add enrichmentError only if it exists
    };
  }

  static async enrichMultipleOrdersDetails(orders, token) {
    if (!orders || orders.length === 0) return [];
    return Promise.all(orders.map(order => this.enrichOrderDetails(order, token)));
  }
}

module.exports = OrderService;
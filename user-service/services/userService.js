const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

// URL layanan lain (ambil dari .env jika memungkinkan)
// Asumsi order-service dan review-service sudah atau akan memiliki endpoint GraphQL
const ORDER_SERVICE_GRAPHQL_URL = process.env.ORDER_SERVICE_GRAPHQL_URL || 'http://localhost:4003/graphql';
const REVIEW_SERVICE_GRAPHQL_URL = process.env.REVIEW_SERVICE_GRAPHQL_URL || 'http://localhost:4004/graphql'; // Ganti port jika berbeda
const MENU_SERVICE_GRAPHQL_URL = process.env.MENU_SERVICE_GRAPHQL_URL || 'http://localhost:4002/graphql'; // Ganti port jika berbeda

class UserService {
  static async getAllUsers() {
    return new Promise((resolve, reject) => {
      User.getAll((err, users) => {
        if (err) {
          return reject(new Error('Failed to retrieve users from database.'));
        }
        // Hapus password dari semua user
        resolve(users.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        }));
      });
    });
  }

  static async getUserById(id) {
    return new Promise((resolve, reject) => {
      User.getById(id, (err, results) => {
        if (err) {
          return reject(new Error(`Failed to retrieve user ${id} from database.`));
        }
        if (results.length === 0) {
          return resolve(null);
        }
        const { password, ...userWithoutPassword } = results[0];
        resolve(userWithoutPassword);
      });
    });
  }

  static async registerUser(userData) {
    if (!userData.email || !userData.password || !userData.name) {
      throw new Error('Name, email, and password are required for registration.');
    }
    // Cek apakah email sudah ada
    const existingUser = await new Promise((resolve, reject) => {
        User.findByEmail(userData.email, (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
    if (existingUser) {
        throw new Error('Email already exists.');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = { ...userData, password: hashedPassword };

    return new Promise((resolve, reject) => {
      User.create(newUser, (err, result) => {
        if (err) {
          return reject(new Error('Failed to register user in database.'));
        }
        const { password, ...userWithoutPassword } = { id: result.insertId, ...newUser };
        resolve(userWithoutPassword);
      });
    });
  }

  static async loginUser(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required for login.');
    }
    return new Promise((resolve, reject) => {
      User.findByEmail(email, async (err, results) => {
        if (err) {
          return reject(new Error('Database error during login.'));
        }
        if (results.length === 0) {
          return reject(new Error('Invalid email or password.'));
        }
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return reject(new Error('Invalid email or password.'));
        }
        const { password: _, ...userWithoutPassword } = user;
        const token = jwt.sign(
          { id: user.id, email: user.email, name: user.name },
          process.env.JWT_SECRET,
          { expiresIn: '1h' } // Atau '1d', '7d', dll.
        );
        resolve({ token, user: userWithoutPassword });
      });
    });
  }

  static async updateUser(id, userData, requestingUserId) {
    if (parseInt(id) !== requestingUserId) {
        throw new Error('User not authorized to update this profile.');
    }
    // Jika password diupdate, hash password baru
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    } else {
      delete userData.password; // Jangan update password jika tidak disediakan
    }

    return new Promise((resolve, reject) => {
      User.update(id, userData, (err, result) => {
        if (err) {
          return reject(new Error(`Failed to update user ${id} in database.`));
        }
        if (result.affectedRows === 0) {
          return reject(new Error(`User with ID ${id} not found for update.`));
        }
        resolve({ message: 'User updated successfully' });
      });
    });
  }

  static async deleteUser(id, requestingUserId) {
     if (parseInt(id) !== requestingUserId) { // Hanya user sendiri yang bisa delete akunnya
        throw new Error('User not authorized to delete this profile.');
    }
    return new Promise((resolve, reject) => {
      User.delete(id, (err, result) => {
        if (err) {
          return reject(new Error(`Failed to delete user ${id} from database.`));
        }
        if (result.affectedRows === 0) {
          return reject(new Error(`User with ID ${id} not found for deletion.`));
        }
        resolve({ message: 'User deleted successfully', id: id });
      });
    });
  }

  // --- Metode untuk GraphQL Resolvers (mengambil data terkait) ---

  static async getOrdersForUser(userId, token) {
    try {
      const graphqlQuery = {
        query: `
          query GetOrdersByUser($userId: ID!) {
            ordersByUser(userId: $userId) {
              id
              menu_id # Kita butuh menu_id untuk mengambil detail menu nanti
              quantity
              total_price
              created_at
              # Tidak perlu user field di sini karena kita sudah dalam context user
              # menu field akan di-resolve terpisah atau oleh order-service
            }
          }
        `,
        variables: { userId: userId.toString() }
      };
      const response = await axios.post(ORDER_SERVICE_GRAPHQL_URL, graphqlQuery, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': token })
        }
      });
      if (response.data.errors) {
        console.error(`GraphQL errors fetching orders for user ${userId}:`, response.data.errors);
        return [];
      }
      const orders = response.data.data.ordersByUser || [];
      // Enrich orders with menu details
      return Promise.all(orders.map(async order => {
        const menu = await this.getMenuDetails(order.menu_id, token);
        return { ...order, menu };
      }));
    } catch (error) {
      console.error(`Error fetching orders for user ${userId} from OrderService:`, error.message);
      return [];
    }
  }

  static async getReviewsForUser(userId, token) {
    try {
      // Asumsi review-service akan punya query 'reviewsByUser'
      const graphqlQuery = {
        query: `
          query GetReviewsByUser($userId: ID!) {
            reviewsByUser(userId: $userId) { # Sesuaikan nama query jika berbeda di review-service
              id
              menu_id # Kita butuh menu_id untuk mengambil detail menu nanti
              order_id
              rating
              comment
              sentiment
              created_at
              # Tidak perlu user field di sini
              # menu field akan di-resolve terpisah atau oleh review-service
            }
          }
        `,
        variables: { userId: userId.toString() }
      };
      const response = await axios.post(REVIEW_SERVICE_GRAPHQL_URL, graphqlQuery, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': token })
        }
      });
      if (response.data.errors) {
        console.error(`GraphQL errors fetching reviews for user ${userId}:`, response.data.errors);
        return [];
      }
      const reviews = response.data.data.reviewsByUser || [];
      // Enrich reviews with menu details
      return Promise.all(reviews.map(async review => {
        const menu = await this.getMenuDetails(review.menu_id, token);
        return { ...review, menu };
      }));
    } catch (error) {
      console.error(`Error fetching reviews for user ${userId} from ReviewService:`, error.message);
      return [];
    }
  }

  // Helper untuk mengambil detail menu dari menu-service via GraphQL
  static async getMenuDetails(menuId, token) {
    if (!menuId) return null;
    try {
      const graphqlQuery = {
        query: `
          query GetMenuById($menuId: ID!) {
            menu(id: $menuId) {
              id
              name
              price
              description
            }
          }
        `,
        variables: { menuId: menuId.toString() }
      };
      const response = await axios.post(MENU_SERVICE_GRAPHQL_URL, graphqlQuery, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': token })
        }
      });
      if (response.data.errors) {
        console.error(`GraphQL errors fetching menu ${menuId}:`, response.data.errors);
        return { id: menuId, name: 'Unknown Menu (Fetch Error)' };
      }
      return response.data.data.menu;
    } catch (error) {
      console.error(`Error fetching menu ${menuId} from MenuService:`, error.message);
      return { id: menuId, name: 'Unknown Menu (Fetch Error)' };
    }
  }
}

module.exports = UserService;
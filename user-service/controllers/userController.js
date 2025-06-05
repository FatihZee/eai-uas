const UserService = require('../services/userService');
// const User = require('../models/userModel'); // Tidak lagi langsung
// const bcrypt = require('bcryptjs'); // Sudah di service
// const jwt = require('jsonwebtoken'); // Sudah di service
// const axios = require('axios'); // Sudah di service

module.exports = {
  getAllUsers: async (req, res) => {
    try {
      const users = await UserService.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get all users', detail: error.message });
    }
  },

  getUserById: async (req, res) => {
    const id = req.params.id;
    try {
      const user = await UserService.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: `Failed to get user ${id}`, detail: error.message });
    }
  },

  registerUser: async (req, res) => {
    try {
      const newUser = await UserService.registerUser(req.body);
      res.status(201).json(newUser); // Service sudah mengembalikan user tanpa password
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('required') || error.message.includes('Email already exists')) {
        statusCode = 400;
      }
      res.status(statusCode).json({ error: 'Failed to register user', detail: error.message });
    }
  },

  loginUser: async (req, res) => {
    const { email, password } = req.body;
    try {
      const { token, user } = await UserService.loginUser(email, password);
      res.json({ message: 'Login successful', token, user });
    } catch (error) {
      let statusCode = 401; // Unauthorized untuk login gagal
      if (error.message.includes('Database error')) statusCode = 500;
      res.status(statusCode).json({ error: 'Login failed', detail: error.message });
    }
  },

  updateUser: async (req, res) => {
    const id = req.params.id;
    const requestingUserId = req.user.id; // Dari authMiddleware
    try {
      const result = await UserService.updateUser(id, req.body, requestingUserId);
      res.json(result);
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      if (error.message.includes('authorized')) statusCode = 403;
      res.status(statusCode).json({ error: 'Failed to update user', detail: error.message });
    }
  },

  deleteUser: async (req, res) => {
    const id = req.params.id;
    const requestingUserId = req.user.id; // Dari authMiddleware
    try {
      const result = await UserService.deleteUser(id, requestingUserId);
      res.json(result);
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      if (error.message.includes('authorized')) statusCode = 403;
      res.status(statusCode).json({ error: `Failed to delete user ${id}`, detail: error.message });
    }
  },

  // Endpoint ini mungkin bisa di-deprecate jika GraphQL sudah mencakup fungsionalitasnya
  // atau diubah untuk menggunakan service layer jika masih dibutuhkan via REST.
  getUserWithOrdersAndReviews: async (req, res) => {
    const userId = req.params.id;
    const token = req.headers.authorization; // Token dibutuhkan untuk service calls

    try {
      const user = await UserService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Panggil metode service yang mengambil order dan review
      // Ini adalah contoh, implementasi detailnya ada di UserService
      const orders = await UserService.getOrdersForUser(userId, token);
      const reviews = await UserService.getReviewsForUser(userId, token); // Asumsi ada method ini

      // Gabungkan data orders dan reviews
      // Logika ini mungkin lebih kompleks tergantung bagaimana Anda ingin menyajikan data reviews per order
      const ordersWithReviews = orders.map(order => {
        const orderReviews = reviews.filter(review => review.order_id === order.id);
        return {
          ...order,
          reviews: orderReviews.map(r => ({
            review_id: r.id,
            rating: r.rating,
            comment: r.comment,
            sentiment: r.sentiment,
            // menu: r.menu // menu sudah ada di dalam review dari UserService.getReviewsForUser
          })),
          // menu: order.menu // menu sudah ada di dalam order dari UserService.getOrdersForUser
        };
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        orders: ordersWithReviews,
      });
    } catch (error) {
      console.error(`Error in getUserWithOrdersAndReviews for user ${userId}:`, error.message);
      res.status(500).json({
        error: 'Failed to retrieve user with orders and reviews',
        detail: error.message,
      });
    }
  },
};

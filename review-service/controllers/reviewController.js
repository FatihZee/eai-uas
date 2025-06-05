const ReviewService = require('../services/reviewService');

module.exports = {
  getAllReviews: async (req, res) => {
    try {
      const token = req.headers.authorization;
      const reviews = await ReviewService.getAllReviews(token);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get all reviews', detail: error.message });
    }
  },

  getReviewById: async (req, res) => {
    const id = req.params.id;
    const token = req.headers.authorization;
    try {
      const review = await ReviewService.getReviewById(id, token);
      if (!review) return res.status(404).json({ message: 'Review not found' });
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: `Failed to get review ${id}`, detail: error.message });
    }
  },

  getReviewsByUserId: async (req, res) => {
    const userId = req.params.userId;
    const token = req.headers.authorization;
    try {
      const reviews = await ReviewService.getReviewsByUserId(userId, token);
      const userDetails = await ReviewService._fetchUserDetails(userId, token);
      res.json({ user: userDetails, reviews });
    } catch (error) {
      res.status(500).json({ error: `Failed to get reviews for user ${userId}`, detail: error.message });
    }
  },

  getReviewsByMenuId: async (req, res) => {
    const menuId = req.params.menuId;
    const token = req.headers.authorization;
    try {
      const reviews = await ReviewService.getReviewsByMenuId(menuId, token);
      const menuDetails = await ReviewService._fetchMenuDetails(menuId, token);
      const stats = await ReviewService.getReviewStatsByMenuId(menuId, token);
      res.json({ menu: menuDetails, averageRating: stats.averageRating, reviewCount: stats.reviewCount, reviews });
    } catch (error) {
      res.status(500).json({ error: `Failed to get reviews for menu ${menuId}`, detail: error.message });
    }
  },
  
  getReviewsByOrderId: async (req, res) => {
    const orderId = req.params.orderId;
    const token = req.headers.authorization;
    try {
        const reviews = await ReviewService.getReviewsByOrderId(orderId, token);
        const orderDetails = await ReviewService._fetchOrderDetails(orderId, token);
        let menuDetails = null;
        if (orderDetails && orderDetails.menu_id) {
            menuDetails = await ReviewService._fetchMenuDetails(orderDetails.menu_id, token);
        }
        res.json({ order: {...orderDetails, menu: menuDetails }, reviews });
    } catch (error) {
        res.status(500).json({ error: `Failed to get reviews for order ${orderId}`, detail: error.message });
    }
  },

  createReview: async (req, res) => {
    const reviewData = req.body;
    const userId = req.user.id;
    const token = req.headers.authorization;
    try {
      const newReview = await ReviewService.createReview(reviewData, userId, token);
      res.status(201).json({ message: 'Review created successfully', review: newReview });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('required') || error.message.includes('not found') || error.message.includes('own orders')) {
        statusCode = 400;
      }
      if (error.message.includes('own orders')) statusCode = 403;
      res.status(statusCode).json({ error: 'Failed to create review', detail: error.message });
    }
  },

  updateReview: async (req, res) => {
    const id = req.params.id;
    const reviewData = req.body;
    const userId = req.user.id;
    const token = req.headers.authorization;
    try {
      const updatedReview = await ReviewService.updateReview(id, reviewData, userId, token);
      res.json({ message: 'Review updated successfully', review: updatedReview });
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      if (error.message.includes('own reviews')) statusCode = 403;
      res.status(statusCode).json({ error: 'Failed to update review', detail: error.message });
    }
  },

  deleteReview: async (req, res) => {
    const id = req.params.id;
    const userId = req.user.id;
    const token = req.headers.authorization;
    try {
      const result = await ReviewService.deleteReview(id, userId, token);
      res.json(result);
    } catch (error) {
      let statusCode = 500;
      if (error.message.includes('not found')) statusCode = 404;
      if (error.message.includes('own reviews')) statusCode = 403;
      res.status(statusCode).json({ error: `Failed to delete review ${id}`, detail: error.message });
    }
  },

  getReviewStatsByMenuId: async (req, res) => {
    const menuId = req.params.menuId;
    const token = req.headers.authorization;
    try {
      const stats = await ReviewService.getReviewStatsByMenuId(menuId, token);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: `Failed to get review stats for menu ${menuId}`, detail: error.message });
    }
  },

  getReviewsByMenuIdAndSentiment: async (req, res) => {
    const { menuId, sentiment } = req.params;
    const token = req.headers.authorization;
    try {
        const reviews = await ReviewService.getReviewsByMenuIdAndSentiment(menuId, sentiment, token);
        const menuDetails = await ReviewService._fetchMenuDetails(menuId, token);
        res.json({ menu: menuDetails, sentiment, reviewCount: reviews.length, reviews });
    } catch (error) {
        res.status(500).json({ error: `Failed to get reviews for menu ${menuId} and sentiment ${sentiment}`, detail: error.message });
    }
  },

  getSentimentStatsByMenuId: async (req, res) => {
    const menuId = req.params.menuId;
    try {
        const stats = await ReviewService.getSentimentStatsByMenuId(menuId);
        const menuDetails = await ReviewService._fetchMenuDetails(menuId, req.headers.authorization);
        res.json({ menu: menuDetails, sentimentStats: stats });
    } catch (error) {
        res.status(500).json({ error: `Failed to get sentiment stats for menu ${menuId}`, detail: error.message });
    }
  }
};
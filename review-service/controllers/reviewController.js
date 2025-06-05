const ReviewService = require('../services/reviewService');
// const Review = require('../models/reviewModel'); // Tidak lagi langsung
// const axios = require('axios'); // Sudah di service
// const { analyzeSentiment } = require('../helpers/sentimentAnalyzer'); // Sudah di service
// const db = require('../config/db'); // Sudah di service

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
      // Untuk REST, mungkin kita ingin mengambil detail user juga di sini
      const userDetails = await ReviewService._fetchUserDetails(userId, token); // Gunakan helper dari service
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
      // Untuk REST, mungkin kita ingin mengambil detail menu juga di sini
      const menuDetails = await ReviewService._fetchMenuDetails(menuId, token); // Gunakan helper dari service
      const stats = await ReviewService.getReviewStatsByMenuId(menuId, token); // Ambil stats juga
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
        // Untuk REST, mungkin kita ingin mengambil detail order juga di sini
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
    const reviewData = req.body; // { orderId, rating, comment }
    const userId = req.user.id; // Dari authMiddleware
    const token = req.headers.authorization;
    try {
      const newReview = await ReviewService.createReview(reviewData, userId, token);
      let aiRecommendation = null;
      if (newReview.sentiment === 'negative' && process.env.OPENROUTER_API_KEY) {
          try {
            const recommendationResult = await ReviewService.generateAndSaveAIRecommendation(newReview.id, token);
            aiRecommendation = recommendationResult.recommendation;
          } catch (aiError) {
            console.warn("Failed to generate AI recommendation during review creation (REST):", aiError.message);
            // Tidak menghentikan response utama jika AI gagal
          }
      }
      res.status(201).json({ message: 'Review created successfully', review: newReview, aiRecommendation });
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
    const reviewData = req.body; // { rating, comment }
    const userId = req.user.id; // Dari authMiddleware
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
    const userId = req.user.id; // Dari authMiddleware
    const token = req.headers.authorization; // Diperlukan jika getReviewById di service butuh token
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
    const token = req.headers.authorization; // Diperlukan jika service butuh token
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
        const menuDetails = await ReviewService._fetchMenuDetails(menuId, req.headers.authorization); // Token untuk fetch menu
        res.json({ menu: menuDetails, sentimentStats: stats });
    } catch (error) {
        res.status(500).json({ error: `Failed to get sentiment stats for menu ${menuId}`, detail: error.message });
    }
  },
  
  getAIRecommendation: async (req, res) => {
    const { reviewId } = req.params;
    const token = req.headers.authorization; // Diperlukan jika service butuh token
    try {
        let recommendation = await ReviewService.getAIRecommendationForReview(reviewId);
        if (!recommendation && process.env.OPENROUTER_API_KEY) { // Jika belum ada, coba generate
            console.log(`[REST] AI Recommendation for review ${reviewId} not found, attempting to generate...`);
            recommendation = await ReviewService.generateAndSaveAIRecommendation(reviewId, token);
        }
        if (!recommendation) {
            return res.status(404).json({ message: 'AI Recommendation not found and could not be generated.' });
        }
        res.json(recommendation);
    } catch (error) {
        console.error(`[REST] Error in getAIRecommendation for review ${reviewId}:`, error.message);
        res.status(500).json({ error: 'Failed to get or generate AI recommendation', detail: error.message });
    }
  }
};
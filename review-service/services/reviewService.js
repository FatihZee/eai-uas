const Review = require('../models/reviewModel');
const { analyzeSentiment } = require('../helpers/sentimentAnalyzer');
const axios = require('axios');
const db = require('../config/db'); // Untuk saveAIRecommendationToDb
require('dotenv').config();

// URL layanan lain (GraphQL endpoints)
const USER_SERVICE_GRAPHQL_URL = process.env.USER_SERVICE_GRAPHQL_URL || 'http://localhost:4001/graphql';
const MENU_SERVICE_GRAPHQL_URL = process.env.MENU_SERVICE_GRAPHQL_URL || 'http://localhost:4002/graphql';
const ORDER_SERVICE_GRAPHQL_URL = process.env.ORDER_SERVICE_GRAPHQL_URL || 'http://localhost:4003/graphql';

class ReviewService {

  static async _fetchUserDetails(userId, token) {
    if (!userId) return null;
    try {
      const response = await axios.post(USER_SERVICE_GRAPHQL_URL, {
        query: `query GetUser($id: ID!) { user(id: $id) { id name email phone } }`,
        variables: { id: userId.toString() }
      }, { headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': token }) } });
      if (response.data.errors) throw new Error(response.data.errors.map(e => e.message).join(', '));
      return response.data.data.user;
    } catch (error) {
      console.error(`Error fetching user ${userId} from UserService:`, error.message);
      return { id: userId, name: 'Unknown User (Fetch Error)' };
    }
  }

  static async _fetchMenuDetails(menuId, token) {
    if (!menuId) return null;
    try {
      const response = await axios.post(MENU_SERVICE_GRAPHQL_URL, {
        query: `query GetMenu($id: ID!) { menu(id: $id) { id name description price } }`,
        variables: { id: menuId.toString() }
      }, { headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': token }) } });
      if (response.data.errors) throw new Error(response.data.errors.map(e => e.message).join(', '));
      return response.data.data.menu;
    } catch (error) {
      console.error(`Error fetching menu ${menuId} from MenuService:`, error.message);
      return { id: menuId, name: 'Unknown Menu (Fetch Error)' };
    }
  }

  static async _fetchOrderDetails(orderId, token) {
    if (!orderId) return null;
    try {
      const response = await axios.post(ORDER_SERVICE_GRAPHQL_URL, {
        query: `query GetOrder($id: ID!) { order(id: $id) { id user_id menu_id quantity total_price } }`,
        variables: { id: orderId.toString() }
      }, { headers: { 'Content-Type': 'application/json', ...(token && { 'Authorization': token }) } });
      if (response.data.errors) throw new Error(response.data.errors.map(e => e.message).join(', '));
      return response.data.data.order;
    } catch (error) {
      console.error(`Error fetching order ${orderId} from OrderService:`, error.message);
      return { id: orderId, details: 'Unknown Order (Fetch Error)' };
    }
  }

  static async _enrichReview(review, token) {
    if (!review) return null;
    const [user, menu, order] = await Promise.all([
      this._fetchUserDetails(review.user_id, token),
      this._fetchMenuDetails(review.menu_id, token),
      this._fetchOrderDetails(review.order_id, token) // Order mungkin tidak selalu dibutuhkan, tergantung konteks
    ]);
    return { ...review, user, menu, order }; // order bisa null jika tidak relevan
  }

  static async _enrichMultipleReviews(reviews, token) {
    return Promise.all(reviews.map(review => this._enrichReview(review, token)));
  }

  static async getAllReviews(token) {
    return new Promise((resolve, reject) => {
      Review.getAll(async (err, reviews) => {
        if (err) return reject(new Error('Failed to retrieve reviews.'));
        resolve(await this._enrichMultipleReviews(reviews, token));
      });
    });
  }

  static async getReviewById(id, token) {
    return new Promise((resolve, reject) => {
      Review.getById(id, async (err, results) => {
        if (err) return reject(new Error(`Failed to retrieve review ${id}.`));
        if (results.length === 0) return resolve(null);
        resolve(await this._enrichReview(results[0], token));
      });
    });
  }

  static async getReviewsByUserId(userId, token) {
    return new Promise((resolve, reject) => {
      Review.getByUserId(userId, async (err, reviews) => {
        if (err) return reject(new Error(`Failed to retrieve reviews for user ${userId}.`));
        const enrichedReviews = await Promise.all(reviews.map(async review => {
            const menu = await this._fetchMenuDetails(review.menu_id, token);
            // User detail tidak perlu di-fetch lagi karena kita sudah dalam konteks user
            return { ...review, menu };
        }));
        resolve(enrichedReviews);
      });
    });
  }

  static async getReviewsByMenuId(menuId, token) {
    return new Promise((resolve, reject) => {
      Review.getByMenuId(menuId, async (err, reviews) => {
        if (err) return reject(new Error(`Failed to retrieve reviews for menu ${menuId}.`));
        const enrichedReviews = await Promise.all(reviews.map(async review => {
            const user = await this._fetchUserDetails(review.user_id, token);
            // Menu detail tidak perlu di-fetch lagi
            return { ...review, user };
        }));
        resolve(enrichedReviews);
      });
    });
  }
  
  static async getReviewsByOrderId(orderId, token) {
    return new Promise((resolve, reject) => {
      Review.getByOrderId(orderId, async (err, reviews) => {
        if (err) return reject(new Error(`Failed to retrieve reviews for order ${orderId}.`));
        resolve(await this._enrichMultipleReviews(reviews, token)); // Enrich dengan user dan menu
      });
    });
  }

  static async createReview(reviewData, requestingUserId, token) {
    const { orderId, rating, comment } = reviewData;
    if (!orderId || rating === undefined) {
      throw new Error('Order ID and rating are required.');
    }

    const order = await this._fetchOrderDetails(orderId, token);
    if (!order || order.details) { 
        throw new Error(`Order with ID ${orderId} not found or failed to fetch.`);
    }
    if (order.user_id !== requestingUserId) {
      throw new Error('You can only review your own orders.');
    }
    if (!order.menu_id) {
        throw new Error('Menu ID is missing from the order details.');
    }

    // analyzeSentiment will log its own errors to the console and return "Neutral" on failure.
    const sentiment = comment ? await analyzeSentiment(comment) : 'neutral';
    
    const newReviewData = {
      user_id: requestingUserId,
      menu_id: order.menu_id,
      order_id: parseInt(orderId),
      rating,
      comment: comment || '',
      sentiment,
      created_at: new Date()
    };

    return new Promise((resolve, reject) => {
      Review.create(newReviewData, async (dbErr, dbResult) => {
        if (dbErr) {
          // Error during database insertion
          return reject(new Error(`Failed to save review to database: ${dbErr.message}`));
        }
        try {
          const createdReview = { id: dbResult.insertId, ...newReviewData };
          
          // Enrich with user and menu for the response
          // These calls might throw if dependent services are down or return errors
          const user = await this._fetchUserDetails(createdReview.user_id, token);
          const menu = await this._fetchMenuDetails(createdReview.menu_id, token);
          
          resolve({ ...createdReview, user, menu });
        } catch (fetchErr) {
          // Error fetching user/menu details AFTER review was created in DB
          console.error(`Error fetching user/menu details for review ${dbResult.insertId}:`, fetchErr.message);
          // Reject the whole operation with a clear message
          reject(new Error(`Review was created (ID: ${dbResult.insertId}), but failed to fetch associated user/menu details: ${fetchErr.message}`));
        }
      });
    });
  }

  static async updateReview(id, reviewData, requestingUserId, token) {
    const { rating, comment } = reviewData;
    const existingReview = await this.getReviewById(id, token); // getReviewById sudah mengembalikan review atau null
    if (!existingReview) {
      throw new Error(`Review with ID ${id} not found.`);
    }
    if (existingReview.user_id !== requestingUserId) {
      throw new Error('You can only update your own reviews.');
    }

    const updatePayload = { updated_at: new Date() };
    if (rating !== undefined) updatePayload.rating = rating;
    if (comment !== undefined) {
      updatePayload.comment = comment;
      updatePayload.sentiment = await analyzeSentiment(comment);
    }

    return new Promise((resolve, reject) => {
      Review.update(id, updatePayload, async (err, result) => {
        if (err) return reject(new Error(`Failed to update review ${id}.`));
        if (result.affectedRows === 0) return reject(new Error(`Review ${id} not found for update.`));
        resolve(await this.getReviewById(id, token)); // Return updated and enriched review
      });
    });
  }

  static async deleteReview(id, requestingUserId, token) {
    const existingReview = await this.getReviewById(id, token);
    if (!existingReview) {
      throw new Error(`Review with ID ${id} not found.`);
    }
    if (existingReview.user_id !== requestingUserId) {
      throw new Error('You can only delete your own reviews.');
    }
    return new Promise((resolve, reject) => {
      Review.delete(id, (err, result) => {
        if (err) return reject(new Error(`Failed to delete review ${id}.`));
        if (result.affectedRows === 0) return reject(new Error(`Review ${id} not found for deletion.`));
        resolve({ message: 'Review deleted successfully', id: id });
      });
    });
  }

  static async getReviewStatsByMenuId(menuId, token) {
    const menu = await this._fetchMenuDetails(menuId, token);
    if (!menu || menu.name === 'Unknown Menu (Fetch Error)') {
        throw new Error(`Menu with ID ${menuId} not found or failed to fetch.`);
    }

    return new Promise((resolve, reject) => {
      Review.getAverageRatingByMenuId(menuId, (errAvg, avgResult) => {
        if (errAvg) return reject(new Error(`Failed to get average rating for menu ${menuId}.`));
        Review.countByMenuId(menuId, (errCount, countResult) => {
          if (errCount) return reject(new Error(`Failed to count reviews for menu ${menuId}.`));
          resolve({
            menu, // Menggunakan objek menu yang sudah di-fetch
            averageRating: avgResult[0]?.averageRating || 0,
            reviewCount: countResult[0]?.count || 0,
          });
        });
      });
    });
  }

  static async getReviewsByMenuIdAndSentiment(menuId, sentiment, token) {
    return new Promise((resolve, reject) => {
        Review.getByMenuIdAndSentiment(menuId, sentiment, async (err, reviews) => {
            if (err) return reject(new Error(`Failed to get reviews for menu ${menuId} with sentiment ${sentiment}.`));
            const enrichedReviews = await Promise.all(reviews.map(async review => {
                const user = await this._fetchUserDetails(review.user_id, token);
                return { ...review, user }; // Menu tidak perlu di-fetch lagi, sudah dalam konteks menuId
            }));
            resolve(enrichedReviews);
        });
    });
  }

  static async getSentimentStatsByMenuId(menuId) {
     return new Promise((resolve, reject) => {
        Review.getSentimentCountByMenuId(menuId, (err, sentimentCounts) => {
            if (err) return reject(new Error(`Failed to get sentiment stats for menu ${menuId}.`));
            const stats = { positive: 0, negative: 0, neutral: 0, total: 0, nullSentiment: 0 };
            sentimentCounts.forEach(item => {
                if (stats.hasOwnProperty(item.sentiment)) {
                    stats[item.sentiment] = item.count;
                } else if (item.sentiment === null || item.sentiment === '') {
                    stats.nullSentiment += item.count;
                }
                stats.total += item.count;
            });
            if (stats.total > 0) {
                stats.positivePercentage = Math.round((stats.positive / stats.total) * 100);
                stats.negativePercentage = Math.round((stats.negative / stats.total) * 100);
                stats.neutralPercentage = Math.round((stats.neutral / stats.total) * 100);
            } else {
                stats.positivePercentage = 0;
                stats.negativePercentage = 0;
                stats.neutralPercentage = 0;
            }
            resolve({ menuId: menuId, ...stats });
        });
    });
  }
  
  // --- AI Recommendation Logic ---
  static async saveAIRecommendation(reviewId, recommendationText) {
    return new Promise((resolve, reject) => {
      const recommendationData = {
        review_id: reviewId,
        recommendation: recommendationText,
        created_at: new Date()
      };
      db.query('INSERT INTO ai_recommendations SET ?', recommendationData, (err, result) => {
        if (err) {
          console.error('Error saving AI recommendation to DB:', err);
          return reject(new Error('Failed to save AI recommendation.'));
        }
        resolve({ id: result.insertId, ...recommendationData });
      });
    });
  }

  static async getAIRecommendationForReview(reviewId) {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM ai_recommendations WHERE review_id = ? ORDER BY created_at DESC LIMIT 1', [reviewId], (err, results) => {
        if (err) return reject(new Error('Failed to fetch AI recommendation.'));
        resolve(results.length > 0 ? results[0] : null);
      });
    });
  }

  static async generateAndSaveAIRecommendation(reviewId, token) {
    const review = await this.getReviewById(reviewId, token);
    if (!review || !review.menu || !review.comment) {
      throw new Error('Review, menu, or comment not found for AI recommendation.');
    }
    if (review.sentiment !== 'negative') {
        return { message: "AI Recommendation is typically generated for negative reviews.", recommendation: null };
    }

    try {
      const aiPrompt = `Buat tanggapan singkat (1 paragraf) untuk review negatif berikut tentang menu "${review.menu.name}": "${review.comment}". Sertakan saran perbaikan yang jelas dan padat.`;
      const aiResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
        model: "microsoft/phi-3-medium-128k-instruct:free", // Ganti model jika perlu
        messages: [{ role: "user", content: aiPrompt }]
      }, {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.APP_URL || "http://localhost", // Ambil dari .env
          "X-Title": process.env.APP_NAME || "EAI Food Review System" // Ambil dari .env
        },
        timeout: 30000 // 30 detik timeout
      });

      if (aiResponse.data && aiResponse.data.choices && aiResponse.data.choices.length > 0) {
        const recommendationText = aiResponse.data.choices[0].message.content;
        const savedRecommendation = await this.saveAIRecommendation(reviewId, recommendationText);
        return savedRecommendation;
      } else {
        throw new Error('AI did not provide a valid recommendation response.');
      }
    } catch (error) {
      console.error("Error generating or saving AI recommendation:", error.response ? error.response.data : error.message);
      throw new Error(`Failed to generate AI recommendation: ${error.message}`);
    }
  }
}

module.exports = ReviewService;
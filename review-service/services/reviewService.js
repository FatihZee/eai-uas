const Review = require('../models/reviewModel');
const { analyzeSentiment } = require('../helpers/sentimentAnalyzer');
const axios = require('axios');
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
        return { id: userId, name: 'Unknown User (Fetch Error)', email: 'unknown@example.com' };
      }

      return response.data.data.user || { id: userId, name: 'Unknown User', email: 'unknown@example.com' };
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error.message);
      return { id: userId, name: 'Unknown User (Fetch Error)', email: 'unknown@example.com' };
    }
  }

  static async _fetchMenuDetails(menuId, token) {
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
        return { id: menuId, name: 'Unknown Menu (Fetch Error)', price: 0 };
      }

      return response.data.data.menu || { id: menuId, name: 'Unknown Menu', price: 0 };
    } catch (error) {
      console.error(`Error fetching menu ${menuId}:`, error.message);
      return { id: menuId, name: 'Unknown Menu (Fetch Error)', price: 0 };
    }
  }

  static async _fetchOrderDetails(orderId, token) {
    if (!orderId) return null;
    
    try {
      const response = await axios.post(ORDER_SERVICE_GRAPHQL_URL, {
        query: `
          query GetOrder($id: ID!) {
            order(id: $id) {
              id
              user_id
              menu_id
              quantity
              total_price
              created_at
            }
          }
        `,
        variables: { id: orderId.toString() }
      }, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': token })
        }
      });

      if (response.data.errors) {
        console.error('GraphQL errors:', response.data.errors);
        return { id: orderId, user_id: null, menu_id: null, quantity: 0, total_price: 0 };
      }

      return response.data.data.order || { id: orderId, user_id: null, menu_id: null, quantity: 0, total_price: 0 };
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error.message);
      return { id: orderId, user_id: null, menu_id: null, quantity: 0, total_price: 0 };
    }
  }

  static async _enrichReview(review, token) {
    if (!review) return null;
    const [user, menu, order] = await Promise.all([
      this._fetchUserDetails(review.user_id, token),
      this._fetchMenuDetails(review.menu_id, token),
      this._fetchOrderDetails(review.order_id, token)
    ]);
    return { ...review, user, menu, order };
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
        resolve(await this._enrichMultipleReviews(reviews, token));
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

    // Analyze sentiment menggunakan Gemini AI
    const sentiment = comment ? await analyzeSentiment(comment) : 'neutral';
    
    const newReviewData = {
      user_id: requestingUserId,
      menu_id: order.menu_id,
      order_id: parseInt(orderId),
      rating: parseInt(rating),
      comment: comment || '',
      sentiment: sentiment,
      created_at: new Date(),
      updated_at: new Date()
    };

    return new Promise((resolve, reject) => {
      Review.create(newReviewData, async (err, dbResult) => {
        if (err) {
          console.error('Database error creating review:', err);
          return reject(new Error(`Failed to save review to database: ${err.message}`));
        }

        const reviewId = dbResult.insertId;
        const createdReview = { id: reviewId, ...newReviewData };

        try {
          const enrichedReview = await this._enrichReview(createdReview, token);
          resolve(enrichedReview);
        } catch (fetchErr) {
          console.error(`Error fetching user/menu details for review ${dbResult.insertId}:`, fetchErr.message);
          reject(new Error(`Review was created (ID: ${dbResult.insertId}), but failed to fetch associated user/menu details: ${fetchErr.message}`));
        }
      });
    });
  }

  static async updateReview(id, reviewData, requestingUserId, token) {
    const { rating, comment } = reviewData;
    const existingReview = await this.getReviewById(id, token);
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
      // Re-analyze sentiment with Gemini AI
      updatePayload.sentiment = await analyzeSentiment(comment);
    }

    return new Promise((resolve, reject) => {
      Review.update(id, updatePayload, async (err, result) => {
        if (err) return reject(new Error(`Failed to update review ${id}.`));
        if (result.affectedRows === 0) return reject(new Error(`Review ${id} not found for update.`));
        resolve(await this.getReviewById(id, token));
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
        resolve({ message: 'Review deleted successfully', id });
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
            menu,
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
                return { ...review, user };
            }));
            resolve(enrichedReviews);
        });
    });
  }

  static async getSentimentStatsByMenuId(menuId) {
     return new Promise((resolve, reject) => {
        Review.getSentimentCountByMenuId(menuId, (err, sentimentCounts) => {
            if (err) return reject(new Error(`Failed to get sentiment stats for menu ${menuId}.`));
            const stats = { positive: 0, negative: 0, neutral: 0, total: 0 };
            sentimentCounts.forEach(item => {
                if (stats.hasOwnProperty(item.sentiment)) {
                    stats[item.sentiment] = item.count;
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
}

module.exports = ReviewService;
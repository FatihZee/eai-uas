const { GraphQLError } = require('graphql');
const ReviewService = require('../services/reviewService');

module.exports = {
  Query: {
    reviews: async (_, __, context) => {
      try {
        return await ReviewService.getAllReviews(context.token);
      } catch (error) {
        console.error('GraphQL Error fetching all reviews:', error);
        throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
    review: async (_, { id }, context) => {
      try {
        const review = await ReviewService.getReviewById(id, context.token);
        if (!review) throw new GraphQLError('Review not found', { extensions: { code: 'NOT_FOUND' } });
        return review;
      } catch (error) {
        console.error(`GraphQL Error fetching review ${id}:`, error);
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
    reviewsByUser: async (_, { userId }, context) => {
      try {
        return await ReviewService.getReviewsByUserId(userId, context.token);
      } catch (error) {
        console.error(`GraphQL Error fetching reviews for user ${userId}:`, error);
        throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
    reviewsByMenu: async (_, { menuId }, context) => {
      try {
        return await ReviewService.getReviewsByMenuId(menuId, context.token);
      } catch (error) {
        console.error(`GraphQL Error fetching reviews for menu ${menuId}:`, error);
        throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
    reviewsByOrder: async (_, { orderId }, context) => {
      try {
        return await ReviewService.getReviewsByOrderId(orderId, context.token);
      } catch (error) {
        console.error(`GraphQL Error fetching reviews for order ${orderId}:`, error);
        throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
    reviewStatsByMenu: async (_, { menuId }, context) => {
      try {
        return await ReviewService.getReviewStatsByMenuId(menuId, context.token);
      } catch (error) {
        console.error(`GraphQL Error fetching review stats for menu ${menuId}:`, error);
        throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
    reviewsByMenuAndSentiment: async (_, { menuId, sentiment }, context) => {
        try {
            return await ReviewService.getReviewsByMenuIdAndSentiment(menuId, sentiment, context.token);
        } catch (error) {
            console.error(`GraphQL Error fetching reviews for menu ${menuId} and sentiment ${sentiment}:`, error);
            throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
    },
    sentimentStatsByMenu: async (_, { menuId }) => { // Tidak perlu token jika hanya agregasi dari DB
        try {
            return await ReviewService.getSentimentStatsByMenuId(menuId);
        } catch (error) {
            console.error(`GraphQL Error fetching sentiment stats for menu ${menuId}:`, error);
            throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
    },
    aiRecommendationForReview: async (_, { reviewId }) => {
        try {
            const recommendation = await ReviewService.getAIRecommendationForReview(reviewId);
            // if (!recommendation) throw new GraphQLError('AI Recommendation not found for this review.', { extensions: { code: 'NOT_FOUND' } });
            return recommendation; // Bisa null jika belum ada
        } catch (error) {
            console.error(`GraphQL Error fetching AI recommendation for review ${reviewId}:`, error);
            throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
    }
  },
  Mutation: {
    createReview: async (_, { input }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      try {
        const newReview = await ReviewService.createReview(input, context.user.id, context.token);
        return { message: 'Review created successfully', review: newReview };
      } catch (error) {
        console.error('GraphQL Error creating review:', error);
        throw new GraphQLError(error.message, { extensions: { code: error.message.includes('required') || error.message.includes('not found') || error.message.includes('own orders') ? 'BAD_USER_INPUT' : 'INTERNAL_SERVER_ERROR' } });
      }
    },
    updateReview: async (_, { id, input }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      try {
        const updatedReview = await ReviewService.updateReview(id, input, context.user.id, context.token);
        return { message: 'Review updated successfully', review: updatedReview };
      } catch (error) {
        console.error(`GraphQL Error updating review ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('own reviews')) code = 'FORBIDDEN';
        throw new GraphQLError(error.message, { extensions: { code } });
      }
    },
    deleteReview: async (_, { id }, context) => {
      if (!context.user || !context.user.id) {
        throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      try {
        const result = await ReviewService.deleteReview(id, context.user.id, context.token);
        return result;
      } catch (error) {
        console.error(`GraphQL Error deleting review ${id}:`, error);
        let code = 'INTERNAL_SERVER_ERROR';
        if (error.message.includes('not found')) code = 'NOT_FOUND';
        if (error.message.includes('own reviews')) code = 'FORBIDDEN';
        throw new GraphQLError(error.message, { extensions: { code } });
      }
    },
    generateAIRecommendation: async (_, { reviewId }, context) => {
        if (!context.user || !context.user.id) { // Atau cek role admin jika perlu
            throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
        }
        if (!process.env.OPENROUTER_API_KEY) {
            throw new GraphQLError('AI Service is not configured (missing API key).', { extensions: { code: 'CONFIGURATION_ERROR' } });
        }
        try {
            return await ReviewService.generateAndSaveAIRecommendation(reviewId, context.token);
        } catch (error) {
            console.error(`GraphQL Error generating AI recommendation for review ${reviewId}:`, error);
            throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
    }
  },
  // Field resolver untuk aiRecommendation pada tipe Review
  Review: {
    aiRecommendation: async (parentReview, _, context) => {
        // Tidak perlu token jika hanya mengambil dari DB lokal
        return ReviewService.getAIRecommendationForReview(parentReview.id);
    }
  }
};
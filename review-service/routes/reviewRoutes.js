const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', reviewController.getAllReviews);
router.get('/:id', reviewController.getReviewById);
router.get('/menu/:menuId', reviewController.getReviewsByMenuId);
router.get('/user/:userId', reviewController.getReviewsByUserId);
router.get('/order/:orderId', reviewController.getReviewsByOrderId);
router.get('/stats/menu/:menuId', reviewController.getReviewStatsByMenuId);

router.post('/', authMiddleware, reviewController.createReview);
router.put('/:id', authMiddleware, reviewController.updateReview);
router.delete('/:id', authMiddleware, reviewController.deleteReview);

router.get('/menus/:menuId/reviews/sentiment/:sentiment', reviewController.getReviewsByMenuIdAndSentiment);
router.get('/menus/:menuId/sentiment-stats', reviewController.getSentimentStatsByMenuId);

router.get('/ai-recommendation/:reviewId', reviewController.getAIRecommendation);

module.exports = router;
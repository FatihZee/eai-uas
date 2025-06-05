const db = require('../config/db');

const Review = {
  getAll: (callback) => {
    db.query('SELECT * FROM reviews', callback);
  },

  getById: (id, callback) => {
    db.query('SELECT * FROM reviews WHERE id = ?', [id], callback);
  },

  getByUserId: (userId, callback) => {
    db.query('SELECT * FROM reviews WHERE user_id = ?', [userId], callback);
  },

  getByMenuId: (menuId, callback) => {
    db.query('SELECT * FROM reviews WHERE menu_id = ?', [menuId], callback);
  },

  getByOrderId: (orderId, callback) => {
    db.query('SELECT * FROM reviews WHERE order_id = ?', [orderId], callback);
  },

  create: (review, callback) => {
    db.query('INSERT INTO reviews SET ?', review, callback);
  },

  update: (id, review, callback) => {
    db.query('UPDATE reviews SET ? WHERE id = ?', [review, id], callback);
  },

  delete: (id, callback) => {
    db.query('DELETE FROM reviews WHERE id = ?', [id], callback);
  },

  getAverageRatingByMenuId: (menuId, callback) => {
    db.query(
      'SELECT AVG(rating) AS averageRating FROM reviews WHERE menu_id = ?',
      [menuId],
      callback
    );
  },

  countByMenuId: (menuId, callback) => {
    db.query(
      'SELECT COUNT(*) AS count FROM reviews WHERE menu_id = ?',
      [menuId],
      callback
    );
  },

  getByMenuIdAndSentiment: (menuId, sentimentType, callback) => {
    db.query(
      'SELECT * FROM reviews WHERE menu_id = ? AND sentiment = ?',
      [menuId, sentimentType],
      callback
    );
  },

  getSentimentCountByMenuId: (menuId, callback) => {
    db.query(
      'SELECT sentiment, COUNT(*) as count FROM reviews WHERE menu_id = ? GROUP BY sentiment',
      [menuId],
      callback
    );
  }
};

module.exports = Review;
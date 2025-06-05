const db = require('../config/db');

const Order = {
  getAll: (cb) => {
    db.query('SELECT * FROM orders', cb);
  },
  getById: (id, cb) => {
    db.query('SELECT * FROM orders WHERE id = ?', [id], cb);
  },
  create: (data, cb) => {
    db.query('INSERT INTO orders SET ?', data, cb);
  },
  update: (id, data, cb) => {
    db.query('UPDATE orders SET ? WHERE id = ?', [data, id], cb);
  },
  delete: (id, cb) => {
    db.query('DELETE FROM orders WHERE id = ?', [id], cb);
  },
  getByUserId: (userId, callback) => {
    db.query('SELECT * FROM orders WHERE user_id = ?', [userId], callback);
  },
  countByMenuId: (menuId, callback) => {
    db.query('SELECT COUNT(*) AS count FROM orders WHERE menu_id = ?', [menuId], callback);
  }
};

module.exports = Order;
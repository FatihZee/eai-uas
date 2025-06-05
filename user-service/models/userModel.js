const db = require('../config/db');

const User = {
  getAll: (callback) => {
    db.query('SELECT * FROM users', callback);
  },

  getById: (id, callback) => {
    db.query('SELECT * FROM users WHERE id = ?', [id], callback);
  },

  findByEmail: (email, callback) => {
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) {
        console.error('Error in User.findByEmail:', err);
        return callback(err, null);
      }
      return callback(null, results);
    });
  },

  create: (data, callback) => {
    db.query('INSERT INTO users SET ?', data, callback);
  },

  update: (id, data, callback) => {
    db.query('UPDATE users SET ? WHERE id = ?', [data, id], callback);
  },

  delete: (id, callback) => {
    db.query('DELETE FROM users WHERE id = ?', [id], callback);
  },
};

module.exports = User;
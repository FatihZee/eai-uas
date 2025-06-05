const db = require('../config/db');

const Menu = {
  getAll: (callback) => {
    db.query('SELECT * FROM menus', callback);
  },

  getById: (id, callback) => {
    db.query('SELECT * FROM menus WHERE id = ?', [id], callback);
  },

  create: (data, callback) => {
    db.query('INSERT INTO menus SET ?', data, callback);
  },

  update: (id, data, callback) => {
    db.query('UPDATE menus SET ? WHERE id = ?', [data, id], callback);
  },

  delete: (id, callback) => {
    db.query('DELETE FROM menus WHERE id = ?', [id], callback);
  },
};

module.exports = Menu;
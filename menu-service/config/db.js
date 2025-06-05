const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME_MENU,
});

connection.connect((err) => {
  if (err) throw err;
  console.log('MySQL Connected (MenuService)');
});

module.exports = connection;

const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME_USER,
});

connection.connect((err) => {
  if (err) throw err;
  console.log('MySQL Connected (UserService)');
});

module.exports = connection;

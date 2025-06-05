const jwt = require('jsonwebtoken');
require('dotenv').config();

const createContext = ({ req }) => {
  let user = null;
  let token = null;

  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader;
    const tokenValue = authHeader.split(' ')[1];
    
    try {
      user = jwt.verify(tokenValue, process.env.JWT_SECRET);
    } catch (err) {
      console.warn('Invalid or expired token:', err.message);
    }
  }

  return {
    user,
    token,
    req,
  };
};

module.exports = createContext;
const jwt = require('jsonwebtoken');
require('dotenv').config();

const createContext = ({ req }) => {
  let user = null;
  let token = null;

  const authHeader = req.headers.authorization;
  
  if (!process.env.JWT_SECRET) {
    console.error('[CONTEXT_DEBUG PaymentService] JWT_SECRET is MISSING or UNDEFINED in .env file for payment-service!');
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader; 
    const tokenValue = authHeader.split(' ')[1];
    
    try {
      user = jwt.verify(tokenValue, process.env.JWT_SECRET);
    } catch (err) {
      console.error('[CONTEXT_DEBUG PaymentService] jwt.verify FAILED. Error:', err); 
    }
  }

  return {
    user, 
    token, 
    req,
  };
};

module.exports = createContext;
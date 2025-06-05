const jwt = require('jsonwebtoken');
require('dotenv').config();

const createContext = ({ req }) => {
  // console.log('[CONTEXT_DEBUG ReviewService] createContext function called.');
  let user = null;
  let token = null;

  const authHeader = req.headers.authorization;
  // console.log('[CONTEXT_DEBUG ReviewService] authHeader received:', authHeader);
  
  if (!process.env.JWT_SECRET) {
    console.error('[CONTEXT_DEBUG ReviewService] JWT_SECRET is MISSING or UNDEFINED in .env file for review-service!');
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // console.log('[CONTEXT_DEBUG ReviewService] authHeader starts with "Bearer ".');
    token = authHeader; 
    const tokenValue = authHeader.split(' ')[1];
    // console.log('[CONTEXT_DEBUG ReviewService] Extracted tokenValue:', tokenValue);
    
    try {
      // console.log('[CONTEXT_DEBUG ReviewService] Attempting jwt.verify with tokenValue...');
      user = jwt.verify(tokenValue, process.env.JWT_SECRET);
      // console.log('[CONTEXT_DEBUG ReviewService] jwt.verify successful. Decoded user:', user);
    } catch (err) {
      console.error('[CONTEXT_DEBUG ReviewService] jwt.verify FAILED. Error:', err); 
    }
  } else {
    // console.log('[CONTEXT_DEBUG ReviewService] authHeader is missing or does not start with "Bearer ".');
  }

  // console.log('[CONTEXT_DEBUG ReviewService] Returning user from context:', user);
  return {
    user, 
    token, 
    req,
  };
};

module.exports = createContext;
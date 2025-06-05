const jwt = require('jsonwebtoken');
require('dotenv').config(); // Pastikan .env di-load

const createContext = ({ req }) => {
  // console.log('[CONTEXT_DEBUG MenuService] createContext function called.');
  let user = null;
  let token = null;

  const authHeader = req.headers.authorization;
  // console.log('[CONTEXT_DEBUG MenuService] authHeader received:', authHeader);
  
  if (!process.env.JWT_SECRET) {
    console.error('[CONTEXT_DEBUG MenuService] JWT_SECRET is MISSING or UNDEFINED in .env file for menu-service!');
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // console.log('[CONTEXT_DEBUG MenuService] authHeader starts with "Bearer ".');
    token = authHeader; 
    const tokenValue = authHeader.split(' ')[1];
    // console.log('[CONTEXT_DEBUG MenuService] Extracted tokenValue:', tokenValue);
    
    try {
      // console.log('[CONTEXT_DEBUG MenuService] Attempting jwt.verify with tokenValue...');
      user = jwt.verify(tokenValue, process.env.JWT_SECRET);
      // console.log('[CONTEXT_DEBUG MenuService] jwt.verify successful. Decoded user:', user);
    } catch (err) {
      console.error('[CONTEXT_DEBUG MenuService] jwt.verify FAILED. Error:', err); 
    }
  } else {
    // console.log('[CONTEXT_DEBUG MenuService] authHeader is missing or does not start with "Bearer ".');
  }

  // console.log('[CONTEXT_DEBUG MenuService] Returning user from context:', user);
  return {
    user, 
    token, 
    req,
  };
};

module.exports = createContext;
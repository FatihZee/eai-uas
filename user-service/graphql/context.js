const jwt = require('jsonwebtoken');
require('dotenv').config();

const createContext = ({ req }) => {
  // console.log('[CONTEXT_DEBUG UserService] createContext function called.');
  let user = null;
  let token = null;

  const authHeader = req.headers.authorization;
  // console.log('[CONTEXT_DEBUG UserService] authHeader received:', authHeader);
  
  if (!process.env.JWT_SECRET) {
    console.error('[CONTEXT_DEBUG UserService] JWT_SECRET is MISSING or UNDEFINED in .env file for user-service!');
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // console.log('[CONTEXT_DEBUG UserService] authHeader starts with "Bearer ".');
    token = authHeader; 
    const tokenValue = authHeader.split(' ')[1];
    // console.log('[CONTEXT_DEBUG UserService] Extracted tokenValue:', tokenValue);
    
    try {
      // console.log('[CONTEXT_DEBUG UserService] Attempting jwt.verify with tokenValue...');
      user = jwt.verify(tokenValue, process.env.JWT_SECRET);
      // console.log('[CONTEXT_DEBUG UserService] jwt.verify successful. Decoded user:', user);
    } catch (err) {
      console.error('[CONTEXT_DEBUG UserService] jwt.verify FAILED. Error:', err); 
    }
  } else {
    // console.log('[CONTEXT_DEBUG UserService] authHeader is missing or does not start with "Bearer ".');
  }

  // console.log('[CONTEXT_DEBUG UserService] Returning user from context:', user);
  return {
    user, 
    token, 
    req,
  };
};

module.exports = createContext;
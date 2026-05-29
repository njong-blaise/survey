const supabase = require('../config/supabase');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Let Supabase handle token validation - it automatically handles expired tokens
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.log('Token verification failed:', error.message);
      return res.status(401).json({ error: 'Invalid access token' });
    }

    if (!user) {
      console.log('No user found for token');
      return res.status(401).json({ error: 'Invalid access token' });
    }

    // Token is valid - proceed
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = {
  authenticateToken,
};

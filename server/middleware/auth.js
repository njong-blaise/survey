const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.https//jotgnadycbnaotjookvx.supabase.co;
const supabaseServiceKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdGduYWR5Y2JuYW90am9va3Z4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU3MTY0OSwiZXhwIjoyMDk1MTQ3NjQ5fQ.g0RQIqzLjcAkhknOUPwnZezXAw1XPwB31ans3MpSnJA;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration in auth middleware');
}

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Let Supabase handle token validation - it automatically handles expired tokens
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
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

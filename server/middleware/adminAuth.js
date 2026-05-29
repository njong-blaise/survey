const supabase = require('../config/supabase');

// Middleware to check if user is authenticated (Supabase access token)
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid access token' });
    }

    req.user = user;
    next();
  } catch (e) {
    console.error('Admin authenticateToken error:', e);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (!profile.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    if (!['admin', 'super_admin'].includes(profile.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user.role = profile.role;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to check if user is super admin
const requireSuperAdmin = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (!profile.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    if (profile.role !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    req.user.role = profile.role;
    next();
  } catch (error) {
    console.error('Super admin auth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to check specific admin permission
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Super admins have all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }

      const { data: perm, error } = await supabase
        .from('admin_permissions')
        .select('permission')
        .eq('user_id', req.user.id)
        .eq('permission', permission)
        .single();

      if (error || !perm) {
        return res.status(403).json({ 
          error: `Permission '${permission}' required` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ error: 'Permission check error' });
    }
  };
};

// Middleware to log admin activities
const logAdminActivity = (action, target_type = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Only log successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        logActivity(req.user.id, action, target_type, req.params.id, {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }).catch(console.error);
      }
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Helper function to log activity
async function logActivity(adminId, action, targetType, targetId, details) {
  try {
    await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: adminId,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
        ip_address: details.ip,
        user_agent: details.userAgent
      });
  } catch (error) {
    console.error('Failed to log admin activity:', error);
  }
}

// Middleware to get user profile and attach to request
const attachUserProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return next();
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, email, role, is_active, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return next();
    }

    req.user.profile = profile;
    next();
  } catch (error) {
    console.error('Profile attachment error:', error);
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
  requirePermission,
  logAdminActivity,
  attachUserProfile
};

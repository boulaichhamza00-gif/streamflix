const { User } = require('../models');

/**
 * Admin Authorization Middleware
 * This middleware ensures that only users with isAdmin flag can access admin routes
 * Even if someone discovers the /admin URL, they cannot access it without proper authorization
 */
const requireAdmin = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
    }

    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      // Log unauthorized access attempt for security monitoring
      console.log(`Unauthorized admin access attempt by user: ${req.user._id} (${req.user.email}) at ${new Date().toISOString()}`);
      
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
        code: 'ADMIN_REQUIRED'
      });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during admin authorization.'
    });
  }
};

/**
 * Optional: Check if user is super admin (for critical operations)
 * Can be extended to include role-based access control
 */
const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Super admin access required.'
      });
    }

    // Additional checks can be added here (e.g., specific admin roles)
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error during super admin authorization.'
    });
  }
};

module.exports = {
  requireAdmin,
  requireSuperAdmin
};

const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'islandbox_super_secret_jwt_key_sia_2026_capstone_secure';

async function extractUserFromToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query(
      'SELECT id, full_name, email, role, contact_number, delivery_address, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];

    // If seller, also fetch seller details
    if (user.role === 'seller') {
      const sellerRes = await query(
        'SELECT id as seller_id, business_name, business_description, business_address, island_region, latitude, longitude, status FROM sellers WHERE user_id = $1',
        [user.id]
      );
      if (sellerRes.rows.length > 0) {
        user.seller = sellerRes.rows[0];
      }
    }

    return user;
  } catch (err) {
    return null;
  }
}

async function requireAuth(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in to continue.' });
  }

  const user = await extractUserFromToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }

  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. This action requires one of the following roles: ${roles.join(', ')}.`,
      });
    }

    next();
  };
}

async function optionalAuth(req, res, next) {
  const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
  if (token) {
    const user = await extractUserFromToken(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

module.exports = {
  requireAuth,
  requireRole,
  optionalAuth,
};


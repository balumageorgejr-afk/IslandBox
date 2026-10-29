const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query, getClient } = require('../config/db');
const { resolveAddress } = require('../services/geocodingService');

const JWT_SECRET = process.env.JWT_SECRET || 'islandbox_super_secret_jwt_key_sia_2026_capstone_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

async function register(req, res) {
  const {
    full_name,
    email,
    password,
    contact_number,
    delivery_address,
    role = 'customer',
    // Seller specific fields
    business_name,
    business_description,
    business_address,
    island_region = 'Bohol',
  } = req.body;

  const client = await getClient();
  try {
    // Check if email already exists
    const check = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const assignedRole = role === 'seller' ? 'seller' : 'customer';

    await client.query('BEGIN');

    const userRes = await client.query(
      `INSERT INTO users (full_name, email, password_hash, contact_number, delivery_address, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, full_name, email, role, contact_number, delivery_address, created_at;`,
      [full_name.trim(), email.toLowerCase().trim(), passwordHash, contact_number || null, delivery_address || null, assignedRole]
    );

    const user = userRes.rows[0];

    // If registering as a seller
    if (assignedRole === 'seller') {
      const addrToResolve = business_address || delivery_address || 'Bohol, Philippines';
      const geo = await resolveAddress(addrToResolve);

      const sellerRes = await client.query(
        `INSERT INTO sellers (user_id, business_name, business_description, business_address, island_region, latitude, longitude, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id as seller_id, business_name, business_description, business_address, island_region, latitude, longitude, status;`,
        [
          user.id,
          business_name || `${full_name}'s Artisan Shop`,
          business_description || 'Authentic handcrafted products and local souvenirs.',
          addrToResolve,
          island_region,
          geo.latitude,
          geo.longitude,
          'active',
        ]
      );
      user.seller = sellerRes.rows[0];
    }

    await client.query('COMMIT');

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    setAuthCookie(res, token);

    return res.status(201).json({
      message: 'Registration successful! Welcome to IslandBox.',
      user,
      token,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration. Please try again.' });
  } finally {
    client.release();
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    const result = await query(
      'SELECT id, full_name, email, password_hash, role, contact_number, delivery_address, created_at FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    delete user.password_hash;

    if (user.role === 'seller') {
      const sellerRes = await query(
        'SELECT id as seller_id, business_name, business_description, business_address, island_region, latitude, longitude, status FROM sellers WHERE user_id = $1',
        [user.id]
      );
      if (sellerRes.rows.length > 0) {
        user.seller = sellerRes.rows[0];
      }
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    setAuthCookie(res, token);

    return res.json({
      message: 'Login successful! Welcome back.',
      user,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
}

function logout(req, res) {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully.' });
}

function getMe(req, res) {
  return res.json({ user: req.user });
}

async function updateProfile(req, res) {
  const { full_name, contact_number, delivery_address } = req.body;
  try {
    const result = await query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           contact_number = COALESCE($2, contact_number),
           delivery_address = COALESCE($3, delivery_address)
       WHERE id = $4
       RETURNING id, full_name, email, role, contact_number, delivery_address, created_at;`,
      [full_name, contact_number, delivery_address, req.user.id]
    );

    const user = result.rows[0];
    if (user.role === 'seller') {
      const sellerRes = await query(
        'SELECT id as seller_id, business_name, business_description, business_address, island_region, latitude, longitude, status FROM sellers WHERE user_id = $1',
        [user.id]
      );
      if (sellerRes.rows.length > 0) {
        user.seller = sellerRes.rows[0];
      }
    }

    return res.json({ message: 'Profile updated successfully.', user });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile.' });
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
};


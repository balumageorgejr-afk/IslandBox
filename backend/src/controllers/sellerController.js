const { query } = require('../config/db');
const { resolveAddress } = require('../services/geocodingService');

async function getSellers(req, res) {
  try {
    const sql = `
      SELECT 
        s.id,
        s.business_name,
        s.business_description,
        s.business_address,
        s.island_region,
        s.latitude,
        s.longitude,
        s.status,
        s.created_at,
        COUNT(p.id) filter (where p.is_active = true) as product_count
      FROM sellers s
      LEFT JOIN products p ON s.id = p.seller_id
      WHERE s.status = 'active'
      GROUP BY s.id
      ORDER BY s.business_name ASC;
    `;
    const result = await query(sql);
    return res.json({ sellers: result.rows });
  } catch (err) {
    console.error('Error fetching sellers:', err);
    return res.status(500).json({ error: 'Failed to fetch sellers.' });
  }
}

async function getSellerById(req, res) {
  const { id } = req.params;

  try {
    const sellerSql = `
      SELECT 
        s.id,
        s.business_name,
        s.business_description,
        s.business_address,
        s.island_region,
        s.latitude,
        s.longitude,
        s.status,
        s.created_at,
        u.full_name as contact_person,
        u.contact_number
      FROM sellers s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1;
    `;
    const sellerRes = await query(sellerSql, [id]);
    if (sellerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found.' });
    }

    // Fetch seller's products
    const prodSql = `
      SELECT 
        p.id, p.name, p.slug, p.description, p.price, p.available_quantity, p.image_url,
        c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = $1 AND p.is_active = true
      ORDER BY p.created_at DESC;
    `;
    const prodRes = await query(prodSql, [id]);

    return res.json({
      seller: sellerRes.rows[0],
      products: prodRes.rows,
    });
  } catch (err) {
    console.error('Error fetching seller details:', err);
    return res.status(500).json({ error: 'Failed to fetch seller details.' });
  }
}

async function getMySellerProfile(req, res) {
  if (!req.user.seller) {
    return res.status(403).json({ error: 'Seller account required.' });
  }

  const sellerId = req.user.seller.seller_id;

  try {
    const profileSql = `
      SELECT 
        s.id,
        s.business_name,
        s.business_description,
        s.business_address,
        s.island_region,
        s.latitude,
        s.longitude,
        s.status,
        s.created_at,
        COUNT(DISTINCT p.id) as total_products,
        COUNT(DISTINCT oi.id) as total_items_sold,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue
      FROM sellers s
      LEFT JOIN products p ON s.id = p.seller_id
      LEFT JOIN order_items oi ON s.id = oi.seller_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
      WHERE s.id = $1
      GROUP BY s.id;
    `;
    const result = await query(profileSql, [sellerId]);

    return res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error('Error fetching seller profile:', err);
    return res.status(500).json({ error: 'Failed to fetch seller profile.' });
  }
}

async function updateSellerProfile(req, res) {
  if (!req.user.seller) {
    return res.status(403).json({ error: 'Seller account required.' });
  }

  const sellerId = req.user.seller.seller_id;
  const { business_name, business_description, business_address, island_region } = req.body;

  try {
    let lat = null;
    let lng = null;

    if (business_address) {
      const geo = await resolveAddress(business_address);
      lat = geo.latitude;
      lng = geo.longitude;
    }

    const result = await query(
      `UPDATE sellers
       SET business_name = COALESCE($1, business_name),
           business_description = COALESCE($2, business_description),
           business_address = COALESCE($3, business_address),
           island_region = COALESCE($4, island_region),
           latitude = COALESCE($5, latitude),
           longitude = COALESCE($6, longitude)
       WHERE id = $7
       RETURNING *;`,
      [business_name, business_description, business_address, island_region, lat, lng, sellerId]
    );

    return res.json({
      message: 'Seller shop profile updated successfully.',
      seller: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating seller profile:', err);
    return res.status(500).json({ error: 'Failed to update seller profile.' });
  }
}

module.exports = {
  getSellers,
  getSellerById,
  getMySellerProfile,
  updateSellerProfile,
};


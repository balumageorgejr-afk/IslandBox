const { query } = require('../config/db');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
}

async function getProducts(req, res) {
  const {
    q,
    category,
    seller_id,
    island_region,
    min_price,
    max_price,
    sort = 'newest',
    limit = 50,
    offset = 0,
  } = req.query;

  try {
    const conditions = ['p.is_active = true'];
    const params = [];

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR s.business_name ILIKE $${params.length})`);
    }

    if (category) {
      if (isNaN(category)) {
        params.push(category);
        conditions.push(`c.slug = $${params.length}`);
      } else {
        params.push(parseInt(category, 10));
        conditions.push(`p.category_id = $${params.length}`);
      }
    }

    if (seller_id) {
      params.push(parseInt(seller_id, 10));
      conditions.push(`p.seller_id = $${params.length}`);
    }

    if (island_region) {
      params.push(`%${island_region}%`);
      conditions.push(`s.island_region ILIKE $${params.length}`);
    }

    if (min_price) {
      params.push(parseFloat(min_price));
      conditions.push(`p.price >= $${params.length}`);
    }

    if (max_price) {
      params.push(parseFloat(max_price));
      conditions.push(`p.price <= $${params.length}`);
    }

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.price ASC';
    if (sort === 'price_desc') orderBy = 'p.price DESC';
    if (sort === 'name') orderBy = 'p.name ASC';

    params.push(parseInt(limit, 10));
    const limitIdx = params.length;
    params.push(parseInt(offset, 10));
    const offsetIdx = params.length;

    const sql = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.available_quantity,
        p.image_url,
        p.created_at,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug,
        c.icon_name as category_icon,
        s.id as seller_id,
        s.business_name,
        s.business_address,
        s.island_region,
        s.latitude,
        s.longitude
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN sellers s ON p.seller_id = s.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    const result = await query(sql, params);

    // Count total query
    const countParams = params.slice(0, params.length - 2);
    const countSql = `
      SELECT COUNT(p.id) as total
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN sellers s ON p.seller_id = s.id
      WHERE ${conditions.join(' AND ')};
    `;
    const countRes = await query(countSql, countParams);

    return res.json({
      products: result.rows,
      total: parseInt(countRes.rows[0].total, 10),
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ error: 'Failed to fetch products.' });
  }
}

async function getProductById(req, res) {
  const { id } = req.params;

  try {
    const isNum = !isNaN(id);
    const sql = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.available_quantity,
        p.image_url,
        p.is_active,
        p.created_at,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug,
        s.id as seller_id,
        s.business_name,
        s.business_description,
        s.business_address,
        s.island_region,
        s.latitude,
        s.longitude,
        u.contact_number as seller_contact
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN sellers s ON p.seller_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE ${isNum ? 'p.id = $1' : 'p.slug = $1'};
    `;

    const result = await query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    return res.json({ product: result.rows[0] });
  } catch (err) {
    console.error('Error fetching product by ID:', err);
    return res.status(500).json({ error: 'Failed to fetch product details.' });
  }
}

async function getCategories(req, res) {
  try {
    const sql = `
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.icon_name,
        COUNT(p.id) filter (where p.is_active = true) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name ASC;
    `;
    const result = await query(sql);
    return res.json({ categories: result.rows });
  } catch (err) {
    console.error('Error fetching categories:', err);
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
}

async function createProduct(req, res) {
  const { name, category_id, description, price, available_quantity, image_url } = req.body;

  if (!req.user.seller) {
    return res.status(403).json({ error: 'Seller profile required to list products.' });
  }

  const seller_id = req.user.seller.seller_id;
  const slug = slugify(name);

  try {
    const result = await query(
      `INSERT INTO products (seller_id, category_id, name, slug, description, price, available_quantity, image_url, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       RETURNING *;`,
      [
        seller_id,
        category_id,
        name.trim(),
        slug,
        description,
        parseFloat(price),
        parseInt(available_quantity, 10) || 0,
        image_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
      ]
    );

    return res.status(201).json({
      message: 'Product listed successfully!',
      product: result.rows[0],
    });
  } catch (err) {
    console.error('Error creating product:', err);
    return res.status(500).json({ error: 'Failed to create product listing.' });
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const { name, category_id, description, price, available_quantity, image_url, is_active } = req.body;

  if (!req.user.seller) {
    return res.status(403).json({ error: 'Seller profile required.' });
  }

  try {
    // Check ownership
    const check = await query('SELECT seller_id FROM products WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    if (check.rows[0].seller_id !== req.user.seller.seller_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to modify this product.' });
    }

    const result = await query(
      `UPDATE products
       SET name = COALESCE($1, name),
           category_id = COALESCE($2, category_id),
           description = COALESCE($3, description),
           price = COALESCE($4, price),
           available_quantity = COALESCE($5, available_quantity),
           image_url = COALESCE($6, image_url),
           is_active = COALESCE($7, is_active)
       WHERE id = $8
       RETURNING *;`,
      [
        name ? name.trim() : null,
        category_id ? parseInt(category_id, 10) : null,
        description,
        price !== undefined ? parseFloat(price) : null,
        available_quantity !== undefined ? parseInt(available_quantity, 10) : null,
        image_url,
        is_active !== undefined ? is_active : null,
        id,
      ]
    );

    return res.json({
      message: 'Product updated successfully.',
      product: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating product:', err);
    return res.status(500).json({ error: 'Failed to update product.' });
  }
}

async function deleteProduct(req, res) {
  const { id } = req.params;

  if (!req.user.seller) {
    return res.status(403).json({ error: 'Seller profile required.' });
  }

  try {
    const check = await query('SELECT seller_id FROM products WHERE id = $1', [id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    if (check.rows[0].seller_id !== req.user.seller.seller_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You do not have permission to delete this product.' });
    }

    // Check if order items reference this product
    const orderCheck = await query('SELECT id FROM order_items WHERE product_id = $1 LIMIT 1', [id]);
    if (orderCheck.rows.length > 0) {
      // Soft-delete to preserve immutable financial transaction history
      await query('UPDATE products SET is_active = false WHERE id = $1', [id]);
      return res.json({ message: 'Product has order history, safely archived as inactive.' });
    } else {
      await query('DELETE FROM products WHERE id = $1', [id]);
      return res.json({ message: 'Product deleted permanently.' });
    }
  } catch (err) {
    console.error('Error deleting product:', err);
    return res.status(500).json({ error: 'Failed to delete product.' });
  }
}

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
};


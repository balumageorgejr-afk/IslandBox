const { query } = require('../config/db');

async function getCart(req, res) {
  const customerId = req.user.id;

  try {
    const sql = `
      SELECT 
        ci.id as cart_item_id,
        ci.product_id,
        ci.quantity,
        ci.created_at,
        p.name as product_name,
        p.slug as product_slug,
        p.price,
        p.available_quantity,
        p.image_url,
        p.is_active,
        s.id as seller_id,
        s.business_name as seller_name,
        s.business_address as seller_location,
        (ci.quantity * p.price) as item_total
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN sellers s ON p.seller_id = s.id
      WHERE ci.customer_id = $1
      ORDER BY ci.created_at DESC;
    `;

    const result = await query(sql, [customerId]);
    const items = result.rows;

    let subtotal = 0;
    for (const item of items) {
      subtotal += parseFloat(item.item_total);
    }

    return res.json({
      items,
      item_count: items.reduce((acc, item) => acc + item.quantity, 0),
      subtotal: subtotal.toFixed(2),
    });
  } catch (err) {
    console.error('Error fetching cart:', err);
    return res.status(500).json({ error: 'Failed to retrieve shopping cart.' });
  }
}

async function addToCart(req, res) {
  const customerId = req.user.id;
  const { product_id, quantity = 1 } = req.body;
  const qty = parseInt(quantity, 10);

  if (qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be at least 1.' });
  }

  try {
    // Check product exists and has stock
    const prodRes = await query(
      'SELECT id, name, price, available_quantity, is_active FROM products WHERE id = $1',
      [product_id]
    );

    if (prodRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const product = prodRes.rows[0];
    if (!product.is_active) {
      return res.status(400).json({ error: 'This product is currently unavailable.' });
    }

    // Check existing in cart
    const existing = await query(
      'SELECT id, quantity FROM cart_items WHERE customer_id = $1 AND product_id = $2',
      [customerId, product_id]
    );

    const currentQtyInCart = existing.rows.length > 0 ? existing.rows[0].quantity : 0;
    const newQty = currentQtyInCart + qty;

    if (newQty > product.available_quantity) {
      return res.status(400).json({
        error: `Only ${product.available_quantity} units available. You already have ${currentQtyInCart} in your cart.`,
      });
    }

    if (existing.rows.length > 0) {
      await query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2',
        [newQty, existing.rows[0].id]
      );
    } else {
      await query(
        'INSERT INTO cart_items (customer_id, product_id, quantity) VALUES ($1, $2, $3)',
        [customerId, product_id, qty]
      );
    }

    return res.status(200).json({
      message: `Added "${product.name}" to cart.`,
      product_id,
      quantity: newQty,
    });
  } catch (err) {
    console.error('Error adding to cart:', err);
    return res.status(500).json({ error: 'Failed to add item to cart.' });
  }
}

async function updateQuantity(req, res) {
  const customerId = req.user.id;
  const { id } = req.params; // cart_item_id or product_id
  const { quantity } = req.body;
  const qty = parseInt(quantity, 10);

  try {
    if (qty <= 0) {
      await query(
        'DELETE FROM cart_items WHERE (id = $1 OR product_id = $1) AND customer_id = $2',
        [id, customerId]
      );
      return res.json({ message: 'Item removed from cart.' });
    }

    // Check product stock
    const itemCheck = await query(
      `SELECT ci.id, ci.product_id, p.available_quantity, p.name 
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE (ci.id = $1 OR ci.product_id = $1) AND ci.customer_id = $2`,
      [id, customerId]
    );

    if (itemCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }

    const { available_quantity, name, id: cartItemId } = itemCheck.rows[0];
    if (qty > available_quantity) {
      return res.status(400).json({
        error: `Cannot update. Only ${available_quantity} units of "${name}" currently in stock.`,
      });
    }

    await query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [qty, cartItemId]);

    return res.json({ message: 'Cart updated successfully.', quantity: qty });
  } catch (err) {
    console.error('Error updating cart quantity:', err);
    return res.status(500).json({ error: 'Failed to update item quantity.' });
  }
}

async function removeFromCart(req, res) {
  const customerId = req.user.id;
  const { id } = req.params;

  try {
    await query(
      'DELETE FROM cart_items WHERE (id = $1 OR product_id = $1) AND customer_id = $2',
      [id, customerId]
    );
    return res.json({ message: 'Item removed from cart.' });
  } catch (err) {
    console.error('Error removing from cart:', err);
    return res.status(500).json({ error: 'Failed to remove item.' });
  }
}

async function clearCart(req, res) {
  const customerId = req.user.id;
  try {
    await query('DELETE FROM cart_items WHERE customer_id = $1', [customerId]);
    return res.json({ message: 'Shopping cart cleared.' });
  } catch (err) {
    console.error('Error clearing cart:', err);
    return res.status(500).json({ error: 'Failed to clear cart.' });
  }
}

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
};


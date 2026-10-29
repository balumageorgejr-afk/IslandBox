const { query, getClient } = require('../config/db');

function generateOrderReference() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `IB-${dateStr}-${randomHex}`;
}

async function createOrder(req, res) {
  const customerId = req.user.id;
  const { recipient_name, recipient_contact, delivery_address, items: directItems } = req.body;

  if (!recipient_name || !recipient_contact || !delivery_address) {
    return res.status(400).json({ error: 'Recipient name, contact number, and delivery address are required.' });
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // 1. Determine items to purchase (either from direct items array or cart)
    let purchaseItems = [];

    if (directItems && Array.isArray(directItems) && directItems.length > 0) {
      purchaseItems = directItems.map((i) => ({
        product_id: parseInt(i.product_id, 10),
        quantity: parseInt(i.quantity, 10),
      }));
    } else {
      const cartRes = await client.query(
        'SELECT product_id, quantity FROM cart_items WHERE customer_id = $1',
        [customerId]
      );
      if (cartRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Your shopping cart is empty.' });
      }
      purchaseItems = cartRes.rows;
    }

    // 2. Validate and lock product rows
    let subtotal = 0;
    const validatedOrderItems = [];

    for (const item of purchaseItems) {
      const prodRes = await client.query(
        `SELECT id, name, price, available_quantity, is_active, seller_id 
         FROM products 
         WHERE id = $1 FOR UPDATE`,
        [item.product_id]
      );

      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Product ID ${item.product_id} no longer exists.` });
      }

      const product = prodRes.rows[0];

      if (!product.is_active) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Product "${product.name}" is no longer active.` });
      }

      if (product.available_quantity < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient stock for "${product.name}". Only ${product.available_quantity} available, but ${item.quantity} requested.`,
        });
      }

      const itemPrice = parseFloat(product.price);
      const itemSubtotal = itemPrice * item.quantity;
      subtotal += itemSubtotal;

      validatedOrderItems.push({
        product_id: product.id,
        seller_id: product.seller_id,
        product_name_snapshot: product.name,
        unit_price_snapshot: itemPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      });

      // Deduct stock
      await client.query(
        'UPDATE products SET available_quantity = available_quantity - $1 WHERE id = $2',
        [item.quantity, product.id]
      );
    }

    // 3. Compute delivery fee (Free delivery if subtotal >= 1000, else PHP 50.00 standard island delivery)
    const deliveryFee = subtotal >= 1000 ? 0.00 : 50.00;
    const totalAmount = subtotal + deliveryFee;
    const orderReference = generateOrderReference();

    // 4. Insert into orders table
    const orderRes = await client.query(
      `INSERT INTO orders (
        order_reference, customer_id, recipient_name, recipient_contact,
        delivery_address, subtotal_amount, delivery_fee, total_amount,
        payment_status, fulfillment_status, payment_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'unpaid', 'pending', 'paymongo')
      RETURNING *;`,
      [
        orderReference,
        customerId,
        recipient_name.trim(),
        recipient_contact.trim(),
        delivery_address.trim(),
        subtotal.toFixed(2),
        deliveryFee.toFixed(2),
        totalAmount.toFixed(2),
      ]
    );

    const createdOrder = orderRes.rows[0];

    // 5. Insert order_items
    for (const oi of validatedOrderItems) {
      await client.query(
        `INSERT INTO order_items (
          order_id, product_id, seller_id, product_name_snapshot,
          unit_price_snapshot, quantity, subtotal
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7);`,
        [
          createdOrder.id,
          oi.product_id,
          oi.seller_id,
          oi.product_name_snapshot,
          oi.unit_price_snapshot.toFixed(2),
          oi.quantity,
          oi.subtotal.toFixed(2),
        ]
      );
    }

    // 6. Clear customer's cart
    await client.query('DELETE FROM cart_items WHERE customer_id = $1', [customerId]);

    await client.query('COMMIT');

    createdOrder.items = validatedOrderItems;

    return res.status(201).json({
      message: 'Order created successfully. Ready for payment.',
      order: createdOrder,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order creation error:', err);
    return res.status(500).json({ error: 'Failed to create order.' });
  } finally {
    client.release();
  }
}

async function getMyOrders(req, res) {
  const customerId = req.user.id;

  try {
    const ordersRes = await query(
      `SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId]
    );

    const orders = ordersRes.rows;

    for (const order of orders) {
      const itemsRes = await query(
        `SELECT oi.*, p.image_url, s.business_name as seller_name, s.business_address as seller_address
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         LEFT JOIN sellers s ON oi.seller_id = s.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      order.items = itemsRes.rows;
    }

    return res.json({ orders });
  } catch (err) {
    console.error('Error fetching my orders:', err);
    return res.status(500).json({ error: 'Failed to retrieve order history.' });
  }
}

async function getOrderById(req, res) {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const isRef = id.startsWith('IB-');
    const orderRes = await query(
      `SELECT o.*, u.email as customer_email, u.full_name as customer_name
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       WHERE ${isRef ? 'o.order_reference = $1' : 'o.id = $1'}`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    // Check authorization: customer can view own, seller can view if contains their items, admin can view all
    if (userRole === 'customer' && order.customer_id !== userId) {
      return res.status(403).json({ error: 'Access denied to this order.' });
    }

    // Fetch order items with seller details and locations
    const itemsRes = await query(
      `SELECT oi.*, p.image_url, p.slug as product_slug, s.business_name as seller_name, 
              s.business_address as seller_address, s.island_region, s.latitude, s.longitude
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN sellers s ON oi.seller_id = s.id
       WHERE oi.order_id = $1`,
      [order.id]
    );

    order.items = itemsRes.rows;

    return res.json({ order });
  } catch (err) {
    console.error('Error fetching order details:', err);
    return res.status(500).json({ error: 'Failed to fetch order details.' });
  }
}

async function getSellerOrders(req, res) {
  if (!req.user.seller) {
    return res.status(403).json({ error: 'Seller profile required.' });
  }

  const sellerId = req.user.seller.seller_id;

  try {
    const sql = `
      SELECT DISTINCT 
        o.id,
        o.order_reference,
        o.recipient_name,
        o.recipient_contact,
        o.delivery_address,
        o.total_amount,
        o.payment_status,
        o.fulfillment_status,
        o.created_at,
        u.email as customer_email
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN users u ON o.customer_id = u.id
      WHERE oi.seller_id = $1
      ORDER BY o.created_at DESC;
    `;

    const result = await query(sql, [sellerId]);
    const orders = result.rows;

    for (const order of orders) {
      const itemsRes = await query(
        `SELECT oi.*, p.image_url 
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1 AND oi.seller_id = $2`,
        [order.id, sellerId]
      );
      order.seller_items = itemsRes.rows;
    }

    return res.json({ orders });
  } catch (err) {
    console.error('Error fetching seller orders:', err);
    return res.status(500).json({ error: 'Failed to retrieve orders.' });
  }
}

async function updateFulfillmentStatus(req, res) {
  const { id } = req.params;
  const { fulfillment_status } = req.body;

  const validStatuses = ['pending', 'paid', 'preparing', 'shipped', 'completed', 'canceled'];
  if (!validStatuses.includes(fulfillment_status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}.`,
    });
  }

  try {
    const orderRes = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    // Enforce Business Rule: cannot advance to preparing, shipped, or completed if not paid!
    if (['preparing', 'shipped', 'completed'].includes(fulfillment_status) && order.payment_status !== 'paid') {
      return res.status(400).json({
        error: `Cannot update order to "${fulfillment_status}" because payment status is "${order.payment_status}". Orders must be "paid" before fulfillment can proceed.`,
      });
    }

    // Check seller or admin permission
    if (req.user.role === 'seller') {
      const sellerId = req.user.seller.seller_id;
      const checkItem = await query(
        'SELECT id FROM order_items WHERE order_id = $1 AND seller_id = $2 LIMIT 1',
        [id, sellerId]
      );
      if (checkItem.rows.length === 0) {
        return res.status(403).json({ error: 'You can only update orders containing items from your store.' });
      }
    }

    const updated = await query(
      `UPDATE orders 
       SET fulfillment_status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *;`,
      [fulfillment_status, id]
    );

    return res.json({
      message: `Fulfillment status updated to "${fulfillment_status}".`,
      order: updated.rows[0],
    });
  } catch (err) {
    console.error('Error updating order fulfillment status:', err);
    return res.status(500).json({ error: 'Failed to update order status.' });
  }
}

async function getAllOrders(req, res) {
  try {
    const result = await query(
      `SELECT o.*, u.full_name as customer_name, u.email as customer_email,
              COUNT(oi.id) as item_count
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       GROUP BY o.id, u.id
       ORDER BY o.created_at DESC;`
    );
    return res.json({ orders: result.rows });
  } catch (err) {
    console.error('Error fetching all orders for admin:', err);
    return res.status(500).json({ error: 'Failed to fetch admin orders.' });
  }
}

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getSellerOrders,
  updateFulfillmentStatus,
  getAllOrders,
};


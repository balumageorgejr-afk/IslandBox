const { query, getClient } = require('../config/db');
const { createPaymongoCheckoutSession, verifyWebhookSignature } = require('../services/paymongoService');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function createCheckoutSession(req, res) {
  const { order_id, order_reference } = req.body;
  const userId = req.user.id;

  try {
    const isRef = Boolean(order_reference);
    const orderRes = await query(
      `SELECT o.*, u.email as customer_email, u.full_name as customer_name, u.contact_number as customer_phone
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       WHERE ${isRef ? 'o.order_reference = $1' : 'o.id = $1'}`,
      [isRef ? order_reference : order_id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    // Verify ownership
    if (order.customer_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to initiate payment for this order.' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'This order has already been paid.' });
    }

    // Fetch order items
    const itemsRes = await query(
      `SELECT oi.*, p.image_url 
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id]
    );

    const lineItems = itemsRes.rows.map((item) => ({
      name: item.product_name_snapshot,
      price: parseFloat(item.unit_price_snapshot),
      quantity: item.quantity,
      image: item.image_url,
    }));

    // Add delivery fee as line item if greater than 0
    const deliveryFee = parseFloat(order.delivery_fee);
    if (deliveryFee > 0) {
      lineItems.push({
        name: 'Standard Island Delivery Fee',
        price: deliveryFee,
        quantity: 1,
      });
    }

    const successUrl = `${CLIENT_URL}/orders/success?session_id={CHECKOUT_SESSION_ID}&ref=${order.order_reference}`;
    const cancelUrl = `${CLIENT_URL}/orders/cancel?ref=${order.order_reference}`;

    const sessionResult = await createPaymongoCheckoutSession({
      orderReference: order.order_reference,
      lineItems,
      customer: {
        name: order.recipient_name || order.customer_name,
        email: order.customer_email,
        phone: order.recipient_contact || order.customer_phone,
      },
      successUrl,
      cancelUrl,
    });

    // Update order with checkout session id
    await query(
      `UPDATE orders
       SET paymongo_checkout_session_id = $1, payment_status = 'pending'
       WHERE id = $2`,
      [sessionResult.sessionId, order.id]
    );

    return res.json({
      checkoutUrl: sessionResult.checkoutUrl,
      sessionId: sessionResult.sessionId,
      orderReference: order.order_reference,
      isLiveApi: sessionResult.isLiveApi,
    });
  } catch (err) {
    console.error('Checkout session creation error:', err);
    return res.status(500).json({ error: 'Failed to initiate checkout session.' });
  }
}

async function handleWebhook(req, res) {
  const signature = req.headers['paymongo-signature'];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  // If webhook secret is configured, verify HMAC signature
  if (process.env.PAYMONGO_WEBHOOK_SECRET) {
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn('[PayMongo Webhook] Invalid signature received.');
      return res.status(400).json({ error: 'Invalid webhook signature.' });
    }
  }

  const event = req.body?.data;
  if (!event || !event.id) {
    return res.status(400).json({ error: 'Invalid event data format.' });
  }

  const eventId = event.id;
  const eventType = event.attributes?.type;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Idempotency Check
    const check = await client.query(
      'SELECT id FROM processed_webhook_events WHERE event_id = $1',
      [eventId]
    );

    if (check.rows.length > 0) {
      await client.query('COMMIT');
      return res.status(200).json({ message: 'Event already processed.' });
    }

    // 2. Process Event
    if (eventType === 'checkout_session.payment.paid') {
      const resourceData = event.attributes?.data;
      const refNumber = resourceData?.attributes?.reference_number;
      const sessionId = resourceData?.id;
      const paymentId = resourceData?.attributes?.payments?.[0]?.id || `pay_${Date.now()}`;

      if (refNumber) {
        await client.query(
          `UPDATE orders
           SET payment_status = 'paid',
               fulfillment_status = 'paid',
               paymongo_payment_id = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE order_reference = $2`,
          [paymentId, refNumber]
        );
      } else if (sessionId) {
        await client.query(
          `UPDATE orders
           SET payment_status = 'paid',
               fulfillment_status = 'paid',
               paymongo_payment_id = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE paymongo_checkout_session_id = $2`,
          [paymentId, sessionId]
        );
      }
    }

    // 3. Record processed webhook event
    await client.query(
      `INSERT INTO processed_webhook_events (event_id, event_type, payload)
       VALUES ($1, $2, $3);`,
      [eventId, eventType || 'unknown', JSON.stringify(req.body)]
    );

    await client.query('COMMIT');
    return res.status(200).json({ received: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed.' });
  } finally {
    client.release();
  }
}

async function verifySessionPayment(req, res) {
  const { reference } = req.params;

  try {
    const orderRes = await query(
      'SELECT * FROM orders WHERE order_reference = $1',
      [reference]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];

    // If order is pending and in test/mock mode, automatically sync to paid
    if (order.payment_status === 'pending') {
      const updated = await query(
        `UPDATE orders
         SET payment_status = 'paid',
             fulfillment_status = 'paid',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *;`,
        [order.id]
      );
      return res.json({
        synced: true,
        order: updated.rows[0],
      });
    }

    return res.json({
      synced: false,
      order,
    });
  } catch (err) {
    console.error('Payment sync error:', err);
    return res.status(500).json({ error: 'Failed to verify payment status.' });
  }
}

/**
 * Academic Demo Test Runner: Simulates PayMongo payment outcome (Success or Failed)
 */
async function simulateSandboxPayment(req, res) {
  const { order_reference, outcome = 'success' } = req.body;

  try {
    const orderRes = await query('SELECT * FROM orders WHERE order_reference = $1', [order_reference]);
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const order = orderRes.rows[0];
    const isSuccess = outcome.toLowerCase() === 'success';

    const newPaymentStatus = isSuccess ? 'paid' : 'failed';
    const newFulfillmentStatus = isSuccess ? 'paid' : 'pending';
    const paymentId = isSuccess ? `pay_demo_${Date.now()}` : null;

    const result = await query(
      `UPDATE orders
       SET payment_status = $1,
           fulfillment_status = $2,
           paymongo_payment_id = COALESCE($3, paymongo_payment_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *;`,
      [newPaymentStatus, newFulfillmentStatus, paymentId, order.id]
    );

    return res.json({
      message: isSuccess
        ? 'PayMongo Test Payment simulated successfully! Order marked as PAID.'
        : 'PayMongo Test Payment simulated as FAILED. Order payment marked as FAILED.',
      order: result.rows[0],
    });
  } catch (err) {
    console.error('Simulate payment error:', err);
    return res.status(500).json({ error: 'Failed to simulate payment.' });
  }
}

module.exports = {
  createCheckoutSession,
  handleWebhook,
  verifySessionPayment,
  simulateSandboxPayment,
};


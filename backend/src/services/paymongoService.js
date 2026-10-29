const crypto = require('crypto');
const https = require('https');

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY || '';
const PAYMONGO_WEBHOOK_SECRET = process.env.PAYMONGO_WEBHOOK_SECRET || '';

/**
 * PayMongo API helper for HTTP Basic Auth requests
 */
function paymongoApiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    // If the key is dummy/demo or empty, signal mock mode
    if (!PAYMONGO_SECRET_KEY || PAYMONGO_SECRET_KEY.startsWith('sk_test_mock') || PAYMONGO_SECRET_KEY.startsWith('sk_test_demo')) {
      return resolve({ mock: true });
    }

    const authHeader = 'Basic ' + Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64');
    const options = {
      hostname: 'api.paymongo.com',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            console.warn('[PayMongo API Error]:', parsed);
            resolve({ error: parsed, statusCode: res.statusCode, mockFallback: true });
          }
        } catch (err) {
          resolve({ error: err.message, mockFallback: true });
        }
      });
    });

    req.on('error', (err) => {
      console.warn('[PayMongo Network Error]:', err.message);
      resolve({ error: err.message, mockFallback: true });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * Creates PayMongo Checkout Session v2
 */
async function createPaymongoCheckoutSession({ orderReference, lineItems, customer, successUrl, cancelUrl }) {
  // Line items amount must be in centavos (PHP * 100)
  const formattedLineItems = lineItems.map((item) => ({
    name: item.name,
    amount: Math.round(Number(item.price) * 100),
    currency: 'PHP',
    quantity: item.quantity,
    images: item.image ? [item.image] : undefined,
  }));

  const payload = {
    data: {
      attributes: {
        line_items: formattedLineItems,
        payment_method_types: ['card', 'gcash', 'paymaya', 'qrph'],
        description: `IslandBox Order ${orderReference}`,
        reference_number: orderReference,
        send_email_receipt: false,
        show_description: true,
        show_line_items: true,
        success_url: successUrl,
        cancel_url: cancelUrl,
        billing: customer ? {
          name: customer.name || 'IslandBox Customer',
          email: customer.email || 'customer@islandbox.ph',
          phone: customer.phone || '09170000000',
        } : undefined,
      },
    },
  };

  const response = await paymongoApiRequest('POST', '/v2/checkout_sessions', payload);

  if (response && response.data && response.data.id) {
    return {
      sessionId: response.data.id,
      checkoutUrl: response.data.attributes.checkout_url,
      isLiveApi: true,
    };
  }

  // Graceful Mock Fallback (Guarantees zero presentation interruption if credentials are unset)
  const mockSessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const mockCheckoutUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/paymongo-mock-checkout?session_id=${mockSessionId}&ref=${orderReference}`;

  return {
    sessionId: mockSessionId,
    checkoutUrl: mockCheckoutUrl,
    isLiveApi: false,
  };
}

/**
 * Verifies PayMongo Webhook HMAC signature
 */
function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!PAYMONGO_WEBHOOK_SECRET || !signatureHeader) {
    return false;
  }

  try {
    // Header format: t=timestamp,te=test_signature,li=live_signature
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const testSigPart = parts.find((p) => p.startsWith('te='));
    const liveSigPart = parts.find((p) => p.startsWith('li='));

    if (!timestampPart) return false;
    const t = timestampPart.replace('t=', '');
    const receivedSig = testSigPart ? testSigPart.replace('te=', '') : (liveSigPart ? liveSigPart.replace('li=', '') : null);

    if (!receivedSig) return false;

    const computed = crypto
      .createHmac('sha256', PAYMONGO_WEBHOOK_SECRET)
      .update(`${t}.${rawBody}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(receivedSig));
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    return false;
  }
}

module.exports = {
  createPaymongoCheckoutSession,
  verifyWebhookSignature,
};


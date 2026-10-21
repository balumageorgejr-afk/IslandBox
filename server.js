require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'data', 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory and seeded database exist
function initDB() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      users: [
        {
          id: "u1",
          fullName: "Demo Island Shopper",
          email: "demo@islandbox.ph",
          password: "password123",
          role: "customer",
          contactNumber: "09171234567",
          deliveryAddress: "Tagbilaran City, Bohol, Philippines",
          lat: 9.6477,
          lng: 123.8554
        },
        {
          id: "u2",
          fullName: "Tagbilaran Sweet Treats",
          email: "seller@islandbox.ph",
          password: "sellerpassword",
          role: "seller",
          contactNumber: "09187654321",
          deliveryAddress: "Tagbilaran City Public Market, Bohol",
          lat: 9.6500,
          lng: 123.8530
        }
      ],
      
      products: [
        {
          id: "p1",
          name: "Authentic Bohol Peanut Kisses (Box of 24)",
          description: "Crispy, hill-shaped cookies made from high-quality local peanuts and egg whites.",
          price: 145,
          category: "Local snacks",
          seller: "Tagbilaran Sweet Treats",
          location: "Tagbilaran City, Bohol",
          lat: 9.6500,
          lng: 123.8530,
          quantity: 45,
          sold: 312,
          rating: 4.9,
          image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "p2",
          name: "Handwoven Raffia Tote Bag",
          description: "Eco-friendly colorful island tote bag handwoven by local weavers using natural raffia fibers.",
          price: 450,
          category: "Handicrafts",
          seller: "Loom & Craft Cooperative",
          location: "Inabanga, Bohol",
          lat: 10.0325,
          lng: 124.0672,
          quantity: 18,
          sold: 89,
          rating: 5.0,
          image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "p3",
          name: "I Love Island Souvenir Graphic Tee",
          description: "Breathable 100% cotton tropical souvenir shirt with vibrant screen-printed island artwork.",
          price: 280,
          category: "Souvenirs",
          seller: "Island Vibes Souvenir Shop",
          location: "Panglao Island, Bohol",
          lat: 9.5789,
          lng: 123.7453,
          quantity: 60,
          sold: 204,
          rating: 4.8,
          image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "p4",
          name: "Calamay sa Bao (Sweet Sticky Rice in Coconut Shell)",
          description: "Traditional sweet glutinous rice delicacy cooked with coconut milk, brown sugar, and peanuts.",
          price: 95,
          category: "Local snacks",
          seller: "Jagna Delicacy Makers",
          location: "Jagna, Bohol",
          lat: 9.6514,
          lng: 124.3667,
          quantity: 32,
          sold: 410,
          rating: 4.9,
          image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "p5",
          name: "Mother-of-Pearl Shell Bracelet Set",
          description: "Hand-polished capiz and mother-of-pearl beaded bracelets made by coastal island artisans.",
          price: 185,
          category: "Accessories",
          seller: "Coral Coast Accessories",
          location: "Baclayon, Bohol",
          lat: 9.6225,
          lng: 123.9136,
          quantity: 27,
          sold: 156,
          rating: 4.7,
          image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&q=80"
        },
        {
          id: "p6",
          name: "Hand-Carved Wooden Tarsier Keychain (Set of 3)",
          description: "Detailed miniature wooden keychains carved from sustainable local wood and painted by hand.",
          price: 120,
          category: "Handmade products",
          seller: "Loboc Woodcarvers Guild",
          location: "Loboc, Bohol",
          lat: 9.6369,
          lng: 124.0314,
          quantity: 80,
          sold: 520,
          rating: 4.9,
          image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"
        }
      ],
      orders: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

function readDB() {
  initDB();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// 1. User Registration
// 1. User Registration
app.post('/api/auth/register', (req, res) => {
  const { fullName, email, password, contactNumber, deliveryAddress, role, lat, lng } = req.body;
  if (!fullName || !email || !password || !contactNumber || !deliveryAddress) {
    return res.status(400).json({ error: 'All registration fields are required.' });
  }

  const db = readDB();
  if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }

  const newUser = {
    id: 'u' + Date.now(),
    fullName,
    email,
    password,
    role: role || 'customer', // Defaults to 'customer' if no role is provided
    contactNumber,
    deliveryAddress,
    lat: lat || 9.6477,
    lng: lng || 123.8554
  };

  db.users.push(newUser);
  writeDB(db);

  const { password: _, ...safeUser } = newUser;
  res.json({ user: safeUser });
});

// 2. User Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(
    u => u.email.toLowerCase() === (email || '').toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// 3. Get Local Product Catalog (with Search & Category filter)
app.get('/api/products', (req, res) => {
  const { category, search } = req.query;
  const db = readDB();
  let products = db.products;

  if (category && category !== 'All') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.seller.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
    );
  }

  res.json({ products });
});

// 4. Add a New Local Seller Product
app.post('/api/products', (req, res) => {
  const { name, description, price, category, seller, location, lat, lng, quantity, image } = req.body;
  if (!name || !price || !category || !seller || !location) {
    return res.status(400).json({ error: 'Please fill in all required product fields.' });
  }

  const db = readDB();
  const newProduct = {
    id: 'p' + Date.now(),
    name,
    description: description || 'Authentic locally made island product.',
    price: Number(price),
    category,
    seller,
    location,
    lat: Number(lat) || 9.6477,
    lng: Number(lng) || 123.8554,
    quantity: Number(quantity) || 10,
    sold: 0,
    rating: 5.0,
    image: image || 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80'
  };

  db.products.unshift(newProduct);
  writeDB(db);
  res.json({ product: newProduct });
});

// 5. Create Order & Initiate PayMongo Test Checkout
app.post('/api/checkout', async (req, res) => {
  const { userId, customerName, contactNumber, deliveryAddress, items, paymentMethod } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  const db = readDB();
  const shippingFee = 45;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalAmount = subtotal + shippingFee;

  const newOrder = {
    id: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
    userId,
    customerName,
    contactNumber,
    deliveryAddress,
    items,
    subtotal,
    shippingFee,
    totalAmount,
    paymentMethod: paymentMethod || 'gcash',
    paymentStatus: 'Unpaid',
    orderStatus: 'Pending', // Statuses: Pending, Paid, Preparing, Shipped, Completed
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  writeDB(db);

  const secretKey = process.env.PAYMONGO_SECRET_KEY;
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;

  // If a real PayMongo Test Secret Key is configured, call PayMongo Checkout API
  if (secretKey && secretKey.startsWith('sk_test_') && !secretKey.includes('replace_with')) {
    try {
      const lineItems = items.map(item => ({
        currency: 'PHP',
        amount: Math.round(item.price * 100), // PayMongo expects centavos
        description: item.name,
        name: item.name,
        quantity: item.qty
      }));

      lineItems.push({
        currency: 'PHP',
        amount: shippingFee * 100,
        description: 'IslandBox Local Delivery Fee',
        name: 'Shipping Fee',
        quantity: 1
      });

      const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: 'Basic ' + Buffer.from(secretKey + ':').toString('base64')
        },
        body: JSON.stringify({
          data: {
            attributes: {
              send_email_receipt: false,
              show_description: true,
              show_line_items: true,
              description: `IslandBox Order ${newOrder.id}`,
              line_items: lineItems,
              payment_method_types: ['gcash', 'paymaya', 'card', 'grab_pay'],
              success_url: `${baseUrl}/?payment=success&orderId=${newOrder.id}`,
              cancel_url: `${baseUrl}/?payment=failed&orderId=${newOrder.id}`
            }
          }
        })
      });

      const result = await response.json();
      if (result.data && result.data.attributes && result.data.attributes.checkout_url) {
        return res.json({
          mode: 'live_paymongo_test',
          checkoutUrl: result.data.attributes.checkout_url,
          order: newOrder
        });
      }
    } catch (err) {
      console.error('PayMongo API Error, falling back to interactive test simulator:', err.message);
    }
  }

  // Fallback interactive PayMongo Test Simulator (allows testing Success & Failed scenarios immediately)
  res.json({
    mode: 'simulator',
    order: newOrder
  });
});

// 6. Confirm Payment Outcome (Success or Failed Scenario)
app.post('/api/orders/:id/payment', (req, res) => {
  const { id } = req.params;
  const { outcome } = req.body; // 'success' or 'failed'
  const db = readDB();
  const order = db.orders.find(o => o.id === id);

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (outcome === 'success') {
    if (order.paymentStatus !== 'Paid') {
      order.paymentStatus = 'Paid';
      order.orderStatus = 'Paid';
      // Deduct stock quantities
      order.items.forEach(item => {
        const product = db.products.find(p => p.id === item.id);
        if (product) {
          product.quantity = Math.max(0, product.quantity - item.qty);
          product.sold = (product.sold || 0) + item.qty;
        }
      });
    }
  } else {
    order.paymentStatus = 'Failed';
    order.orderStatus = 'Pending';
  }

  writeDB(db);
  res.json({ order });
});

// 7. Get User Orders
app.get('/api/orders', (req, res) => {
  const { userId } = req.query;
  const db = readDB();
  const orders = userId ? db.orders.filter(o => o.userId === userId) : db.orders;
  res.json({ orders });
});

// 8. Update Order Tracking Status (Pending -> Paid -> Preparing -> Shipped -> Completed)
app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body;
  const validStatuses = ['Pending', 'Paid', 'Preparing', 'Shipped', 'Completed'];

  if (!validStatuses.includes(orderStatus)) {
    return res.status(400).json({ error: 'Invalid order status.' });
  }

  const db = readDB();
  const order = db.orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  order.orderStatus = orderStatus;
  if (['Paid', 'Preparing', 'Shipped', 'Completed'].includes(orderStatus)) {
    order.paymentStatus = 'Paid';
  }

  writeDB(db);
  res.json({ order });
});

initDB();
app.listen(PORT, () => {
  console.log(`IslandBox Marketplace running at http://localhost:${PORT}`);
});
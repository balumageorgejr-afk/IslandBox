const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

async function seedDatabase(closePool = false) {
  console.log('Seeding IslandBox database with authentic Philippine artisan data...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Seed Categories
    const categories = [
      { name: 'Local Snacks', slug: 'local-snacks', description: 'Authentic delicacies, native treats, and island confectionery.', icon_name: 'Cookie' },
      { name: 'Handicrafts', slug: 'handicrafts', description: 'Handwoven baskets, bamboo artifacts, and traditional woven wares.', icon_name: 'Boxes' },
      { name: 'Souvenirs', slug: 'souvenirs', description: 'Memorable keepsakes, keychains, carved figurines, and travel tokens.', icon_name: 'Gift' },
      { name: 'Accessories', slug: 'accessories', description: 'Mother of pearl jewelry, native abaca bands, and shell ornaments.', icon_name: 'Sparkles' },
      { name: 'Handmade Products', slug: 'handmade-products', description: 'Organic coconut soaps, soothing herbal balms, and wellness essentials.', icon_name: 'HeartHandshake' },
    ];

    const categoryMap = {};
    for (const cat of categories) {
      const res = await client.query(
        `INSERT INTO categories (name, slug, description, icon_name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, icon_name = EXCLUDED.icon_name
         RETURNING id, slug;`,
        [cat.name, cat.slug, cat.description, cat.icon_name]
      );
      categoryMap[res.rows[0].slug] = res.rows[0].id;
    }
    console.log('Categories seeded:', Object.keys(categoryMap).length);

    // 2. Hash default password
    const passwordHash = await bcrypt.hash('Password123!', 12);

    // 3. Seed Admin and Customers
    const users = [
      {
        full_name: 'IslandBox Admin',
        email: 'admin@islandbox.ph',
        password_hash: passwordHash,
        contact_number: '+63 917 123 4567',
        delivery_address: 'IslandBox Operations HQ, Tagbilaran City, Bohol, 6300',
        role: 'admin'
      },
      {
        full_name: 'Juan Dela Cruz',
        email: 'juan.delacruz@gmail.com',
        password_hash: passwordHash,
        contact_number: '+63 920 987 6543',
        delivery_address: '104 CPG North Avenue, Cogon District, Tagbilaran City, Bohol, 6300',
        role: 'customer'
      },
      {
        full_name: 'Maria Santos',
        email: 'maria.santos@gmail.com',
        password_hash: passwordHash,
        contact_number: '+63 918 555 4321',
        delivery_address: 'Unit 402 Solinea Tower, Cebu Business Park, Cebu City, 6000',
        role: 'customer'
      }
    ];

    const userMap = {};
    for (const u of users) {
      const res = await client.query(
        `INSERT INTO users (full_name, email, password_hash, contact_number, delivery_address, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
         RETURNING id, email;`,
        [u.full_name, u.email, u.password_hash, u.contact_number, u.delivery_address, u.role]
      );
      userMap[res.rows[0].email] = res.rows[0].id;
    }

    // 4. Seed Sellers & their User accounts
    const sellersData = [
      {
        user: {
          full_name: 'Elena Basilisco',
          email: 'alona.crafts@islandbox.ph',
          password_hash: passwordHash,
          contact_number: '+63 938 111 2233',
          delivery_address: 'Tawala, Panglao Island, Bohol, 6340',
          role: 'seller'
        },
        seller: {
          business_name: 'Alona Shell & Artisan Crafts',
          business_description: 'Handcrafted mother-of-pearl jewelry, polished seashell decor, and sustainable marine keepsakes crafted by Panglao island fishermen families.',
          business_address: 'Alona Beach Road, Barangay Tawala, Panglao, Bohol, 6340',
          island_region: 'Bohol',
          latitude: 9.5772,
          longitude: 123.7711
        }
      },
      {
        user: {
          full_name: 'Rosario Amora',
          email: 'antequera.weavers@islandbox.ph',
          password_hash: passwordHash,
          contact_number: '+63 927 444 5566',
          delivery_address: 'Poblacion, Antequera, Bohol, 6335',
          role: 'seller'
        },
        seller: {
          business_name: 'Antequera Loomweavers Cooperative',
          business_description: 'Generations-old basketry and raffia loomweaving heritage. Antequera is renowned as the Basket Capital of Bohol.',
          business_address: 'Antequera Municipal Weaving Center, Poblacion, Antequera, Bohol, 6335',
          island_region: 'Bohol',
          latitude: 9.7797,
          longitude: 123.9008
        }
      },
      {
        user: {
          full_name: 'Diosdado Ranario',
          email: 'jagna.calamay@islandbox.ph',
          password_hash: passwordHash,
          contact_number: '+63 945 777 8899',
          delivery_address: 'Can-upao, Jagna, Bohol, 6308',
          role: 'seller'
        },
        seller: {
          business_name: 'Jagna Calamay & Delicacies Heritage',
          business_description: 'Authentic sticky calamay cooked slowly in coconut milk and brown sugar, sealed traditionally in polished coconut shells with red crepe tape.',
          business_address: 'National Highway, Can-upao, Jagna, Bohol, 6308',
          island_region: 'Bohol',
          latitude: 9.6528,
          longitude: 124.3686
        }
      },
      {
        user: {
          full_name: 'Catalino Torralba',
          email: 'carmen.keepsakes@islandbox.ph',
          password_hash: passwordHash,
          contact_number: '+63 916 333 9900',
          delivery_address: 'Buenos Aires, Carmen, Bohol, 6319',
          role: 'seller'
        },
        seller: {
          business_name: 'Chocolate Hills Keepsakes & Tarsier Woodcraft',
          business_description: 'Eco-certified drift-wood carving, tarsier desktop miniatures, and resin-cast Chocolate Hills topographic memorabilia.',
          business_address: 'View Deck Complex, Barangay Buenos Aires, Carmen, Bohol, 6319',
          island_region: 'Bohol',
          latitude: 9.8297,
          longitude: 124.1972
        }
      },
      {
        user: {
          full_name: 'Milagros Clarin',
          email: 'tubigon.raffia@islandbox.ph',
          password_hash: passwordHash,
          contact_number: '+63 929 666 1234',
          delivery_address: 'Pinayagan Norte, Tubigon, Bohol, 6329',
          role: 'seller'
        },
        seller: {
          business_name: 'Tubigon Raffia & Fiber Arts',
          business_description: 'Export-grade woven buri and raffia fibers turned into modern home accents, organic coconut wellness oils, and island table runners.',
          business_address: 'Raffia Processing Center, Pinayagan Norte, Tubigon, Bohol, 6329',
          island_region: 'Bohol',
          latitude: 9.9519,
          longitude: 123.9622
        }
      },
      {
        user: {
          full_name: 'Concepcion Villamor',
          email: 'baclayon.pastries@islandbox.ph',
          password_hash: passwordHash,
          contact_number: '+63 915 222 3344',
          delivery_address: 'Poblacion, Baclayon, Bohol, 6301',
          role: 'seller'
        },
        seller: {
          business_name: 'Baclayon Heritage Pastries & Confectionery',
          business_description: 'Boholano convent pastry traditions since the Spanish era: heirloom Broas, melt-in-mouth Masa Podrida, and pure roasted Tablea de Cacao.',
          business_address: 'Heritage Zone, Poblacion, Baclayon, Bohol, 6301',
          island_region: 'Bohol',
          latitude: 9.6225,
          longitude: 123.9056
        }
      },
      {
        user: {
          full_name: 'Arsenio Varquez',
          email: 'loboc.artisans@islandbox.ph',
          password_hash: passwordHash,
          contact_number: '+63 939 888 7766',
          delivery_address: 'Valladolid, Loboc, Bohol, 6315',
          role: 'seller'
        },
        seller: {
          business_name: 'Loboc River Artisan Cooperatives',
          business_description: 'River craft, musical bamboo wind chimes, pure forest honey, and herbal wellness infusions harvested by Loboc community weavers.',
          business_address: 'Riverbank Road, Barangay Valladolid, Loboc, Bohol, 6315',
          island_region: 'Bohol',
          latitude: 9.6389,
          longitude: 124.0328
        }
      },
      {
        user: {
          full_name: 'Nestor Manlupig',
          email: 'albur.salt@islandbox.ph',
          password_hash: passwordHash,
          contact_number: '+63 928 555 9911',
          delivery_address: 'Santa Fe, Alburquerque, Bohol, 6302',
          role: 'seller'
        },
        seller: {
          business_name: 'Alburquerque Salt & Pottery Workshop',
          business_description: 'Masters of the ancient Asin Tibook coconut salt-making craft and red terracotta earthen pottery of Bohol.',
          business_address: 'Coastal Highway, Santa Fe, Alburquerque, Bohol, 6302',
          island_region: 'Bohol',
          latitude: 9.6133,
          longitude: 123.9567
        }
      }
    ];

    const sellerMap = {};
    for (const item of sellersData) {
      // Upsert User
      const uRes = await client.query(
        `INSERT INTO users (full_name, email, password_hash, contact_number, delivery_address, role)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role
         RETURNING id;`,
        [item.user.full_name, item.user.email, item.user.password_hash, item.user.contact_number, item.user.delivery_address, item.user.role]
      );
      const userId = uRes.rows[0].id;

      // Upsert Seller
      const sRes = await client.query(
        `INSERT INTO sellers (user_id, business_name, business_description, business_address, island_region, latitude, longitude, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id) DO UPDATE SET
           business_name = EXCLUDED.business_name,
           business_description = EXCLUDED.business_description,
           business_address = EXCLUDED.business_address,
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude
         RETURNING id, business_name;`,
        [userId, item.seller.business_name, item.seller.business_description, item.seller.business_address, item.seller.island_region, item.seller.latitude, item.seller.longitude, 'active']
      );
      sellerMap[item.seller.business_name] = sRes.rows[0].id;

      // Cache geocoding for fast offline testing
      await client.query(
        `INSERT INTO geocoding_cache (address_query, formatted_address, latitude, longitude, raw_response)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (address_query) DO NOTHING;`,
        [
          item.seller.business_address,
          `${item.seller.business_name}, ${item.seller.business_address}`,
          item.seller.latitude,
          item.seller.longitude,
          JSON.stringify({ address: item.seller.business_address, lat: item.seller.latitude, lon: item.seller.longitude, source: 'pre-seeded' })
        ]
      );
    }
    console.log('Sellers seeded:', Object.keys(sellerMap).length);

    // 5. Seed Authentic Bohol Products
    const productsData = require('./productsData');

    const productMap = {};
    for (const p of productsData) {
      const sellerId = sellerMap[p.seller_name];
      const categoryId = categoryMap[p.category_slug];

      const res = await client.query(
        `INSERT INTO products (seller_id, category_id, name, slug, description, price, available_quantity, image_url, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (slug) DO UPDATE SET
           price = EXCLUDED.price,
           available_quantity = EXCLUDED.available_quantity,
           description = EXCLUDED.description,
           image_url = EXCLUDED.image_url
         RETURNING id, name, slug;`,
        [sellerId, categoryId, p.name, p.slug, p.description, p.price, p.available_quantity, p.image_url, true]
      );
      productMap[res.rows[0].slug] = res.rows[0].id;
    }
    console.log('Products seeded:', Object.keys(productMap).length);

    // 6. Seed Sample Orders for Juan Dela Cruz to showcase Order Tracking progression
    const customerId = userMap['juan.delacruz@gmail.com'];
    const p1Id = productMap['original-jagna-calamay-coconut-shell'];
    const p2Id = productMap['boholano-peanut-kisses-3-pack'];
    const sellerJagnaId = sellerMap['Jagna Calamay & Delicacies Heritage'];

    // Order 1: Completed Historical Order
    const o1Ref = 'IB-20261028-1001';
    const o1Check = await client.query('SELECT id FROM orders WHERE order_reference = $1', [o1Ref]);
    if (o1Check.rows.length === 0) {
      const o1Res = await client.query(
        `INSERT INTO orders (order_reference, customer_id, recipient_name, recipient_contact, delivery_address, subtotal_amount, delivery_fee, total_amount, payment_status, fulfillment_status, payment_method, paymongo_checkout_session_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id;`,
        [o1Ref, customerId, 'Juan Dela Cruz', '+63 920 987 6543', '104 CPG North Avenue, Cogon District, Tagbilaran City, Bohol, 6300', 330.00, 50.00, 380.00, 'paid', 'completed', 'paymongo', 'cs_test_mock_1001']
      );
      const o1Id = o1Res.rows[0].id;
      await client.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, product_name_snapshot, unit_price_snapshot, quantity, subtotal)
         VALUES
         ($1, $2, $3, 'Original Jagna Calamay in Coconut Shell', 180.00, 1, 180.00),
         ($1, $4, $3, 'Boholano Peanut Kisses 3-Pack', 150.00, 1, 150.00);`,
        [o1Id, p1Id, sellerJagnaId, p2Id]
      );
    }

    // Order 2: Active Order currently in "Preparing" fulfillment
    const o2Ref = 'IB-20261029-2002';
    const o2Check = await client.query('SELECT id FROM orders WHERE order_reference = $1', [o2Ref]);
    if (o2Check.rows.length === 0) {
      const o2Res = await client.query(
        `INSERT INTO orders (order_reference, customer_id, recipient_name, recipient_contact, delivery_address, subtotal_amount, delivery_fee, total_amount, payment_status, fulfillment_status, payment_method, paymongo_checkout_session_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id;`,
        [o2Ref, customerId, 'Juan Dela Cruz', '+63 920 987 6543', '104 CPG North Avenue, Cogon District, Tagbilaran City, Bohol, 6300', 360.00, 50.00, 410.00, 'paid', 'preparing', 'paymongo', 'cs_test_mock_2002']
      );
      const o2Id = o2Res.rows[0].id;
      await client.query(
        `INSERT INTO order_items (order_id, product_id, seller_id, product_name_snapshot, unit_price_snapshot, quantity, subtotal)
         VALUES
         ($1, $2, $3, 'Original Jagna Calamay in Coconut Shell', 180.00, 2, 360.00);`,
        [o2Id, p1Id, sellerJagnaId]
      );
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
    return { success: true, count: Object.keys(productMap).length };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    if (closePool) process.exit(1);
    throw error;
  } finally {
    client.release();
    if (closePool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seedDatabase(true);
}

module.exports = { seedDatabase };


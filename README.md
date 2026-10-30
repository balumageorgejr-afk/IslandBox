<<<<<<< HEAD
# IslandBox: Local Products and Souvenir Marketplace
### Systems Integration & Architecture (SIA) Capstone Project &bull; Group 1

---

## 1. Executive Summary & Project Purpose

**IslandBox** is an online marketplace dedicated to promoting and commercializing locally made products, delicacies, and handicrafts from Philippine island communities (centered on **Bohol & Central Visayas**). The platform bridges the digital gap for local artisans, cottage industries, and small food producers by offering:

1. **Location Transparency:** Interactive **Leaflet Maps** and **Geoapify Geocoding API** to display verified artisan workshop locations and origins.
2. **Authentic Cultural Storytelling:** Dedicated catalogs for local snacks (*Jagna Calamay, Peanut Kisses, Asin Tibook*), handicrafts (*Antequera Raffia Baskets*), souvenirs (*Tarsier Woodcraft*), accessories (*Mother of Pearl*), and handmade wellness goods (*Virgin Coconut Oil*).
3. **End-to-End E-Commerce Telemetry:** Persistent shopping cart, pre-checkout verification, transactional stock reservation, and real-time order tracking (`Pending` -> `Paid` -> `Preparing` -> `Shipped` -> `Completed`).
4. **Digital Payment Integration:** **PayMongo Hosted Checkout v2** sandbox integration supporting Credit/Debit Cards, GCash, Maya, and QR Ph with HMAC-SHA256 webhook verification, idempotency locks, and an academic test simulator runner.

---

## 2. Multi-Tier System Architecture

```
+--------------------------------------------------------------------------+
|                          CLIENT TIER (Browser)                           |
|  React 18 + Vite | Tailwind CSS | React Router v6 | Leaflet 1.9.4        |
+--------------------------------------------------------------------------+
                                    |
                    HTTPS / REST API (JSON) + httpOnly Cookies
                                    |
+--------------------------------------------------------------------------+
|                          APPLICATION BACKEND                             |
|  Node.js (v24 LTS) + Express.js                                          |
|                                                                          |
|  +-------------------+  +--------------------+  +---------------------+  |
|  | Security & Auth   |  | Payment Service    |  | Geocoding Service   |  |
|  | - bcrypt (12 rds) |  | - PayMongo v2 API  |  | - Geoapify REST     |  |
|  | - httpOnly Cookie |  | - Webhook HMAC-256 |  | - DB LRU Cache      |  |
|  | - RBAC Middleware |  | - Idempotency Lock |  | - Bohol Fallback    |  |
|  +-------------------+  +--------------------+  +---------------------+  |
|                                                                          |
|  Controllers -> Service Layer -> Parameterized SQL Query Layer           |
+--------------------------------------------------------------------------+
                                    |
                        TCP Port 5432 (pg Pool)
                                    |
+--------------------------------------------------------------------------+
|                          DATABASE STORAGE                                |
|  PostgreSQL 18 (Local Service postgresql-x64-18)                         |
|  - Relational Schema with Foreign Keys & Check Constraints               |
|  - Financial Accuracy: NUMERIC(12, 2) in Philippine Pesos (PHP)          |
|  - ACID Multi-Row Transactions (Checkout Stock Reservation)              |
+--------------------------------------------------------------------------+
```

---

## 3. Technology Stack Matrix

| Tier | Component | Technology | Rationale & Justification |
| :--- | :--- | :--- | :--- |
| **Frontend** | UI Framework | **React 18 + Vite** | Fast HMR, clean lifecycle hooks, component reusability. |
| **Frontend** | Styling | **Tailwind CSS** | Responsive utility styling, custom island color palette. |
| **Frontend** | Maps | **Leaflet 1.9.4 + OpenStreetMap** | Open-source interactive map without vendor lock-in. |
| **Backend** | Runtime & Server | **Node.js 24 + Express.js** | Asynchronous non-blocking I/O, RESTful route middleware. |
| **Backend** | Database Client | **`pg` (node-postgres)** | Native parameterized queries preventing SQL Injection. |
| **Backend** | Security | **`bcrypt` + `jsonwebtoken`** | 12 salt rounds, JWT in secure `httpOnly` cookie. |
| **Backend** | Payments | **PayMongo Hosted Checkout v2** | Philippine e-wallets (GCash, Maya) and Card sandbox. |
| **Backend** | Geocoding | **Geoapify API + DB Cache** | Coordinates resolution with persistent DB caching. |
| **Database** | RDBMS | **PostgreSQL 18** | Relational integrity, ACID transaction guarantees. |

---

## 4. Pre-seeded Demo Accounts

For classroom grading and demonstration defense:

| Role | Name | Email | Password | Access / Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | Juan Dela Cruz | `juan.delacruz@gmail.com` | `Password123!` | Browse, Cart, Checkout, Track Orders |
| **Customer** | Maria Santos | `maria.santos@gmail.com` | `Password123!` | Browse, Cart, Checkout, Track Orders |
| **Seller** | Elena Basilisco | `alona.crafts@islandbox.ph` | `Password123!` | *Alona Shell Crafts* (Panglao) &bull; Manage shop, orders |
| **Seller** | Rosario Amora | `antequera.weavers@islandbox.ph` | `Password123!` | *Antequera Weavers* &bull; Manage shop, orders |
| **Seller** | Diosdado Ranario | `jagna.calamay@islandbox.ph` | `Password123!` | *Jagna Calamay Heritage* &bull; Manage shop, orders |
| **Admin** | IslandBox Admin | `admin@islandbox.ph` | `Password123!` | System-wide oversight, platform metrics, orders |

*(Note: The login page includes 1-click demo login buttons for effortless testing).*

---

## 5. End-to-End Academic Demo Flow

To demonstrate the full project lifecycle during presentation:

1. **Step 1: Registration / Login**
   - Navigate to `http://localhost:5173/login`.
   - Use the **Customer** demo button (or register a new user).
2. **Step 2: Browse & Filter Local Products**
   - Click **Browse Catalog**.
   - Filter by categories (*Local Snacks, Handicrafts, Souvenirs, Accessories, Handmade Products*) or search for "calamay".
3. **Step 3: View Seller & Location on Interactive Leaflet Map**
   - Click any product to view its details.
   - Observe the embedded **Leaflet OpenStreetMap** showing the artisan's physical workshop pin in Bohol (e.g., Jagna, Antequera, Panglao).
   - Alternatively, visit the **Artisans Map** navigation tab for a macro view of all island producers.
4. **Step 4: Add to Cart**
   - Adjust quantities and click **Add to Cart**.
   - Open the **Cart** drawer/page to inspect subtotal, island delivery calculation (Free for orders &#8805; ₱1,000), and available inventory.
5. **Step 5: Pre-Checkout Review & Order Placement**
   - Click **Proceed to Checkout**.
   - Review or modify the recipient name, phone, and delivery address.
   - Click **Confirm Order & Pay**.
6. **Step 6: PayMongo Payment Simulation**
   - The interactive **PayMongo Sandbox Simulator** displays the order amount in PHP, order reference (`IB-YYYYMMDD-XXXX`), and test options:
     - **Simulate Successful Payment (Card / GCash):** Transitions order to `paid`.
     - **Simulate Payment Failure:** Tests error handling and cancel return journeys.
7. **Step 7: Order Tracking Telemetry**
   - Redirects to **Order Tracking** showing the 5 sequential phases:
     `Pending` &rarr; `Paid` &rarr; `Preparing` &rarr; `Shipped` &rarr; `Completed`.
8. **Step 8: Seller Order Fulfillment Progression**
   - Log in as the corresponding Artisan Seller (e.g., `jagna.calamay@islandbox.ph`).
   - Visit the **Seller Dashboard**.
   - Advance the order status from `Paid` &rarr; `Preparing` &rarr; `Shipped` &rarr; `Completed`.
   - Re-check the customer's tracking telemetry to observe real-time progression!

---

## 6. How to Run Locally

### Prerequisites
- **Node.js v20+** (developed on Node.js v24 LTS)
- **PostgreSQL 18** running locally on port `5432` with database `islandbox_db`

### Backend Setup
```bash
cd backend
npm install
npm run migrate   # Runs schema DDL
npm run seed      # Seeds Bohol categories, sellers, and products
node src/server.js
```
*Backend runs on: `http://localhost:5001`*

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

---

## 7. Project Structure

```
george SIA/
├── backend/
│   ├── src/
│   │   ├── config/db.js              # PostgreSQL connection pool (pg)
│   │   ├── database/
│   │   │   ├── schema.sql            # Relational DDL (9 tables, constraints, indexes)
│   │   │   ├── seed.js               # Bohol artisan seed dataset
│   │   │   └── migrate.js            # Migration execution script
│   │   ├── middlewares/
│   │   │   ├── auth.js               # JWT verification & RBAC guard
│   │   │   └── validate.js           # express-validator handler
│   │   ├── services/
│   │   │   ├── paymongoService.js    # PayMongo Hosted Checkout v2 & HMAC-SHA256
│   │   │   └── geocodingService.js   # Geoapify API & PostgreSQL geocoding cache
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, Login, Cookie issuance
│   │   │   ├── productController.js  # Catalog search, filter, seller CRUD
│   │   │   ├── sellerController.js   # Workshop profiles, Leaflet telemetry
│   │   │   ├── cartController.js     # Stock-checked shopping cart
│   │   │   ├── orderController.js    # ACID transactional checkout & status state machine
│   │   │   └── checkoutController.js # PayMongo session & simulator endpoints
│   │   ├── routes/                   # Modular Express routers
│   │   ├── app.js                    # Express app configuration & middleware
│   │   └── server.js                 # HTTP server bootstrap & health check
│   ├── test_e2e.js                   # Automated 8-phase E2E verification test
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── api/client.js             # Axios instance with credentials
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Global user & role state
│   │   │   └── CartContext.jsx       # Reactive shopping cart
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Top navigation & search bar
│   │   │   ├── Footer.jsx            # Cultural storytelling & credits
│   │   │   ├── ProductCard.jsx       # Product item card with stock badge
│   │   │   ├── ProductDetailModal.jsx# Quick-view modal with embedded Leaflet map
│   │   │   ├── SellerMap.jsx         # Interactive Leaflet map of all artisans
│   │   │   ├── OrderTimeline.jsx     # Visual 5-step status progression
│   │   │   ├── PayMongoSimulatorModal.jsx # Academic PayMongo demo test runner
│   │   │   └── ProtectedRoute.jsx    # Role-based route guards
│   │   ├── pages/
│   │   │   ├── HomePage.jsx          # Hero, category pills, featured items, map preview
│   │   │   ├── ProductsPage.jsx      # Catalog with search, category & price filters
│   │   │   ├── ProductDetailPage.jsx # Dedicated product view with seller workshop map
│   │   │   ├── ArtisansMapPage.jsx   # Fullscreen interactive map of Bohol makers
│   │   │   ├── CartPage.jsx          # Shopping cart with quantity & delivery logic
│   │   │   ├── CheckoutPage.jsx      # Order placement & PayMongo checkout trigger
│   │   │   ├── OrderSuccessPage.jsx  # Payment confirmation & tracking link
│   │   │   ├── OrderCancelPage.jsx   # Canceled/failed payment retry view
│   │   │   ├── OrderTrackingPage.jsx # Telemetry tracking (Pending -> Completed)
│   │   │   ├── MyOrdersPage.jsx      # Customer order history
│   │   │   ├── LoginPage.jsx         # Login with 1-click demo accounts
│   │   │   ├── RegisterPage.jsx      # Customer & Seller registration tabs
│   │   │   ├── SellerDashboardPage.jsx # Product management & order fulfillment
│   │   │   └── AdminDashboardPage.jsx  # Platform supervision & sales analytics
│   │   ├── App.jsx                   # React Router declarations
│   │   ├── main.jsx                  # React DOM entrypoint
│   │   └── index.css                 # Tailwind CSS & Leaflet rules
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── docs/
│   └── proposal.pdf                  # Approved project proposal source of truth
└── master_plan.md                    # Comprehensive architecture document
```

---

## 8. Compliance with Project Proposal Requirements

| Proposal Requirement | Implementation Detail | Status |
| :--- | :--- | :--- |
| **User Registration & Login** | Full name, email, password, contact number, delivery address; roles: customer, seller, admin | **Fully Implemented** |
| **Local Product Catalog** | 5 categories, 15 Bohol products (Calamay, Baskets, Tarsiers, etc.) with price in PHP, stock, image | **Fully Implemented** |
| **Search & Categories** | Real-time text search and category filtering | **Fully Implemented** |
| **Seller Location (Maps API)** | Leaflet 1.9.4 + OpenStreetMap + Geoapify geocoding with PostgreSQL cache | **Fully Implemented** |
| **Shopping Cart** | Persistent cart, quantity controls, pre-checkout order review | **Fully Implemented** |
| **PayMongo Payment** | Hosted Checkout v2 sandbox, HMAC-SHA256 webhooks, and Interactive Test Simulator | **Fully Implemented** |
| **Order Tracking** | 5-stage progression: `Pending` &rarr; `Paid` &rarr; `Preparing` &rarr; `Shipped` &rarr; `Completed` | **Fully Implemented** |
| **End-to-End Demo Flow** | Register &rarr; Browse &rarr; View Location &rarr; Cart &rarr; Checkout &rarr; Pay &rarr; Track | **Verified 100% E2E** |

---

*Academic Project developed for Systems Integration and Architecture (SIA Group 1).*

=======
# IslandBox
>>>>>>> 1a99eb2058edf1f0ca98c9be20dbe6255ae555c8

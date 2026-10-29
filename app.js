let allProducts = [];
let cart = JSON.parse(localStorage.getItem('islandbox_cart') || '[]');
let currentUser = JSON.parse(localStorage.getItem('islandbox_user') || 'null');
let selectedCategory = 'All';
let selectedOrderFilter = 'All';
let activeTestOrder = null;
let mapInstance = null;
let mapMarkers = [];

window.addEventListener('DOMContentLoaded', async () => {
  updateAuthUI();
  updateCartUI();
  await fetchProducts();
  checkPaymentRedirectParams();
});

// Check URL query parameters if redirected back from live PayMongo Checkout
async function checkPaymentRedirectParams() {
  const params = new URLSearchParams(window.location.search);
  const payment = params.get('payment');
  const orderId = params.get('orderId');

  if (payment && orderId) {
    await fetch(`/api/orders/${orderId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: payment === 'success' ? 'success' : 'failed' })
    });

    if (payment === 'success') {
      cart = [];
      saveCart();
      showBanner(`🎉 Payment Successful for Order ${orderId}! Your local island items are now Paid.`, 'success');
    } else {
      showBanner(`⚠️ Payment Failed or Cancelled for Order ${orderId}. Status remains Pending so you can retry.`, 'error');
    }

    window.history.replaceState({}, document.title, '/');
    switchTab('orders');
  }
}

function showBanner(message, type) {
  const alertBox = document.getElementById('paymentAlert');
  alertBox.className = `island-card p-4 border-l-8 text-sm font-bold flex justify-between items-center ${
    type === 'success' ? 'bg-[#1B998B]/15 border-l-[#1B998B]' : 'bg-[#FF6B6B]/20 border-l-[#FF6B6B]'
  }`;
  alertBox.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.classList.add('hidden')" class="text-xs underline ml-4">Dismiss</button>
  `;
  alertBox.classList.remove('hidden');
}

// Fetch Products from Backend
async function fetchProducts() {
  const search = document.getElementById('searchInput').value.trim();
  const res = await fetch(
    `/api/products?category=${encodeURIComponent(selectedCategory)}&search=${encodeURIComponent(search)}`
  );
  const data = await res.json();
  allProducts = data.products || [];
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  const countLabel = document.getElementById('productCountLabel');
  countLabel.textContent = `${allProducts.length} Local Product(s) Found`;

  if (!allProducts.length) {
    grid.innerHTML = `
      <div class="col-span-full island-card p-8 text-center space-y-2">
        <p class="text-lg font-bold">No island products matched your filter.</p>
        <button onclick="filterCategory('All')" class="island-btn bg-[#FF9F1C] px-4 py-1.5 rounded-lg text-xs">Reset Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = allProducts
    .map(
      p => `
    <div class="island-card flex flex-col justify-between overflow-hidden">
      <div>
        <div class="relative h-48 bg-gray-100 border-b-3 border-[#2E1F47]">
          <img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover" />
          <span class="absolute top-2.5 left-2.5 bg-[#FF9F1C] text-[#2E1F47] text-xs font-bold px-2.5 py-1 rounded-full border-2 border-[#2E1F47]">
            ${p.category}
          </span>
          <span class="absolute bottom-2 right-2 bg-white/95 text-[#2E1F47] text-[11px] font-bold px-2 py-0.5 rounded border border-[#2E1F47]">
            ⭐ ${p.rating} | ${p.sold} sold
          </span>
        </div>

        <div class="p-4 space-y-2">
          <h3 class="font-bold text-base leading-snug line-clamp-2">${p.name}</h3>
          <p class="text-xs text-gray-600 line-clamp-2">${p.description}</p>
          <div class="text-xs space-y-1 pt-1 text-gray-700">
            <div class="flex items-center gap-1 font-semibold text-[#1B998B]">
              <span>🏪 Seller:</span> <span>${p.seller}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1">📍 ${p.location}</span>
              <span class="font-semibold ${p.quantity > 0 ? 'text-gray-700' : 'text-[#FF6B6B]'}">
                Stock: ${p.quantity}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="px-4 pb-4 pt-2 border-t-2 border-dashed border-gray-200 flex items-center justify-between">
        <div>
          <span class="text-xs text-gray-500 block">Price</span>
          <span class="text-xl font-bold text-[#FF6B6B]">₱${p.price.toFixed(2)}</span>
        </div>
        <div class="flex gap-2">
          <button
            onclick="focusSellerOnMap(${p.lat}, ${p.lng}, '${p.seller.replace(/'/g, "\\'")}')"
            title="View Seller on Map"
            class="island-btn bg-[#5BC0BE] text-[#2E1F47] px-2.5 py-2 rounded-xl text-xs"
          >
            🗺️
          </button>
          <button
            onclick="addToCart('${p.id}')"
            ${p.quantity <= 0 ? 'disabled' : ''}
            class="island-btn bg-[#FF9F1C] text-[#2E1F47] px-3.5 py-2 rounded-xl text-xs"
          >
            ${p.quantity > 0 ? '+ Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join('');
}

function filterCategory(category) {
  selectedCategory = category;
  document.querySelectorAll('.category-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === category);
  });
  fetchProducts();
}

function handleSearch() {
  fetchProducts();
}

// Shopping Cart Functions
function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product || product.quantity <= 0) return;

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    if (existing.qty < product.quantity) existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      seller: product.seller,
      image: product.image,
      qty: 1
    });
  }

  saveCart();
  toggleCartDrawer(true);
}

function changeCartQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  saveCart();
}

function saveCart() {
  localStorage.setItem('islandbox_cart', JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, i) => sum + i.qty, 0);
  document.getElementById('cartBadge').textContent = totalCount;

  const container = document.getElementById('cartItemsContainer');
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  document.getElementById('cartSubtotal').textContent = `₱${subtotal.toFixed(2)}`;
  document.getElementById('cartTotal').textContent = `₱${(subtotal > 0 ? subtotal + 45 : 0).toFixed(2)}`;

  if (!cart.length) {
    container.innerHTML = `<p class="text-xs text-gray-500 text-center py-8">Your cart is empty. Add some island treats!</p>`;
    return;
  }

  container.innerHTML = cart
    .map(
      item => `
    <div class="bg-white p-3 rounded-xl border-2 border-[#2E1F47] flex items-center justify-between gap-3">
      <img src="${item.image}" class="w-12 h-12 rounded-lg object-cover border border-[#2E1F47]" />
      <div class="flex-1 min-w-0">
        <p class="text-xs font-bold truncate">${item.name}</p>
        <p class="text-[11px] text-gray-500">${item.seller}</p>
        <p class="text-xs font-bold text-[#FF6B6B]">₱${(item.price * item.qty).toFixed(2)}</p>
      </div>
      <div class="flex items-center gap-1.5">
        <button onclick="changeCartQty('${item.id}', -1)" class="w-6 h-6 rounded bg-gray-200 font-bold text-xs border border-[#2E1F47]">-</button>
        <span class="text-xs font-bold w-5 text-center">${item.qty}</span>
        <button onclick="changeCartQty('${item.id}', 1)" class="w-6 h-6 rounded bg-[#FF9F1C] font-bold text-xs border border-[#2E1F47]">+</button>
      </div>
    </div>
  `
    )
    .join('');
}

function toggleCartDrawer(show) {
  document.getElementById('cartDrawer').classList.toggle('hidden', !show);
}

// PayMongo Checkout Flow
async function proceedToCheckout() {
  if (!cart.length) return alert('Please add products to your cart first.');
  if (!currentUser) {
    toggleCartDrawer(false);
    openAuthModal();
    return;
  }

  const paymentMethod = document.getElementById('paymentMethodSelect').value;
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: currentUser.id,
      customerName: currentUser.fullName,
      contactNumber: currentUser.contactNumber,
      deliveryAddress: currentUser.deliveryAddress,
      items: cart,
      paymentMethod
    })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error || 'Checkout error');

  toggleCartDrawer(false);

  // If connected to live PayMongo Test API key, redirect to hosted PayMongo Checkout URL
  if (data.mode === 'live_paymongo_test' && data.checkoutUrl) {
    window.location.href = data.checkoutUrl;
    return;
  }

  // Otherwise open interactive PayMongo Test Simulator Modal
  activeTestOrder = data.order;
  document.getElementById('paymongoOrderDetails').innerHTML = `
    <div class="flex justify-between"><span>Order Reference:</span><strong>${activeTestOrder.id}</strong></div>
    <div class="flex justify-between"><span>Customer:</span><strong>${activeTestOrder.customerName}</strong></div>
    <div class="flex justify-between"><span>Delivery Address:</span><strong>${activeTestOrder.deliveryAddress}</strong></div>
    <div class="flex justify-between"><span>Selected Channel:</span><strong>${activeTestOrder.paymentMethod}</strong></div>
    <div class="flex justify-between text-sm text-[#1B998B] pt-1 border-t border-gray-300">
      <span>Amount Due:</span><strong>₱${activeTestOrder.totalAmount.toFixed(2)}</strong>
    </div>
  `;
  document.getElementById('paymongoModal').classList.remove('hidden');
}

async function resolveTestPayment(outcome) {
  if (!activeTestOrder) return;
  await fetch(`/api/orders/${activeTestOrder.id}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outcome })
  });

  document.getElementById('paymongoModal').classList.add('hidden');

  if (outcome === 'success') {
    cart = [];
    saveCart();
    showBanner(
      `✅ PayMongo Test Payment Approved for ${activeTestOrder.id}! Order status updated to Paid.`,
      'success'
    );
  } else {
    showBanner(
      `❌ PayMongo Test Payment Declined for ${activeTestOrder.id}. Order saved as Pending so you can retry payment.`,
      'error'
    );
  }

  await fetchProducts();
  switchTab('orders');
}

// Order Tracking & Status Updates
async function loadOrders() {
  const query = currentUser ? `?userId=${currentUser.id}` : '';
  const res = await fetch(`/api/orders${query}`);
  const data = await res.json();
  let orders = data.orders || [];

  if (selectedOrderFilter !== 'All') {
    orders = orders.filter(o => o.orderStatus === selectedOrderFilter);
  }

  const container = document.getElementById('ordersList');
  if (!orders.length) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-gray-500">No orders found in this status tab.</div>`;
    return;
  }

  const stages = ['Pending', 'Paid', 'Preparing', 'Shipped', 'Completed'];

  container.innerHTML = orders
    .map(o => {
      const stageIdx = stages.indexOf(o.orderStatus);
      return `
      <div class="bg-white p-4 rounded-xl border-2 border-[#2E1F47] space-y-3">
        <div class="flex flex-wrap justify-between items-center gap-2 border-b pb-2">
          <div>
            <span class="font-bold text-sm">${o.id}</span>
            <span class="text-xs text-gray-500 ml-2">${new Date(o.createdAt).toLocaleString()}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold px-2.5 py-0.5 rounded border border-[#2E1F47] ${
              o.paymentStatus === 'Paid' ? 'bg-[#1B998B] text-white' : 'bg-[#FF6B6B] text-white'
            }">
              Payment: ${o.paymentStatus}
            </span>
            <span class="text-xs font-bold px-2.5 py-0.5 rounded border border-[#2E1F47] bg-[#FF9F1C]">
              Status: ${o.orderStatus}
            </span>
          </div>
        </div>

        <div class="text-xs space-y-1">
          ${o.items.map(i => `<div class="flex justify-between"><span>${i.qty}x ${i.name} (${i.seller})</span><span class="font-semibold">₱${(i.price * i.qty).toFixed(2)}</span></div>`).join('')}
          <div class="flex justify-between font-bold text-sm pt-1 border-t">
            <span>Total (incl. ₱45 shipping to ${o.deliveryAddress}):</span>
            <span class="text-[#1B998B]">₱${o.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <!-- Visual 5-Stage Order Tracker Bar -->
        <div class="grid grid-cols-5 gap-1 pt-2">
          ${stages
            .map(
              (st, idx) => `
            <div class="text-center p-1.5 rounded border border-[#2E1F47] text-[11px] font-bold ${
              idx <= stageIdx ? 'bg-[#1B998B] text-white' : 'bg-gray-100 text-gray-400'
            }">
              ${st}
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Seller/Demo Controls to Advance Order Status or Retry Failed Payment -->
        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-gray-600">Simulate Seller Status Update:</span>
            ${stages
              .map(
                st => `
              <button onclick="updateOrderStatus('${o.id}', '${st}')" class="px-2 py-0.5 rounded border border-[#2E1F47] ${ o.orderStatus === st ? 'bg-[#FF9F1C] font-bold' : 'bg-white' }">${st}</button>
            `
              )
              .join('')}
          </div>
          ${
            o.paymentStatus !== 'Paid'
              ? `<button onclick="retryOrderPayment('${o.id}')" class="island-btn bg-[#1B998B] text-white px-3 py-1 rounded-lg text-xs">Retry PayMongo Payment</button>`
              : ''
          }
        </div>
      </div>
    `;
    })
    .join('');
}

function filterOrders(status) {
  selectedOrderFilter = status;
  document.querySelectorAll('.order-tab').forEach(btn => {
    btn.classList.toggle('bg-[#FF9F1C]', btn.dataset.status === status);
    btn.classList.toggle('bg-white', btn.dataset.status !== status);
  });
  loadOrders();
}

async function updateOrderStatus(orderId, orderStatus) {
  await fetch(`/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderStatus })
  });
  loadOrders();
}

async function retryOrderPayment(orderId) {
  const res = await fetch('/api/orders');
  const data = await res.json();
  const order = (data.orders || []).find(o => o.id === orderId);
  if (!order) return;
  activeTestOrder = order;
  document.getElementById('paymongoOrderDetails').innerHTML = `
    <div class="flex justify-between"><span>Order ID:</span><strong>${order.id}</strong></div>
    <div class="flex justify-between"><span>Total Due:</span><strong>₱${order.totalAmount.toFixed(2)}</strong></div>
  `;
  document.getElementById('paymongoModal').classList.remove('hidden');
}

// External Maps & OpenStreetMap Nominatim Geocoding API Integration
async function geocodeAddressString(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
  } catch (e) {
    console.warn('Geocoding fallback used:', e);
  }
  return { lat: 9.6477, lng: 123.8554, displayName: address };
}

function initMap() {
  if (!mapInstance) {
    mapInstance = L.map('islandMap').setView([9.68, 123.95], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);
  }
  setTimeout(() => mapInstance.invalidateSize(), 150);
  renderMapPins();
}

function renderMapPins() {
  if (!mapInstance) return;
  mapMarkers.forEach(m => mapInstance.removeLayer(m));
  mapMarkers = [];

  allProducts.forEach(p => {
    const marker = L.marker([p.lat, p.lng])
      .addTo(mapInstance)
      .bindPopup(`<strong>🏪 ${p.seller}</strong><br/>${p.name} (₱${p.price})<br/>📍 ${p.location}`);
    mapMarkers.push(marker);
  });

  if (currentUser && currentUser.lat && currentUser.lng) {
    const userMarker = L.marker([currentUser.lat, currentUser.lng])
      .addTo(mapInstance)
      .bindPopup(`<strong>🏠 Delivery Address (${currentUser.fullName})</strong><br/>${currentUser.deliveryAddress}`);
    mapMarkers.push(userMarker);
  }
}

async function geocodeCustomerAddress() {
  const input = document.getElementById('geocodeInput').value.trim();
  if (!input) return;
  const statusEl = document.getElementById('geocodeStatus');
  statusEl.textContent = 'Converting address via Geocoding API...';

  const coords = await geocodeAddressString(input);
  statusEl.textContent = `📌 Geocoded Coordinates: [${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}] — ${coords.displayName}`;

  if (mapInstance) {
    mapInstance.setView([coords.lat, coords.lng], 13);
    const marker = L.marker([coords.lat, coords.lng])
      .addTo(mapInstance)
      .bindPopup(`<strong>📦 Pinned Delivery Location</strong><br/>${coords.displayName}`)
      .openPopup();
    mapMarkers.push(marker);
  }
}

function focusSellerOnMap(lat, lng, sellerName) {
  switchTab('map');
  setTimeout(() => {
    if (mapInstance) {
      mapInstance.setView([lat, lng], 13);
      L.popup()
        .setLatLng([lat, lng])
        .setContent(`<strong>🏪 ${sellerName}</strong><br/>Verified Local Island Seller`)
        .openOn(mapInstance);
    }
  }, 250);
}

// Navigation Tabs
function switchTab(tab) {
  ['shop', 'map', 'orders'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== tab);
  });
  if (tab === 'map') initMap();
  if (tab === 'orders') loadOrders();
}

// User Authentication
function updateAuthUI() {
  const btn = document.getElementById('authBtn');
  if (currentUser) {
    btn.textContent = `👤 ${currentUser.fullName.split(' ')[0]} (Logout)`;
    btn.onclick = () => {
      currentUser = null;
      localStorage.removeItem('islandbox_user');
      updateAuthUI();
    };
  } else {
    btn.textContent = 'Login / Register';
    btn.onclick = openAuthModal;
  }
}

function openAuthModal() {
  document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function toggleAuthMode(mode) {
  const isReg = mode === 'register';
  document.getElementById('loginForm').classList.toggle('hidden', isReg);
  document.getElementById('registerForm').classList.toggle('hidden', !isReg);
  document.getElementById('authModalTitle').textContent = isReg ? 'Create IslandBox Account' : 'Customer Login';
}

async function submitLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) return alert(data.error);

  currentUser = data.user;
  localStorage.setItem('islandbox_user', JSON.stringify(currentUser));
  updateAuthUI();
  closeAuthModal();
}

async function submitRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const contactNumber = document.getElementById('regContact').value;
  const deliveryAddress = document.getElementById('regAddress').value;
  
  // 1. Grab the selected account role from the dropdown
  const roleEl = document.getElementById('regRole');
  const role = roleEl ? roleEl.value : 'customer';

  // 2. Convert address to geographic coordinates using the Geocoding API
  const geo = await geocodeAddressString(deliveryAddress);

  // 3. Send the registration data including the 'role' to the server
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName,
      email,
      password,
      role, // <-- Pass the role here!
      contactNumber,
      deliveryAddress,
      lat: geo.lat,
      lng: geo.lng
    })
  });

  const data = await res.json();
  if (!res.ok) return alert(data.error);

  currentUser = data.user;
  localStorage.setItem('islandbox_user', JSON.stringify(currentUser));
  updateAuthUI();
  closeAuthModal();
  
  showBanner(`🎉 Welcome to IslandBox, ${currentUser.fullName}! Logged in as ${currentUser.role.toUpperCase()}.`, 'success');
}

// Seller Modal Functions
function openSellerModal() {
  if (!currentUser) {
    alert('Please log in with a Seller Account (e.g., seller@islandbox.ph / sellerpassword) or register as a Local Seller to list products.');
    openAuthModal();
    return;
  }
  if (currentUser.role && currentUser.role !== 'seller') {
    alert('Your current account is registered as a Customer. Please log in with a Local Seller account to add products.');
    return;
  }

  // Auto-fill the Seller's business name and location from their account
  document.getElementById('prodSeller').value = currentUser.fullName || '';
  document.getElementById('prodLocation').value = currentUser.deliveryAddress || '';
  document.getElementById('sellerModal').classList.remove('hidden');
}

function closeSellerModal() {
  document.getElementById('sellerModal').classList.add('hidden');
}

async function submitNewProduct(e) {
  e.preventDefault();
  const locationText = document.getElementById('prodLocation').value;
  const geo = await geocodeAddressString(locationText);

  const payload = {
    name: document.getElementById('prodName').value,
    category: document.getElementById('prodCategory').value,
    price: document.getElementById('prodPrice').value,
    quantity: document.getElementById('prodQty').value,
    seller: document.getElementById('prodSeller').value,
    location: locationText,
    lat: geo.lat,
    lng: geo.lng,
    image: document.getElementById('prodImage').value,
    description: document.getElementById('prodDesc').value
  };

  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeSellerModal();
    await fetchProducts();
    showBanner(`🏪 New local product "${payload.name}" listed and pinned to the Seller Map!`, 'success');
  }
}
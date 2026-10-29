import React, { useState, useEffect } from 'react';
import { Store, Plus, Package, Edit, Trash2, MapPin, DollarSign, CheckCircle2, Truck, Clock } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Add Product
  const [modalOpen, setModalOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [availableQuantity, setAvailableQuantity] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchSellerData = async () => {
    try {
      setLoading(true);
      const [profRes, prodRes, ordRes, catRes] = await Promise.all([
        api.get('/sellers/profile/me'),
        api.get(`/products?seller_id=${user.seller?.seller_id}`),
        api.get('/orders/seller/orders'),
        api.get('/products/categories'),
      ]);

      setProfile(profRes.data.profile);
      setProducts(prodRes.data.products || []);
      setOrders(ordRes.data.orders || []);
      setCategories(catRes.data.categories || []);
      if (catRes.data.categories?.length > 0) {
        setCategoryId(catRes.data.categories[0].id);
      }
    } catch (err) {
      console.error('Failed to load seller dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, [user]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setSavingProduct(true);
      setFormError('');

      await api.post('/products', {
        name: productName.trim(),
        category_id: parseInt(categoryId, 10),
        price: parseFloat(price),
        available_quantity: parseInt(availableQuantity, 10),
        image_url: imageUrl.trim() || undefined,
        description: description.trim(),
      });

      setModalOpen(false);
      setProductName('');
      setPrice('');
      setAvailableQuantity('');
      setImageUrl('');
      setDescription('');
      await fetchSellerData();
    } catch (err) {
      setFormError(err.message || 'Failed to list product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (window.confirm('Are you sure you want to remove or archive this product listing?')) {
      try {
        await api.delete(`/products/${prodId}`);
        await fetchSellerData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleUpdateFulfillment = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/fulfillment`, { fulfillment_status: newStatus });
      await fetchSellerData();
    } catch (err) {
      alert(err.message || 'Failed to update order status.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Artisan Management Portal</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {profile?.business_name || 'My Artisan Workshop'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            📍 {profile?.business_address} &bull; Coordinates: {profile?.latitude}, {profile?.longitude}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 self-start sm:self-auto transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>List New Product</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Active Catalog Items
          </span>
          <span className="text-3xl font-black text-slate-900 mt-2 block">
            {products.length}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            Listed on Bohol public catalog
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Workshop Orders Received
          </span>
          <span className="text-3xl font-black text-slate-900 mt-2 block">
            {orders.length}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            Customer order dispatches
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Revenue Settled (PHP)
          </span>
          <span className="text-3xl font-black text-slate-900 mt-2 block">
            &#8369;{parseFloat(profile?.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
            Settled via PayMongo gateway
          </span>
        </div>
      </div>

      {/* Incoming Orders Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Incoming Customer Orders ({orders.length})
            </h2>
            <p className="text-xs text-slate-500">
              Advance order statuses as you craft, pack, and hand off goods to delivery couriers.
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center italic">
            No incoming customer orders yet.
          </p>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => (
              <div
                key={ord.id}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">{ord.order_reference}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase">
                      Payment: {ord.payment_status}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold uppercase">
                      Fulfillment: {ord.fulfillment_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Customer: <strong>{ord.recipient_name}</strong> &bull; {ord.delivery_address}
                  </p>
                  <div className="mt-2 text-xs text-slate-500">
                    {ord.seller_items?.map((it) => (
                      <span key={it.id} className="inline-block mr-3">
                        &bull; {it.product_name_snapshot} (Qty: {it.quantity}) - &#8369;{parseFloat(it.subtotal).toFixed(2)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Fulfillment Status Buttons */}
                <div className="flex items-center gap-2 self-end lg:self-center">
                  {ord.fulfillment_status === 'paid' && (
                    <button
                      onClick={() => handleUpdateFulfillment(ord.id, 'preparing')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
                    >
                      Start Preparing
                    </button>
                  )}
                  {ord.fulfillment_status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateFulfillment(ord.id, 'shipped')}
                      className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl text-xs font-bold"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  {ord.fulfillment_status === 'shipped' && (
                    <button
                      onClick={() => handleUpdateFulfillment(ord.id, 'completed')}
                      className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workshop Product Inventory Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900">
          My Listed Products ({products.length})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
              <div>
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-full h-40 object-cover rounded-xl bg-slate-100 mb-3"
                />
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  {p.category_name}
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{p.name}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Price / Stock</span>
                  <span className="text-sm font-bold text-slate-900">
                    &#8369;{parseFloat(p.price).toFixed(2)} &bull; {p.available_quantity} left
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Archive Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 sm:p-8 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">List New Island Product</h3>

            {formError && (
              <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">{formError}</p>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Bohol Coconut Shell Souvenir"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Price (PHP) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="180.00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Available Quantity *</label>
                  <input
                    type="number"
                    required
                    value={availableQuantity}
                    onChange={(e) => setAvailableQuantity(e.target.value)}
                    placeholder="50"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Image URL</label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the cultural story and craftsmanship of this product..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-800 disabled:opacity-50"
                >
                  {savingProduct ? 'Saving...' : 'List Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


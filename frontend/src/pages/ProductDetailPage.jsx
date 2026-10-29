import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, ShoppingBag, Check, ShieldCheck, Truck, ChevronLeft, ArrowRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const artisanPin = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.product);
      } catch (err) {
        setError(err.message || 'Product not found.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setAdding(true);
      setActionError('');
      await addToCart(product.id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading product details & artisan location...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">{error || 'This product might have been removed.'}</p>
        <Link
          to="/products"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const lat = parseFloat(product.latitude) || 9.6444;
  const lng = parseFloat(product.longitude) || 123.8558;
  const isOutOfStock = product.available_quantity <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <Link to="/" className="hover:text-slate-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-slate-600">Products</Link>
        <span>/</span>
        <span className="text-slate-700 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image Section */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-4 left-4 px-3 py-1.5 bg-white/95 backdrop-blur-xs text-xs font-bold text-slate-800 rounded-full shadow-xs">
              {product.category_name}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-600">
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="block font-bold text-slate-800">Authentic</span>
              <span className="text-[10px] text-slate-400">Philippine Made</span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="block font-bold text-slate-800">Direct From</span>
              <span className="text-[10px] text-slate-400">{product.island_region}</span>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="block font-bold text-slate-800">Safe Payment</span>
              <span className="text-[10px] text-slate-400">PayMongo Verified</span>
            </div>
          </div>
        </div>

        {/* Product Info & Actions */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>{product.business_name} &bull; {product.island_region}</span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-4 pt-2">
              <span className="text-3xl font-black text-slate-900">
                &#8369;{parseFloat(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                {isOutOfStock ? 'Sold Out' : `${product.available_quantity} available in stock`}
              </span>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed pt-2">
              {product.description}
            </p>
          </div>

          {/* Add to Cart Controls */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quantity:</span>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={qty <= 1 || isOutOfStock}
                  className="px-3.5 py-2 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-40"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-bold text-slate-900 min-w-[3rem] text-center">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(Math.min(product.available_quantity, qty + 1))}
                  disabled={qty >= product.available_quantity || isOutOfStock}
                  className="px-3.5 py-2 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <div className="ml-auto text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Subtotal</span>
                <span className="text-base font-bold text-slate-900">
                  &#8369;{(parseFloat(product.price) * qty).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                added
                  ? 'bg-emerald-600 text-white'
                  : isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {added ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Added to Cart!</span>
                </>
              ) : adding ? (
                <span>Adding to Cart...</span>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>Add to Cart &bull; &#8369;{(parseFloat(product.price) * qty).toFixed(2)}</span>
                </>
              )}
            </button>

            {actionError && (
              <p className="text-xs text-rose-600 font-medium text-center">{actionError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Seller Location & Leaflet Interactive Map */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Artisan Origin Location</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {product.business_name}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              📍 {product.business_address}
            </p>
          </div>

          <Link
            to={`/products?seller_id=${product.seller_id}`}
            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold self-start sm:self-auto transition-colors flex items-center gap-1.5"
          >
            <span>View All Seller's Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          {product.business_description || 'Small community producer dedicated to preserving traditional Boholano handicrafts, weaving, and native confectionery.'}
        </p>

        {/* Leaflet Map for Seller */}
        <div className="h-80 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
          <MapContainer
            center={[lat, lng]}
            zoom={13}
            scrollWheelZoom={false}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} icon={artisanPin}>
              <Popup>
                <div className="p-2 text-xs">
                  <strong className="block text-slate-900">{product.business_name}</strong>
                  <span className="text-slate-600">{product.business_address}</span>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </section>
    </div>
  );
}


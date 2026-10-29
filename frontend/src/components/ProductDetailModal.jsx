import React, { useState } from 'react';
import { X, MapPin, ShoppingBag, Check, ShieldCheck, Truck, ChevronRight } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const artisanPin = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function ProductDetailModal({ product, onClose }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!product) return null;

  const lat = parseFloat(product.latitude) || 9.6444;
  const lng = parseFloat(product.longitude) || 123.8558;
  const isOutOfStock = product.available_quantity <= 0;

  const handleAddToCart = async () => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      setAdding(true);
      setErrorMsg('');
      await addToCart(product.id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-white/90 hover:bg-white text-slate-500 hover:text-slate-800 rounded-full shadow-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Product Photo & Details */}
          <div className="p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
            <div>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-inner mb-6">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-xs text-xs font-bold text-slate-800 rounded-full shadow-xs">
                  {product.category_name}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 mb-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{product.business_name} &bull; {product.island_region}</span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {product.name}
              </h2>

              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                {product.description}
              </p>

              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>100% Authentic Island Made</span>
                </div>
                <div className="flex items-center gap-1">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Direct from Bohol</span>
                </div>
              </div>
            </div>

            {/* Price & Quantity Add */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-baseline justify-between mb-4">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Price (PHP)</span>
                  <span className="text-2xl font-extrabold text-slate-900">
                    &#8369;{parseFloat(product.price).toFixed(2)}
                  </span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                  {product.available_quantity} in stock
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1 || isOutOfStock}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 text-sm font-semibold text-slate-800 min-w-[2.5rem] text-center">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(Math.min(product.available_quantity, qty + 1))}
                    disabled={qty >= product.available_quantity || isOutOfStock}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || adding}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md ${
                    added
                      ? 'bg-emerald-600 text-white'
                      : isOutOfStock
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to Cart</span>
                    </>
                  ) : adding ? (
                    <span>Adding...</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart &bull; &#8369;{(parseFloat(product.price) * qty).toFixed(2)}</span>
                    </>
                  )}
                </button>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-600 mt-2 font-medium">{errorMsg}</p>
              )}
            </div>
          </div>

          {/* Right Column: Seller Profile & Interactive Leaflet Map */}
          <div className="p-6 md:p-8 bg-slate-50/70 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Artisan Seller Workshop
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Verified Local Maker
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs mb-4">
                <h4 className="font-bold text-slate-900 text-base">{product.business_name}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {product.business_description || 'Authentic community craft producer based in Bohol.'}
                </p>
                <p className="text-xs text-slate-600 mt-2 font-medium flex items-start gap-1.5">
                  <span className="text-slate-400">Address:</span>
                  <span>{product.business_address}</span>
                </p>
              </div>

              {/* Leaflet Map Card */}
              <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
                <MapContainer
                  center={[lat, lng]}
                  zoom={12}
                  scrollWheelZoom={false}
                  className="w-full h-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[lat, lng]} icon={artisanPin}>
                    <Popup>
                      <div className="p-2 text-xs">
                        <strong className="block text-slate-900">{product.business_name}</strong>
                        <span className="text-slate-500">{product.business_address}</span>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
              <Link
                to={`/products?seller_id=${product.seller_id}`}
                onClick={onClose}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
              >
                Explore more from this artisan
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


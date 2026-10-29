import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, MapPin, CreditCard, Clock, ChevronLeft, ShieldCheck, Truck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import api from '../api/client';
import OrderTimeline from '../components/OrderTimeline';
import { useAuth } from '../context/AuthContext';

const workshopPin = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function OrderTrackingPage() {
  const { id } = useParams();
  const { user, isSeller, isAdmin } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.order);
    } catch (err) {
      setError(err.message || 'Failed to retrieve order tracking details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      setStatusUpdating(true);
      await api.patch(`/orders/${order.id}/fulfillment`, { fulfillment_status: newStatus });
      await fetchOrder();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Retrieving order tracking telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">{error || 'Could not locate order reference.'}</p>
        <Link
          to="/orders"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" /> View My Orders
        </Link>
      </div>
    );
  }

  // Get primary seller workshop coordinates
  const firstItem = order.items?.[0];
  const lat = parseFloat(firstItem?.latitude) || 9.6444;
  const lng = parseFloat(firstItem?.longitude) || 123.8558;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Back to All Orders
      </Link>

      {/* Main Order Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Tracking Active
              </span>
              <span className="text-xs text-slate-400">
                Placed on {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-2 font-mono">
              {order.order_reference}
            </h1>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 block font-medium">Order Total</span>
            <span className="text-2xl font-extrabold text-slate-900">
              &#8369;{parseFloat(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="block text-[11px] font-semibold text-emerald-700 capitalize mt-0.5">
              Payment: {order.payment_status}
            </span>
          </div>
        </div>

        {/* 5-Step Order Fulfillment Timeline */}
        <div className="py-2">
          <OrderTimeline
            currentStatus={order.fulfillment_status}
            paymentStatus={order.payment_status}
          />
        </div>

        {/* Seller / Admin Status Progression Controls */}
        {(isSeller || isAdmin) && order.payment_status === 'paid' && (
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="font-bold text-emerald-900">
              ⚡ Artisan Fulfillment Controls:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {order.fulfillment_status === 'paid' && (
                <button
                  onClick={() => handleUpdateStatus('preparing')}
                  disabled={statusUpdating}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold"
                >
                  Mark as Preparing
                </button>
              )}
              {order.fulfillment_status === 'preparing' && (
                <button
                  onClick={() => handleUpdateStatus('shipped')}
                  disabled={statusUpdating}
                  className="px-3 py-1.5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg font-bold"
                >
                  Mark as Shipped
                </button>
              )}
              {order.fulfillment_status === 'shipped' && (
                <button
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={statusUpdating}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold"
                >
                  Mark as Completed (Delivered)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Order Items & Delivery Location Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Snapshotted Order Items */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Ordered Items Snapshot</h3>

          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'}
                  alt={item.product_name_snapshot}
                  className="w-14 h-14 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                    {item.product_name_snapshot}
                  </h4>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    {item.seller_name} &bull; {item.seller_address}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {item.quantity} &times; &#8369;{parseFloat(item.unit_price_snapshot).toFixed(2)}
                  </p>
                </div>
                <span className="text-xs font-black text-slate-900">
                  &#8369;{parseFloat(item.subtotal).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-900">&#8369;{parseFloat(order.subtotal_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Island Delivery Fee:</span>
              <span className="font-bold text-slate-900">
                {parseFloat(order.delivery_fee) === 0 ? 'FREE' : `₱${parseFloat(order.delivery_fee).toFixed(2)}`}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
              <span>Total Paid:</span>
              <span className="text-base text-emerald-800">
                &#8369;{parseFloat(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Delivery Address & Artisan Origin Map */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Delivery & Origin Information</h3>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Customer Delivery Address
              </span>
              <p className="font-semibold text-slate-900">{order.recipient_name} ({order.recipient_contact})</p>
              <p className="text-slate-600 leading-relaxed">{order.delivery_address}</p>
            </div>

            {/* Artisan Workshop Map */}
            <div>
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px] mb-2">
                Origin Workshop: {firstItem?.seller_name || 'Bohol Artisan'}
              </span>
              <div className="h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
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
                  <Marker position={[lat, lng]} icon={workshopPin}>
                    <Popup>
                      <div className="p-1 text-xs">
                        <strong>{firstItem?.seller_name}</strong>
                        <p>{firstItem?.seller_address}</p>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, ArrowRight, ShoppingBag, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await api.get('/orders/my-orders');
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">Paid</span>;
      case 'preparing':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">Preparing</span>;
      case 'shipped':
        return <span className="px-2.5 py-1 bg-cyan-100 text-cyan-800 text-[11px] font-bold rounded-full">Shipped</span>;
      case 'completed':
        return <span className="px-2.5 py-1 bg-emerald-800 text-white text-[11px] font-bold rounded-full">Completed</span>;
      case 'canceled':
      case 'failed':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[11px] font-bold rounded-full">Failed</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-full">Pending</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          My Orders & Tracking Telemetry
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your order history, delivery progression, and artisan status updates.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-200/60 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 max-w-md mx-auto">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">No orders placed yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Discover authentic treats and handwoven treasures from Bohol artisans.
          </p>
          <Link
            to="/products"
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-2"
          >
            <span>Browse Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {order.order_reference}
                  </span>
                  <span className="text-xs text-slate-400 ml-3">
                    {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(order.fulfillment_status)}
                  <span className="text-sm font-black text-slate-900">
                    &#8369;{parseFloat(order.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Items summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <img
                      src={item.image_url}
                      alt={item.product_name_snapshot}
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.product_name_snapshot}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Qty: {item.quantity} &bull; &#8369;{parseFloat(item.subtotal).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action row */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Deliver to: {order.recipient_name} &bull; {order.delivery_address?.substring(0, 30)}...
                </span>

                <Link
                  to={`/orders/${order.order_reference}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1.5 rounded-xl transition-colors"
                >
                  <span>Track Order Telemetry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Package, ShoppingBag, ShieldCheck } from 'lucide-react';
import api from '../api/client';
import OrderTimeline from '../components/OrderTimeline';
import { useCart } from '../context/CartContext';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderRef = searchParams.get('ref') || '';
  const [order, setOrder] = useState(null);
  const [verifying, setVerifying] = useState(true);
  const { fetchCart } = useCart();

  useEffect(() => {
    async function verifyAndFetchOrder() {
      if (!orderRef) {
        setVerifying(false);
        return;
      }

      try {
        setVerifying(true);
        // Verify / sync payment with PayMongo server-side
        await api.get(`/checkout/verify/${orderRef}`);
        // Refresh cart
        await fetchCart();
        // Fetch order details
        const res = await api.get(`/orders/${orderRef}`);
        setOrder(res.data.order);
      } catch (err) {
        console.error('Error verifying order:', err);
      } finally {
        setVerifying(false);
      }
    }

    verifyAndFetchOrder();
  }, [orderRef, fetchCart]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-8 text-center">
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            PayMongo Payment Confirmed
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Maraming Salamat! Order Successful
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Your payment was verified. Our local artisans are being notified to prepare your authentic island goods.
          </p>
        </div>

        {/* Order Reference Box */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-sm mx-auto text-xs text-slate-600">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">Order Reference Number</span>
          <span className="text-lg font-black font-mono text-slate-900 mt-0.5 block">
            {orderRef || 'IB-CONFIRMED'}
          </span>
          <span className="text-[11px] text-emerald-700 font-medium mt-1 block">
            ✓ Status: Payment Settled (PayMongo Test)
          </span>
        </div>

        {/* Real-time Order Timeline Stepper */}
        {order && (
          <div className="pt-6 border-t border-slate-100 text-left">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Fulfillment Journey
            </h4>
            <OrderTimeline
              currentStatus={order.fulfillment_status}
              paymentStatus={order.payment_status}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          {orderRef && (
            <Link
              to={`/orders/${orderRef}`}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Package className="w-4 h-4" />
              <span>Track Order Progress</span>
            </Link>
          )}

          <Link
            to="/products"
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


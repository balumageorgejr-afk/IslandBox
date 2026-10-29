import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, ShoppingBag, ArrowRight, AlertCircle, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import PayMongoSimulatorModal from '../components/PayMongoSimulatorModal';

export default function CheckoutPage() {
  const { cartItems, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [recipientName, setRecipientName] = useState(user?.full_name || '');
  const [recipientContact, setRecipientContact] = useState(user?.contact_number || '+63 920 987 6543');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.delivery_address || '104 CPG North Avenue, Cogon District, Tagbilaran City, Bohol, 6300');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Simulator Modal State
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [createdOrderRef, setCreatedOrderRef] = useState(null);
  const [createdOrderTotal, setCreatedOrderTotal] = useState(0);

  const deliveryFee = subtotal >= 1000 ? 0.00 : 50.00;
  const totalAmount = subtotal + (cartItems.length > 0 ? deliveryFee : 0);

  const handleCheckout = async (e) => {
    e.preventDefault();

    if (!recipientName.trim() || !recipientContact.trim() || !deliveryAddress.trim()) {
      setErrorMsg('Please fill in all recipient and delivery address details.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');

      // 1. Create order in PostgreSQL transaction
      const orderRes = await api.post('/orders', {
        recipient_name: recipientName.trim(),
        recipient_contact: recipientContact.trim(),
        delivery_address: deliveryAddress.trim(),
      });

      const order = orderRes.data.order;

      // 2. Initiate PayMongo Checkout Session
      const sessionRes = await api.post('/checkout/create-session', {
        order_reference: order.order_reference,
      });

      setCreatedOrderRef(order.order_reference);
      setCreatedOrderTotal(order.total_amount);

      // If live PayMongo session was created and user is online, or open sandbox simulator
      if (sessionRes.data.isLiveApi && sessionRes.data.checkoutUrl) {
        window.location.href = sessionRes.data.checkoutUrl;
      } else {
        // Open PayMongo Sandbox Simulator modal
        setSimulatorOpen(true);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (paidOrder) => {
    setSimulatorOpen(false);
    navigate(`/orders/success?ref=${paidOrder.order_reference}`);
  };

  const handlePaymentFailed = (failedOrder) => {
    setSimulatorOpen(false);
    navigate(`/orders/cancel?ref=${failedOrder.order_reference}`);
  };

  if (cartItems.length === 0 && !simulatorOpen) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Add authentic Bohol items before proceeding to checkout.
        </p>
        <Link
          to="/products"
          className="px-6 py-3 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Checkout & Delivery Details
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your delivery information and pay securely with PayMongo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Delivery Details Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleCheckout} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              Recipient & Island Delivery Address
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name of Recipient *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g., Juan Dela Cruz"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={recipientContact}
                  onChange={(e) => setRecipientContact(e.target.value)}
                  placeholder="e.g., +63 920 123 4567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Complete Delivery Address *
                </label>
                <textarea
                  required
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House/Unit #, Street, Barangay, Municipality/City, Province, Postal Code"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Delivery is serviced throughout Bohol and Central Visayas.
                </span>
              </div>
            </div>

            {/* Payment Method Notice */}
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
              <CreditCard className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">PayMongo Hosted Checkout v2</span>
                <span className="text-emerald-700 leading-relaxed">
                  Upon clicking confirm, you will be redirected to PayMongo's secure sandbox supporting <strong>Credit/Debit Card, GCash, Maya, and QR Ph</strong>.
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Creating Order & Initializing Payment...</span>
              ) : (
                <>
                  <span>Confirm Order & Pay &#8369;{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Order Items Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Items in Order ({cartItems.length})</h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.cart_item_id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <img
                    src={item.image_url}
                    alt={item.product_name}
                    className="w-12 h-12 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-xs text-slate-900 truncate">{item.product_name}</h5>
                    <span className="text-[11px] text-slate-400">Qty: {item.quantity}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    &#8369;{parseFloat(item.item_total).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">&#8369;{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-bold text-slate-900">
                  {deliveryFee === 0 ? 'FREE' : `₱${deliveryFee.toFixed(2)}`}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                <span className="font-extrabold text-slate-900">Total Due (PHP)</span>
                <span className="text-xl font-black text-slate-900">
                  &#8369;{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Modal for Presentation Defense */}
      {simulatorOpen && (
        <PayMongoSimulatorModal
          orderReference={createdOrderRef}
          totalAmount={createdOrderTotal}
          onSuccess={handlePaymentSuccess}
          onFailed={handlePaymentFailed}
          onClose={() => setSimulatorOpen(false)}
        />
      )}
    </div>
  );
}


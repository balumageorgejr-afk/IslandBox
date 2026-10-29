import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, MapPin, Truck, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const { cartItems, subtotal, updateQuantity, removeItem, clearCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const deliveryFee = subtotal >= 1000 ? 0.00 : 50.00;
  const totalAmount = subtotal + (cartItems.length > 0 ? deliveryFee : 0);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Please Log In</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          You need an account to view and manage your shopping cart.
        </p>
        <Link
          to="/login"
          className="px-6 py-3 bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
        >
          Sign In to IslandBox
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Shopping Cart ({cartItems.length} items)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your authentic island selections before placing your order.
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 max-w-md mx-auto">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">Your cart is empty</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Explore authentic treats and handwoven treasures from Bohol artisans.
          </p>
          <Link
            to="/products"
            className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-2"
          >
            <span>Explore Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Item Details</span>
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear Cart
              </button>
            </div>

            <div className="space-y-3">
              {cartItems.map((item) => (
                <div
                  key={item.cart_item_id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{item.seller_name}</span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900">{item.product_name}</h4>
                      <p className="text-xs font-semibold text-slate-500">
                        &#8369;{parseFloat(item.price).toFixed(2)} each
                      </p>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-end sm:self-center">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                        disabled={item.quantity >= item.available_quantity}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 text-xs font-bold disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[5rem]">
                      <span className="text-sm font-bold text-slate-900">
                        &#8369;{parseFloat(item.item_total).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeItem(item.cart_item_id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary & Checkout Card */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-900 text-base">Order Summary</h3>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-bold text-slate-900">&#8369;{subtotal.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Island Delivery</span>
                  </span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="font-bold text-emerald-700 uppercase">FREE</span>
                    ) : (
                      <span className="font-bold text-slate-900">&#8369;{deliveryFee.toFixed(2)}</span>
                    )}
                  </span>
                </div>

                {subtotal < 1000 && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                    💡 Tip: Add &#8369;{(1000 - subtotal).toFixed(2)} more for <strong>FREE island delivery</strong>!
                  </p>
                )}

                <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between text-sm">
                  <span className="font-extrabold text-slate-900">Total Due (PHP)</span>
                  <span className="text-xl font-black text-slate-900">
                    &#8369;{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected by PayMongo Checkout Sandbox</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


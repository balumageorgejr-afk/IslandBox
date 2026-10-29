import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, RefreshCw, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function OrderCancelPage() {
  const [searchParams] = useSearchParams();
  const orderRef = searchParams.get('ref') || '';

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <XCircle className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Payment Incomplete
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-3 tracking-tight">
            Checkout Was Not Completed
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            The transaction was canceled or did not process. No funds were deducted from your test card or wallet.
          </p>
        </div>

        {orderRef && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
            <span>Reference: </span>
            <span className="font-mono font-bold text-slate-800">{orderRef}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Link
            to="/cart"
            className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Return to Cart & Retry Payment</span>
          </Link>

          <Link
            to="/products"
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Browsing Products</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


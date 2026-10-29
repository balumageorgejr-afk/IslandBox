import React, { useState } from 'react';
import { CreditCard, CheckCircle2, XCircle, Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../api/client';

export default function PayMongoSimulatorModal({ orderReference, totalAmount, onSuccess, onFailed, onClose }) {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSimulate = async (outcome) => {
    try {
      setProcessing(true);
      setErrorMsg('');
      const res = await api.post('/checkout/simulate', {
        order_reference: orderReference,
        outcome,
      });

      if (outcome === 'success') {
        onSuccess && onSuccess(res.data.order);
      } else {
        onFailed && onFailed(res.data.order);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to simulate transaction.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* PayMongo Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight">PayMongo</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-700/80 uppercase font-semibold tracking-wider">
                Sandbox Test Mode
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-emerald-200 hover:text-white transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xs text-emerald-200">Amount Due:</span>
            <span className="text-2xl font-black">
              &#8369;{parseFloat(totalAmount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-emerald-300 mt-1">
            Order Reference: <span className="font-mono font-bold text-white">{orderReference}</span>
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Method Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Sandbox Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'card', name: 'Credit / Debit Card', badge: 'Visa/MC' },
                { id: 'gcash', name: 'GCash', badge: 'E-Wallet' },
                { id: 'maya', name: 'Maya', badge: 'E-Wallet' },
                { id: 'qrph', name: 'QR Ph', badge: 'Instant' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    selectedMethod === m.id
                      ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-800">{m.name}</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{m.badge}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Test Card Info Box */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Academic Demonstration Sandbox</span>
            </div>
            <p className="text-[11px] text-slate-500">
              This interactive test runner tests both successful payment and failed payment flows mandated by the proposal.
            </p>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
          )}

          {/* Action Simulation Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleSimulate('success')}
              disabled={processing}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Simulate Successful Payment ({selectedMethod.toUpperCase()})</span>
            </button>

            <button
              onClick={() => handleSimulate('failed')}
              disabled={processing}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>Simulate Payment Failure (Testing Error Boundary)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


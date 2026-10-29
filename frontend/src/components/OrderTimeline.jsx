import React from 'react';
import { Clock, CreditCard, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Awaiting payment verification', icon: Clock },
  { key: 'paid', label: 'Payment Confirmed', desc: 'PayMongo transaction verified', icon: CreditCard },
  { key: 'preparing', label: 'Artisan Preparing', desc: 'Crafting & packing goods', icon: Package },
  { key: 'shipped', label: 'Dispatched / In Transit', desc: 'En route to delivery address', icon: Truck },
  { key: 'completed', label: 'Delivered', desc: 'Order received successfully', icon: CheckCircle2 },
];

export default function OrderTimeline({ currentStatus = 'pending', paymentStatus = 'unpaid' }) {
  const isCanceled = currentStatus === 'canceled' || paymentStatus === 'failed';

  // Determine current step index
  let activeIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);
  if (activeIndex === -1) {
    if (paymentStatus === 'paid' && currentStatus === 'pending') {
      activeIndex = 1;
    } else {
      activeIndex = 0;
    }
  }

  if (isCanceled) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800">
        <AlertCircle className="w-6 h-6 flex-shrink-0 text-rose-600" />
        <div>
          <h4 className="font-bold text-sm">Order Canceled or Payment Failed</h4>
          <p className="text-xs text-rose-700 mt-0.5">
            This transaction was not completed. You may re-order items or contact seller support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Background Connecting Line */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 -z-0">
          <div
            className="h-full bg-emerald-600 transition-all duration-500 ease-out"
            style={{ width: `${(activeIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Nodes */}
        {STATUS_STEPS.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="flex flex-col items-center text-center z-10 w-24">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-emerald-700 text-white ring-4 ring-emerald-100 scale-110'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}
              >
                <StepIcon className="w-5 h-5" />
              </div>
              <span
                className={`text-xs mt-2 font-bold leading-tight ${
                  isCurrent ? 'text-emerald-800' : isDone ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 mt-0.5 max-w-[90px] leading-tight">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


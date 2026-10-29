import React, { useState, useEffect } from 'react';
import { Shield, DollarSign, Package, Store, Users, ShoppingBag } from 'lucide-react';
import api from '../api/client';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        const [ordRes, catRes, sellRes] = await Promise.all([
          api.get('/orders/admin/all'),
          api.get('/products/categories'),
          api.get('/sellers'),
        ]);
        setOrders(ordRes.data.orders || []);
        setCategories(catRes.data.categories || []);
        setSellers(sellRes.data.sellers || []);
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, []);

  const totalRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>Platform Administration & Supervision</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          IslandBox Platform Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tier 2 Governance Console: Monitor system transactions, artisan partnerships, and category taxonomies.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Sales</span>
          <span className="text-2xl font-black text-slate-900 mt-2 block">
            &#8369;{totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">PayMongo Settled</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Orders</span>
          <span className="text-2xl font-black text-slate-900 mt-2 block">{orders.length}</span>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Transactions logged</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Artisan Sellers</span>
          <span className="text-2xl font-black text-slate-900 mt-2 block">{sellers.length}</span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">Bohol/Visayas partners</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Categories</span>
          <span className="text-2xl font-black text-slate-900 mt-2 block">{categories.length}</span>
          <span className="text-[11px] text-slate-500 font-semibold mt-1 block">Product classifications</span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Recent Platform Transactions</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Fulfillment</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{ord.order_reference}</td>
                  <td className="py-3 px-4">{ord.customer_name} ({ord.customer_email})</td>
                  <td className="py-3 px-4 font-bold text-slate-900">&#8369;{parseFloat(ord.total_amount).toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      ord.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {ord.payment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-800">
                      {ord.fulfillment_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(ord.created_at).toLocaleDateString('en-PH')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


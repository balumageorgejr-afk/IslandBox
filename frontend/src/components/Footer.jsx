import React from 'react';
import { ShoppingBag, Heart, ShieldCheck, Truck, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Core Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-950/80 border border-emerald-700/40 rounded-xl text-emerald-400">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Direct Artisan Support</h4>
              <p className="text-sm text-slate-400 mt-1">
                Empowering small cottage industries and indigenous weavers across Bohol and Central Visayas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-950/80 border border-emerald-700/40 rounded-xl text-emerald-400">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white">Interactive Location Transparency</h4>
              <p className="text-sm text-slate-400 mt-1">
                Pinpoint genuine workshop origins using integrated OpenStreetMap & Geoapify geocoding.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-950/80 border border-emerald-700/40 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white">PayMongo Secure Payments</h4>
              <p className="text-sm text-slate-400 mt-1">
                Philippine-native checkout sandbox supporting Cards, GCash, Maya, and QR Ph.
              </p>
            </div>
          </div>
        </div>

        {/* Links and Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-12">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">IslandBox</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Academic capstone project developed for the Systems Integration and Architecture (SIA) Course, Group 1. Demonstrating multi-tier enterprise integration: React 18, Node.js REST API, PostgreSQL relational database, and PayMongo payment gateway.
            </p>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Explore</h5>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/products" className="hover:text-emerald-400 transition-colors">All Local Products</Link></li>
              <li><Link to="/map" className="hover:text-emerald-400 transition-colors">Artisans Map</Link></li>
              <li><Link to="/products?category=local-snacks" className="hover:text-emerald-400 transition-colors">Local Delicacies</Link></li>
              <li><Link to="/products?category=handicrafts" className="hover:text-emerald-400 transition-colors">Bohol Basketry</Link></li>
              <li><Link to="/products?category=souvenirs" className="hover:text-emerald-400 transition-colors">Island Keepsakes</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Architecture</h5>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Node.js 24 + Express</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>PostgreSQL 18 Service</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Leaflet + OpenStreetMap</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>PayMongo Hosted Checkout v2</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; 2026 IslandBox &bull; Systems Integration and Architecture (SIA) Capstone Group 1. All rights reserved.</p>
          <p>Map tiles &copy; OpenStreetMap contributors &bull; Geocoding by Geoapify</p>
        </div>
      </div>
    </footer>
  );
}


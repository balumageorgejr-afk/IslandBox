import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Store, ExternalLink, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import SellerMap from '../components/SellerMap';

export default function ArtisansMapPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeller, setSelectedSeller] = useState(null);

  useEffect(() => {
    async function fetchSellers() {
      try {
        setLoading(true);
        const res = await api.get('/sellers');
        setSellers(res.data.sellers || []);
        if (res.data.sellers?.length > 0) {
          setSelectedSeller(res.data.sellers[0]);
        }
      } catch (err) {
        console.error('Failed to fetch sellers for map:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSellers();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
          <Navigation className="w-4 h-4 text-emerald-600" />
          <span>Interactive Geographic Directory</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Bohol Artisan Workshop Map
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-3xl">
          Powered by OpenStreetMap & Geoapify Geocoding. Discover the physical workshops, cooperatives, and culinary studios crafting genuine island goods across Bohol.
        </p>
      </div>

      {/* Main Grid: Sidebar + Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: List of Artisans */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Verified Island Producers ({sellers.length})
          </h3>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {sellers.map((seller) => (
              <div
                key={seller.id}
                onClick={() => setSelectedSeller(seller)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedSeller?.id === seller.id
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    {seller.island_region}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {seller.product_count} items
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm mt-1">{seller.business_name}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {seller.business_description}
                </p>

                <p className="text-[11px] text-slate-400 mt-2 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{seller.business_address}</span>
                </p>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-end">
                  <Link
                    to={`/products?seller_id=${seller.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <span>View Shop Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="h-[600px] bg-slate-200 rounded-3xl animate-pulse" />
          ) : (
            <SellerMap
              sellers={sellers}
              center={
                selectedSeller && selectedSeller.latitude
                  ? [parseFloat(selectedSeller.latitude), parseFloat(selectedSeller.longitude)]
                  : [9.75, 124.0]
              }
              zoom={selectedSeller ? 12 : 10}
              height="600px"
            />
          )}
        </div>
      </div>
    </div>
  );
}


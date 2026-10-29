import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

// Fix Leaflet's default icon assets in bundled environments
const customArtisanIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function SellerMap({ sellers = [], center = [9.75, 124.0], zoom = 10, height = '450px' }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-100" style={{ height }}>
      {/* Top attribution overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 pointer-events-none">
        <Navigation className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
        <span>Bohol Artisan Workshop Locations</span>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {sellers.map((seller) => {
          const lat = parseFloat(seller.latitude);
          const lng = parseFloat(seller.longitude);

          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker key={seller.id} position={[lat, lng]} icon={customArtisanIcon}>
              <Popup className="custom-map-popup">
                <div className="p-3 max-w-xs text-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold uppercase tracking-wider mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{seller.island_region || 'Bohol Island'}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">{seller.business_name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {seller.business_description || seller.business_address}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 italic">
                    📍 {seller.business_address}
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800">
                      {seller.product_count || 'Local'} Items Listed
                    </span>
                    <Link
                      to={`/products?seller_id=${seller.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                    >
                      View Items
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}


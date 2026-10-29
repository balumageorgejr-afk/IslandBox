import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MapPin, Sparkles, ArrowRight, ShieldCheck, Heart, Search, Filter } from 'lucide-react';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import SellerMap from '../components/SellerMap';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        setLoading(true);
        const [catRes, prodRes, sellRes] = await Promise.all([
          api.get('/products/categories'),
          api.get('/products?limit=8'),
          api.get('/sellers'),
        ]);
        setCategories(catRes.data.categories || []);
        setFeaturedProducts(prodRes.data.products || []);
        setSellers(sellRes.data.sellers || []);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const filteredProducts = selectedCategory
    ? featuredProducts.filter((p) => p.category_slug === selectedCategory)
    : featuredProducts;

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-teal-950 to-slate-900 text-white pt-16 pb-24 md:pt-24 md:pb-32 px-4 sm:px-6 lg:px-8">
        {/* Background Decorative Rings */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-400 blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-600/40 text-emerald-200 text-xs font-semibold uppercase tracking-wider backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-sand-500" />
            <span>Connecting Island Cottage Artisans to Cultural Travelers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            Discover Authentic <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-200 bg-clip-text text-transparent">Philippine Island</span> Treasures
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Support native weavers, calamay masters, and eco-woodcrafters across Bohol and Central Visayas. Verified workshop locations, direct ordering, and secure PayMongo checkout.
          </p>

          {/* Call-to-actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/products"
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Browse Catalog</span>
            </Link>

            <Link
              to="/map"
              className="px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-xs transition-all flex items-center gap-2"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Explore Artisans Map</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-10 border-t border-white/10">
            <div>
              <span className="block text-2xl font-bold text-white">5+</span>
              <span className="text-xs text-slate-400 font-medium">Bohol Island Municipalities</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white">100%</span>
              <span className="text-xs text-slate-400 font-medium">Authentic Handcrafted</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white">₱0</span>
              <span className="text-xs text-slate-400 font-medium">Delivery on orders &#8805; ₱1,000</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-white">PayMongo</span>
              <span className="text-xs text-slate-400 font-medium">Cards &bull; GCash &bull; Maya</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl p-4 md:p-6 shadow-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Browse by Island Category
            </h3>
            <Link to="/products" className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              All Categories
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedCategory === cat.slug
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/30">
                  {cat.product_count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Curated Pasalubong & Handicrafts</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Featured Island Products
            </h2>
          </div>

          <Link
            to="/products"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 group"
          >
            Explore all items in catalog
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-slate-200/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700">No items found</h3>
            <p className="text-xs text-slate-500 mt-1">Try selecting another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Interactive Artisan Workshop Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-10 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>Geographic Transparency Engine</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Interactive Bohol Artisan Workshop Map
              </h2>
              <p className="text-sm text-slate-300 max-w-xl">
                Explore real geographical coordinates of our cooperative weavers in Antequera, calamay confectioners in Jagna, and shell artisans in Panglao.
              </p>
            </div>

            <Link
              to="/map"
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors self-start lg:self-auto"
            >
              <span>Full Interactive Map</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Leaflet Map Preview */}
          <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
            <SellerMap sellers={sellers} height="400px" />
          </div>
        </div>
      </section>

      {/* Cultural Heritage Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-4">
              🌴
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Authentic Jagna Calamay</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bound in natural coconut shells and sealed with iconic red tape, Jagna calamay preserves a centuries-old culinary heritage of slow cooking in muscovado and fresh coconut milk.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-4">
              🧺
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Antequera Basketry Capital</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Antequera artisans split and weave burí, nito, and raffia by hand. Supporting their cooperative directly protects endangered weaving traditions and sustains rural families.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold mb-4">
              🐚
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Ethical Marine Shellcraft</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Panglao artisan families gather discarded capiz and mother-of-pearl to carve iridescent pendants and tableware, offering a sustainable alternative to commercial plastics.
            </p>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductDetailModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}


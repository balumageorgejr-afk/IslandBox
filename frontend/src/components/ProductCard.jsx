import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, MapPin, Check, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductCard({ product, onQuickView }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      window.location.href = '/login';
      return;
    }

    try {
      setAdding(true);
      setErrorMsg('');
      await addToCart(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 3000);
    } finally {
      setAdding(false);
    }
  };

  const isOutOfStock = product.available_quantity <= 0;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col">
      {/* Image Container */}
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Stock / Category Pills */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.category_name && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 backdrop-blur-xs text-slate-800 shadow-xs">
              {product.category_name}
            </span>
          )}
          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-600 text-white shadow-xs">
              Out of Stock
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-800/80 backdrop-blur-xs text-white shadow-xs">
              {product.available_quantity} available
            </span>
          )}
        </div>

        {/* Quick View Button Overlay */}
        {onQuickView && (
          <button
            onClick={() => onQuickView(product)}
            className="absolute bottom-3 right-3 p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-emerald-700 rounded-full shadow-md backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity"
            title="Quick View with Seller Map"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Seller Location Badge */}
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate">{product.business_name} &bull; {product.island_region || 'Bohol'}</span>
          </div>

          {/* Title */}
          <Link
            to={`/products/${product.slug || product.id}`}
            className="font-semibold text-slate-800 hover:text-emerald-700 transition-colors line-clamp-2 leading-snug"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Description snippet */}
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Add to Cart Action */}
        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Price (PHP)</span>
            <span className="text-lg font-bold text-slate-900">
              &#8369;{parseFloat(product.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs ${
              added
                ? 'bg-emerald-600 text-white'
                : isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white hover:shadow-md'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added</span>
              </>
            ) : adding ? (
              <span>Adding...</span>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <p className="text-[11px] text-rose-600 mt-2 font-medium">{errorMsg}</p>
        )}
      </div>
    </div>
  );
}


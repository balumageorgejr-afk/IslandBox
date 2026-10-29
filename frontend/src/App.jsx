import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ArtisansMapPage from './pages/ArtisansMapPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderCancelPage from './pages/OrderCancelPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import MyOrdersPage from './pages/MyOrdersPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("IslandBox Application Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-800">
          <div className="max-w-lg w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Application Error</h2>
            <p className="text-xs text-slate-500">An unexpected client-side error occurred.</p>
            <pre className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl overflow-x-auto text-left">
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/'; }}
              className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              Clear Session & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col bg-[#F9FBFC] text-slate-800">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/map" element={<ArtisansMapPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <CheckoutPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/success"
                    element={
                      <ProtectedRoute>
                        <OrderSuccessPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/orders/cancel" element={<OrderCancelPage />} />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <MyOrdersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderTrackingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route
                    path="/seller"
                    element={
                      <ProtectedRoute allowedRoles={['seller', 'admin']}>
                        <SellerDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}


import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './layouts/MainLayout';

// Eagerly loaded (small, always needed)
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazily loaded
const Marketplace    = lazy(() => import('./pages/Marketplace'));
const MarketDetail   = lazy(() => import('./pages/MarketDetail'));
const CartPage       = lazy(() => import('./pages/CartPage'));
const Artisans       = lazy(() => import('./pages/Artisans'));
const ArtisanProfile = lazy(() => import('./pages/ArtisanProfile'));
const Shortlets      = lazy(() => import('./pages/Shortlets'));
const ShortletDetail = lazy(() => import('./pages/ShortletDetail'));
const Orders         = lazy(() => import('./pages/Orders'));
const Profile        = lazy(() => import('./pages/Profile'));
const VendorDashboard     = lazy(() => import('./pages/VendorDashboard'));
const ArtisanDashboard    = lazy(() => import('./pages/ArtisanDashboard'));
const AdminDashboard      = lazy(() => import('./pages/AdminDashboard'));
// New: Vendor product upload
const VendorProductUpload = lazy(() => import('./pages/VendorProductUpload'));
// New: Admin creation pages
const AdminVendorCreate   = lazy(() => import('./pages/AdminVendorCreate'));
const AdminArtisanCreate  = lazy(() => import('./pages/AdminArtisanCreate'));
const AdminProductCreate  = lazy(() => import('./pages/AdminProductCreate'));
const AdminShortletCreate = lazy(() => import('./pages/AdminShortletCreate'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <Router>
            <ToastContainer />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Marketplace */}
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/markets/:id" element={<MarketDetail />} />
                    <Route path="/cart" element={<CartPage />} />

                    {/* Artisans */}
                    <Route path="/artisans" element={<Artisans />} />
                    <Route path="/artisans/:id" element={<ArtisanProfile />} />

                    {/* Short-lets */}
                    <Route path="/shortlets" element={<Shortlets />} />
                    <Route path="/shortlets/:id" element={<ShortletDetail />} />

                    {/* User */}
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/profile" element={<Profile />} />

                    {/* Dashboards */}
                    <Route path="/vendor" element={<VendorDashboard />} />
                    <Route path="/artisan-dashboard" element={<ArtisanDashboard />} />
                    <Route path="/admin" element={<AdminDashboard />} />

                    {/* Vendor: Product Upload */}
                    <Route path="/vendor/upload-product" element={<VendorProductUpload />} />

                    {/* Admin: Content Creation */}
                    <Route path="/admin/vendors/create"   element={<AdminVendorCreate />} />
                    <Route path="/admin/artisans/create"  element={<AdminArtisanCreate />} />
                    <Route path="/admin/products/create"  element={<AdminProductCreate />} />
                    <Route path="/admin/shortlets/create" element={<AdminShortletCreate />} />
                  </Route>
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Router>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

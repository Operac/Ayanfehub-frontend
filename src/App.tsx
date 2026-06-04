import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import MainLayout from './layouts/MainLayout';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRole({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

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
const CleaningServices    = lazy(() => import('./pages/CleaningServices'));
const CleaningRequestForm = lazy(() => import('./pages/CleaningRequestForm'));
const GroupBuyList        = lazy(() => import('./pages/GroupBuyList'));
const GroupBuyDetail      = lazy(() => import('./pages/GroupBuyDetail'));
const About               = lazy(() => import('./pages/About'));
const Partner             = lazy(() => import('./pages/Partner'));
const Terms               = lazy(() => import('./pages/Terms'));
const BecomeVendor        = lazy(() => import('./pages/BecomeVendor'));

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

                    {/* Artisans */}
                    <Route path="/artisans" element={<Artisans />} />
                    <Route path="/artisans/:id" element={<ArtisanProfile />} />

                    {/* Short-lets */}
                    <Route path="/shortlets" element={<Shortlets />} />
                    <Route path="/shortlets/:id" element={<ShortletDetail />} />

                    {/* User — must be logged in */}
                    <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
                    <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
                    <Route path="/cart" element={<RequireAuth><CartPage /></RequireAuth>} />

                    {/* Vendor dashboard — VENDOR or ADMIN only */}
                    <Route path="/vendor" element={<RequireRole roles={['VENDOR','ADMIN']}><VendorDashboard /></RequireRole>} />
                    <Route path="/vendor/upload-product" element={<RequireRole roles={['VENDOR','ADMIN']}><VendorProductUpload /></RequireRole>} />

                    {/* Artisan dashboard — ARTISAN or ADMIN only */}
                    <Route path="/artisan-dashboard" element={<RequireRole roles={['ARTISAN','ADMIN']}><ArtisanDashboard /></RequireRole>} />

                    {/* Admin-only routes */}
                    <Route path="/admin" element={<RequireRole roles={['ADMIN']}><AdminDashboard /></RequireRole>} />
                    <Route path="/admin/vendors/create"   element={<RequireRole roles={['ADMIN']}><AdminVendorCreate /></RequireRole>} />
                    <Route path="/admin/artisans/create"  element={<RequireRole roles={['ADMIN']}><AdminArtisanCreate /></RequireRole>} />
                    <Route path="/admin/products/create"  element={<RequireRole roles={['ADMIN']}><AdminProductCreate /></RequireRole>} />
                    <Route path="/admin/shortlets/create" element={<RequireRole roles={['ADMIN']}><AdminShortletCreate /></RequireRole>} />

                    {/* Group Buy */}
                    <Route path="/group-buy" element={<GroupBuyList />} />
                    <Route path="/group-buy/:id" element={<RequireAuth><GroupBuyDetail /></RequireAuth>} />

                    {/* Cleaning Services */}
                    <Route path="/cleaning" element={<CleaningServices />} />
                    <Route path="/cleaning/book" element={<RequireAuth><CleaningRequestForm /></RequireAuth>} />

                    {/* Legal & Static Information */}
                    <Route path="/about" element={<About />} />
                    <Route path="/partner" element={<Partner />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/become-vendor" element={<RequireAuth><BecomeVendor /></RequireAuth>} />
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

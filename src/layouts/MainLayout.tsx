import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState } from 'react';
import GlobalSearch from '../components/GlobalSearch';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  // const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Artisans', path: '/artisans' },
    { name: 'Short-lets', path: '/shortlets' },
    { name: 'Orders', path: '/orders' },
  ];

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="flex min-h-screen flex-col font-sans text-[#101818] bg-[#f7f7f7]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-[#dae7e5] bg-white/80 backdrop-blur-md px-6 md:px-10 lg:px-40 py-3">
        <div className="flex items-center justify-between gap-8 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 text-primary">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined">storefront</span>
              </div>
              <h2 className="text-[#101818] text-xl font-extrabold tracking-tight">Ayanfe</h2>
            </Link>
            <nav className="hidden lg:flex items-center gap-7">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname.startsWith(item.path)
                      ? 'text-primary font-bold border-b-2 border-primary pb-1'
                      : 'text-[#5e8d88] hover:text-primary'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-1 justify-end gap-4 items-center">
            <div className="hidden md:flex flex-1 max-w-sm">
              <GlobalSearch />
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative group">
                    <button className="hidden sm:flex min-w-[100px] h-10 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold hover:bg-opacity-90 transition-all">
                        {user.role === 'admin' ? 'Admin' : 'Profile'}
                    </button>
                    {/* Dropdown */}
                     <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover:block">
                         <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Profile</Link>
                         <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Orders</Link>
                         <Link to="/vendor" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Vendor Dashboard</Link>
                         <Link to="/artisan-dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Artisan Dashboard</Link>
                         {user.role === 'admin' && (
                             <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Admin Dashboard</Link>
                         )}
                         <hr className="my-1 border-gray-100" />
                         <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                     </div>
                </div>
              ) : (
                <Link to="/login" className="hidden sm:flex min-w-[100px] h-10 items-center justify-center rounded-lg bg-primary text-white text-sm font-bold hover:bg-opacity-90 transition-all">
                  Sign In
                </Link>
              )}

              <Link to="/cart" className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f5f4] text-[#101818] hover:bg-[#e0eceb] transition-all">
                <span className="material-symbols-outlined">shopping_cart</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white leading-none">
                    {cartCount}
                  </span>
                )}
              </Link>
              
               {/* Mobile Menu Button - Styled roughly */}
               <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f5f4] text-[#101818]"
               >
                 <span className="material-symbols-outlined">menu</span>
               </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Nav */}
        {isMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
                 <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-[#5e8d88] font-medium hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
            </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#dae7e5] bg-white px-6 md:px-10 lg:px-40 py-10">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 text-primary mb-4">
              <div className="size-6 bg-primary rounded flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-sm leading-none">storefront</span>
              </div>
              <h2 className="text-[#101818] text-lg font-extrabold tracking-tight">Ayanfe</h2>
            </div>
            <p className="text-sm text-[#5e8d88]">
              Connecting you to the heartbeat of Lagos markets. Fresh, authentic, and delivered with care.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="font-bold text-sm text-[#101818]">Services</h5>
            <Link to="/marketplace" className="text-sm text-[#5e8d88] hover:text-primary">Marketplace</Link>
            <Link to="/artisans" className="text-sm text-[#5e8d88] hover:text-primary">Artisan Booking</Link>
            <Link to="/shortlets" className="text-sm text-[#5e8d88] hover:text-primary">Short-let Stays</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="font-bold text-sm text-[#101818]">Company</h5>
            <a className="text-sm text-[#5e8d88] hover:text-primary" href="#">About Us</a>
            <a className="text-sm text-[#5e8d88] hover:text-primary" href="#">Become a Vendor</a>
            <a className="text-sm text-[#5e8d88] hover:text-primary" href="#">Partner with Us</a>
          </div>
          <div className="flex flex-col gap-3">
            <h5 className="font-bold text-sm text-[#101818]">Support</h5>
            <a className="text-sm text-[#5e8d88] hover:text-primary" href="#">Help Center</a>
            <a className="text-sm text-[#5e8d88] hover:text-primary" href="#">Delivery Areas</a>
            <a className="text-sm text-[#5e8d88] hover:text-primary" href="#">Terms of Service</a>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto mt-10 pt-6 border-t border-[#dae7e5] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#5e8d88]">© {new Date().getFullYear()} Ayanfe Logistics & Services. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="material-symbols-outlined text-xl text-[#5e8d88] cursor-pointer hover:text-primary">public</span>
            <span className="material-symbols-outlined text-xl text-[#5e8d88] cursor-pointer hover:text-primary">alternate_email</span>
            <span className="material-symbols-outlined text-xl text-[#5e8d88] cursor-pointer hover:text-primary">share</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

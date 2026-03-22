import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Search, Bell, User as UserIcon, Menu, X, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'TV Shows', path: '/?category=TV%20Shows' },
    { label: 'Movies', path: '/?category=Movies' },
    { label: 'Sports', path: '/?category=Sports' },
    { label: 'News', path: '/?category=News' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' && !location.search;
    }
    return location.search.includes(path.split('?')[1] || '');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/95 backdrop-blur-sm'
          : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="px-4 md:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-red-600 font-bold text-2xl hidden sm:block">STREAMFLIX</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-white ${
                    isActive(link.path) ? 'text-white' : 'text-gray-300'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search channels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/50 border border-gray-600 rounded-full px-4 py-2 pl-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white w-48 transition-all focus:w-64"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </form>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Bell className="w-5 h-5" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-white/10">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <span className="hidden sm:inline text-sm">{user?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-700">
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                      <p className="text-xs text-green-400 mt-1 capitalize">
                        {user?.subscriptionStatus} Plan
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    
                    {isAdmin && (
                      <>
                        <DropdownMenuItem
                          onClick={() => navigate('/admin')}
                          className="text-white hover:bg-gray-800 cursor-pointer"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                      </>
                    )}
                    
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-400 hover:bg-gray-800 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Get Started
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden mt-4 pb-4 border-t border-gray-800 pt-4">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm font-medium py-2 ${
                    isActive(link.path) ? 'text-white' : 'text-gray-300'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mt-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search channels..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-gray-600 rounded-lg px-4 py-2 pl-10 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-white"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </form>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;

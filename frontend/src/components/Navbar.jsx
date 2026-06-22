import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale, LayoutDashboard, Upload, History, User, LogOut, Menu, X, GitCompare } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/upload',    label: 'Upload',    icon: Upload },
    { to: '/compare',   label: 'Compare',   icon: GitCompare },
    { to: '/history',   label: 'History',   icon: History },
    { to: '/profile',   label: 'Profile',   icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="bg-primary-600 p-1.5 rounded-lg">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">LexAudit</span>
          </Link>

          {/* Desktop nav */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(to)
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors ml-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}

          {!user && (
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-1">
          {user
            ? navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(to)
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))
            : null}
          {user && (
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
          {!user && (
            <>
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-slate-300">Sign In</Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-primary-400">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

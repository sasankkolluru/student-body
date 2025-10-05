import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Home, Users, Calendar, Trophy, Vote, Lightbulb, Image as ImageIcon, Newspaper } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const navigationItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/about', label: 'About', icon: null },
  { path: '/councils', label: 'Student Bodies', icon: Users },
  { path: '/events', label: 'Events', icon: Calendar },
  { path: '/gallery', label: 'Gallery', icon: ImageIcon },
  { path: '/news', label: 'News & Scores', icon: Newspaper },
  { path: '/achievements', label: 'Achievements', icon: Trophy },
  { path: '/voting', label: 'Voting', icon: Vote },
  { path: '/ideas', label: 'Ideas', icon: Lightbulb },
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      navigate('/');
      window.location.reload(); // Ensure a full page refresh to clear any state
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const userNavigation = [
    { name: 'Your Profile', path: '/profile' },
    { name: 'Dashboard', path: user?.role === 'admin' ? '/admin/dashboard' : '/dashboard' },
    { name: 'Settings', path: '#' },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center min-w-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <span className="text-lg lg:text-xl font-bold text-gray-900 truncate">Student Council</span>
            </Link>
          </div>

          {/* Desktop Navigation - keep one line, overflow into More */}
          <div className="hidden lg:flex items-center space-x-2 xl:space-x-3 flex-nowrap">
            {(() => {
              const primary = navigationItems.slice(0, 5);
              const secondary = navigationItems.slice(5);
              return (
                <>
                  {primary.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-2 py-1 rounded-md text-xs lg:text-sm font-medium flex items-center whitespace-nowrap ${
                        isActive(item.path)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.icon && <item.icon className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />}
                      {item.label}
                    </Link>
                  ))}
                  {secondary.length > 0 && (
                    <div className="relative">
                      <button
                        onClick={() => setIsMoreOpen((p) => !p)}
                        className={`px-2 py-1 rounded-md text-xs lg:text-sm font-medium whitespace-nowrap ${
                          secondary.some((it) => isActive(it.path))
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        More
                      </button>
                      <AnimatePresence>
                        {isMoreOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="origin-top-right absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-40"
                          >
                            <div className="py-1">
                              {secondary.map((item) => (
                                <Link
                                  key={item.path}
                                  to={item.path}
                                  className={`block px-4 py-2 text-sm ${
                                    isActive(item.path)
                                      ? 'text-blue-700 bg-blue-50'
                                      : 'text-gray-700 hover:bg-gray-100'
                                  }`}
                                  onClick={() => setIsMoreOpen(false)}
                                >
                                  <div className="flex items-center">
                                    {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                                    {item.label}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* User quick links + Profile */}
          <div className="flex items-center space-x-2 lg:space-x-4 min-w-0">
            {user ? (
              <>
                {/* Messages link (visible to any authenticated user) */}
                <Link
                  to="/messages"
                  className={`hidden xl:inline px-2 py-1 rounded-md text-xs lg:text-sm font-medium ${
                    isActive('/messages') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  Messages
                </Link>

                {/* Admin dropdown (visible only to admins) */}
                {user.role === 'admin' && (
                  <div className="relative hidden md:block">
                    <button
                      onClick={() => setIsProfileOpen((prev) => !prev)}
                      className="px-2 py-1 rounded-md text-xs lg:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      Admin
                    </button>
                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="origin-top-right absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-40"
                        >
                          <div className="py-1">
                            <Link to="/admin/polls" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsProfileOpen(false)}>
                              Polls
                            </Link>
                            <Link to="/admin/messages" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsProfileOpen(false)}>
                              Messages
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Profile avatar and dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden md:inline text-xs lg:text-sm font-medium text-gray-700 truncate">
                      {user.name.split(' ')[0]}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                        role="menu"
                        aria-orientation="vertical"
                        aria-labelledby="user-menu"
                      >
                        <div className="py-1" role="none">
                          {userNavigation.map((item) => (
                            <Link
                              key={item.name}
                              to={item.path}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              {item.name}
                            </Link>
                          ))}
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                            role="menuitem"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Sign in
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden overflow-hidden bg-white"
              >
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        isActive(item.path)
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center">
                        {item.icon && <item.icon className="h-5 w-5 mr-2" />}
                        {item.label}
                      </div>
                    </Link>
                  ))}
                  
                  {!user ? (
                    <div className="pt-4 border-t border-gray-200 mt-4 space-y-2">
                      <Link
                        to="/login"
                        className="w-full block text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/register"
                        className="w-full block text-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Create account
                      </Link>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-200 mt-4">
                      <div className="flex items-center px-4 py-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-800">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        {userNavigation.map((item) => (
                          <Link
                            key={item.name}
                            to={item.path}
                            className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-base font-medium text-red-600 hover:bg-gray-100 flex items-center"
                        >
                          <LogOut className="h-5 w-5 mr-2" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};
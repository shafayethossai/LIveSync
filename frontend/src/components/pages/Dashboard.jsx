import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/button';
import { Building2, Users, MessageCircle, UserCircle, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Protect the page
  React.useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  const handleCreatePost = (type) => {
    navigate(`/create-post?type=${type}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/20 sticky top-0 z-50"
      >
        <div className="w-full px-2 sm:px-4 lg:px-8 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-1 sm:gap-4">
            <Logo variant="gradient" size="sm" to="/dashboard" className="flex-shrink-0" />
            <nav className="flex items-center gap-0.5 sm:gap-2">
              <Link to="/listings">
                <Button variant="ghost" className="gap-0.5 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-2 h-auto text-xs sm:text-sm">
                  <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Browse</span>
                </Button>
              </Link>
              <Link to="/messages">
                <Button variant="ghost" className="gap-0.5 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-2 h-auto text-xs sm:text-sm">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Messages</span>
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="outline" className="gap-0.5 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-2 h-auto text-xs sm:text-sm bg-white/50 backdrop-blur-sm">
                  <UserCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Welcome back!</span>
          </motion.div>
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-4">
            Hello, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{user?.name || 'User'}</span>!
          </h1>
          <p className="text-xl text-gray-600">What are you looking for today?</p>
        </motion.div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Family Flat Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-white/20 hover:shadow-2xl transition-all">
              <div className="relative p-8">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg mb-6"
                >
                  <Building2 className="w-12 h-12 text-white" />
                </motion.div>

                <h2 className="text-3xl font-bold text-gray-900 mb-3">Family Flat</h2>
                <p className="text-gray-600 mb-6">
                  Find or offer complete apartments perfect for families.
                </p>

                <Button
                  onClick={() => handleCreatePost('family')}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl shadow-lg group"
                >
                  Create Post
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Bachelor Flat Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-white/20 hover:shadow-2xl transition-all">
              <div className="relative p-8">
                <motion.div
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg mb-6"
                >
                  <Users className="w-12 h-12 text-white" />
                </motion.div>

                <h2 className="text-3xl font-bold text-gray-900 mb-3">Bachelor Flat</h2>
                <p className="text-gray-600 mb-6">
                  Looking for roommates or shared accommodations?
                </p>

                <Button
                  onClick={() => handleCreatePost('bachelor')}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl shadow-lg group"
                >
                  Create Post
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
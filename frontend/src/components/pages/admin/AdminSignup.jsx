import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from "../../context/AdminAuthContext";
import { Logo } from '../../ui/Logo';
import { Button } from '../../ui/button';
import { ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSignup() {
  const { admin } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (admin) {
      navigate('/admin/dashboard');
    }
  }, [admin, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <Logo variant="light" size="lg" to="/admin/login" />
            <p className="text-white/90 text-lg font-medium mt-2 flex items-center justify-center gap-2">
              <Shield className="w-5 h-5" /> Create Admin Account
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20"
          >
            <div className="flex items-center justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-yellow-400" />
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Admin Signup Disabled</h2>
              <p className="text-white/70">Admin accounts are managed by system administrators only</p>
            </div>

            <div className="mb-6 p-4 bg-blue-500/20 border border-blue-400 rounded-2xl text-white text-center">
              <p className="font-medium">To access the admin portal, use your fixed admin credentials</p>
            </div>

            <div className="text-center mb-6">
              <Button
                onClick={() => navigate('/admin/login')}
                className="w-full h-14 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-2xl text-lg font-semibold"
              >
                Go to Admin Login
              </Button>
            </div>

            <div className="mt-6 text-center">
              <a href="/login" className="text-white/70 hover:text-white flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to User Login
              </a>
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-white/60 text-sm">© 2026 LiveSync Admin Portal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

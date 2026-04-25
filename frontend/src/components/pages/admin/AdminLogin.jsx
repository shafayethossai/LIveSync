import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Logo } from '../../ui/Logo';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Mail, Lock, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { admin, loginAdmin } = useAdminAuth();

  useEffect(() => {
    // Check if already logged in - redirect to dashboard
    if (admin && !loading) {
      console.log('Admin already logged in, redirecting to dashboard');
      navigate('/admin/dashboard', { replace: true });
    }
  }, [admin, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginAdmin(email.trim(), password);

      if (result.success) {
        console.log('Login successful!');
        // Wait a moment for state to update, then navigate
        setTimeout(() => {
          console.log('Navigating to admin dashboard...');
          navigate('/admin/dashboard');
        }, 100);
      } else {
        setError(result.message || 'Login failed');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <Logo variant="light" size="lg" to="/admin/login" />
            <p className="text-white/90 text-lg font-medium mt-2 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> Secure Admin Access
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20"
          >
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-2">Admin Portal</h2>
              <p className="text-white/70">Enter your credentials to access the admin panel</p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-400 rounded-2xl text-white">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-white mb-2 block">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@livesync.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-12 bg-white/10 border-white/20 text-white h-14 rounded-2xl disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-white mb-2 block">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-12 bg-white/10 border-white/20 text-white h-14 rounded-2xl disabled:opacity-50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-14 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-2xl text-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Access Admin Panel'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>

            {/* <div className="mt-6 p-4 bg-white/5 rounded-2xl text-sm border border-white/10">
              <p className="text-white/70 font-medium mb-2">Admin Credentials:</p>
              <p className="text-white/80 font-mono text-sm">Email: admin@livesync.com</p>
              <p className="text-white/80 font-mono text-sm">Password: admin123</p>
            </div> */}

            <div className="mt-8 text-center">
              <Link to="/login" className="text-white/70 hover:text-white flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to User Login
              </Link>
            </div>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-white/60 text-sm">© 2026 LiveSync Admin Portal. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
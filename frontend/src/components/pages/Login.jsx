import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from '@react-oauth/google';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Invalid email or password');
    }

    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    const result = await googleLogin(credentialResponse.credential);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Google login failed');
    }

    setLoading(false);
  };

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleLoginAvailable = Boolean(googleClientId && googleClientId.trim());

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <>
      {!googleLoginAvailable && (
        <div className="fixed top-4 left-1/2 z-20 w-full max-w-xl -translate-x-1/2 rounded-2xl bg-red-500/90 p-4 text-center text-sm font-semibold text-white shadow-xl">
          Google login is not configured. Set <code className="rounded bg-white/10 px-1 py-0.5">VITE_GOOGLE_CLIENT_ID</code> for production.
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
              <Logo variant="light" size="lg" to="/login" />
              <p className="text-white/90 text-lg font-medium mt-2 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Find Your Perfect Home
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20"
            >
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-white/70">Sign in to continue your journey</p>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-400 rounded-2xl text-white">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label htmlFor="email" className="text-white mb-2 block">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-12 bg-white/10 border-white/20 text-white h-14 rounded-2xl"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="password" className="text-white block">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-white/70 hover:text-white transition">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-12 bg-white/10 border-white/20 text-white h-14 rounded-2xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-white text-purple-600 hover:bg-white/90 rounded-2xl text-lg font-semibold shadow-lg"
                >
                  {loading ? "Signing in..." : "Sign In"}
                  {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>
              </form>

              {/* Google Sign-In Button */}
              <div className="mt-6 flex justify-center">
                {googleLoginAvailable ? (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="dark"
                  />
                ) : (
                  <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-center text-sm text-white/90">
                    Google sign-in is unavailable until the app is configured with a valid <code className="rounded bg-white/10 px-1 py-0.5">VITE_GOOGLE_CLIENT_ID</code>.
                  </div>
                )}
              </div>

              <div className="mt-8 text-center">
                <p className="text-white/70">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-white hover:underline font-semibold">Sign up</Link>
                </p>
              </div>

              <div className="mt-6 text-center">
                <Link to="/admin/login" className="text-white/70 hover:text-white flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" /> Admin Access
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
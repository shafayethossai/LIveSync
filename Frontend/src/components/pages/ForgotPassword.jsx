import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-40 right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-40 left-40 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], x: [0, 50, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="text-center mb-8">
            <div className="mb-4">
              <Logo variant="light" size="lg" to="/login" />
            </div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-white/90 text-lg font-medium">
              Reset Your Password
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20"
          >
            {!submitted ? (
              <>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">Forgot Password?</h2>
                  <p className="text-white/70">No worries! Enter your email and we'll send you reset instructions.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                    <Label htmlFor="email" className="text-white font-medium mb-2 block">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-12 bg-white/10 backdrop-blur-xl border-white/20 text-white placeholder:text-white/50 h-14 rounded-2xl focus:bg-white/20 focus:border-white/40 transition-all"
                      />
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        className="w-full h-14 bg-white text-cyan-600 hover:bg-white/90 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all group"
                      >
                        Send Reset Link
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </motion.div>
                </form>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 360 }} transition={{ type: "spring", duration: 0.8 }} className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 backdrop-blur-xl rounded-full border-2 border-white/30">
                    <CheckCircle className="w-10 h-10 text-white" />
                  </div>
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-3">Check Your Email!</h3>
                <p className="text-white/80 mb-6">
                  We've sent password reset instructions to<br />
                  <span className="font-semibold">{email}</span>
                </p>
                <p className="text-white/60 text-sm">Didn't receive the email? Check your spam folder or try again.</p>
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </Link>
            </motion.div>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-center mt-8 text-white/60 text-sm">
            © 2026 LiveSync. All rights reserved.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
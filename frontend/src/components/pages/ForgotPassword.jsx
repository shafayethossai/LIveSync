import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Mail, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSuccessMessage('Password reset code sent to your email');
      setStep(2); // Move to OTP verification step
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (otp.length !== 6) {
      setError('OTP must be 6 digits');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/forgot-password/verify-otp', {
        email,
        otp,
      });
      setSuccessMessage('OTP verified successfully');
      setStep(3); // Move to password reset step
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/forgot-password/reset', {
        email,
        otp,
        new_password: newPassword,
      });
      setSuccessMessage('Password reset successfully!');
      setStep(4); // Show success state
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (step > 1) {
      setError('');
      setSuccessMessage('');
      setStep(step - 1);
    }
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
          className="w-full max-w-md"
        >
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <Logo variant="light" size="lg" to="/login" />
            <p className="text-white/90 text-lg font-medium mt-2">Reset Your Password</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20"
          >
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2"
              >
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-200 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Success Message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-200 text-sm">{successMessage}</p>
              </motion.div>
            )}

            {/* Step 1: Email */}
            {step === 1 && (
              <>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">Forgot Password?</h2>
                  <p className="text-white/70">Enter your email and we'll send reset instructions.</p>
                </div>

                <form onSubmit={handleRequestReset} className="space-y-5">
                  <div>
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
                        className="pl-12 bg-white/10 border-white/20 text-white h-14 rounded-2xl"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-white text-cyan-600 hover:bg-white/90 rounded-2xl text-lg font-semibold"
                  >
                    {loading ? "Sending..." : "Send Reset Code"}
                    {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                  </Button>
                </form>
              </>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">Verify Code</h2>
                  <p className="text-white/70">Enter the 6-digit code sent to {email}</p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  <div>
                    <Label htmlFor="otp" className="text-white font-medium mb-2 block">Verification Code</Label>
                    <div className="relative">
                      <Input
                        id="otp"
                        type="text"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        maxLength="6"
                        required
                        className="bg-white/10 border-white/20 text-white h-14 rounded-2xl text-center text-2xl font-mono tracking-widest"
                      />
                    </div>
                    <p className="text-white/60 text-xs mt-2">Code expires in 10 minutes</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full h-14 bg-white text-cyan-600 hover:bg-white/90 rounded-2xl text-lg font-semibold disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                    {!loading && otp.length === 6 && <ArrowRight className="ml-2 w-5 h-5" />}
                  </Button>
                </form>

                <button
                  onClick={handleGoBack}
                  className="mt-4 text-white/80 hover:text-white text-sm flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Change Email
                </button>
              </>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">Set New Password</h2>
                  <p className="text-white/70">Create a strong password for your account</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <Label htmlFor="newPassword" className="text-white font-medium mb-2 block">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white h-14 rounded-2xl"
                    />
                    <p className="text-white/60 text-xs mt-1">Minimum 6 characters</p>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-white font-medium mb-2 block">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white h-14 rounded-2xl"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || newPassword.length < 6 || confirmPassword !== newPassword}
                    className="w-full h-14 bg-white text-cyan-600 hover:bg-white/90 rounded-2xl text-lg font-semibold disabled:opacity-50"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                    {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                  </Button>
                </form>

                <button
                  onClick={handleGoBack}
                  className="mt-4 text-white/80 hover:text-white text-sm flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              </>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="text-center py-8">
                <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Password Reset Successful!</h3>
                <p className="text-white/80 mb-6">
                  Your password has been changed successfully.
                </p>
                <Link
                  to="/login"
                  className="inline-block px-8 py-3 bg-white text-cyan-600 rounded-2xl font-semibold hover:bg-white/90 transition"
                >
                  Go to Login
                </Link>
              </div>
            )}

            {step !== 4 && (
              <div className="mt-8 text-center">
                <Link to="/login" className="inline-flex items-center gap-2 text-white/80 hover:text-white">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
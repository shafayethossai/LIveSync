import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";
import { Logo } from '../ui/Logo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { User, Mail, Lock, Phone, ArrowRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Signup() {
  const [step, setStep] = useState('signup'); // 'signup' or 'otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);

  const { requestOTP, verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (step !== 'otp') return;

    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, step]);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await requestOTP(name, email, password, phone);

    if (result.success) {
      setStep('otp');
      setTimeLeft(600); // Reset timer
      setCanResend(false);
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      setLoading(false);
      return;
    }

    const result = await verifyOTP(email, otp);

    if (result.success) {
      // Account created successfully - redirect to login or dashboard
      // Option 1: Auto-login and go to dashboard (user is already logged in)
      navigate('/dashboard');
      
      // Option 2: Redirect to login (uncomment to use)
      // navigate('/login');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');

    const result = await resendOTP(email);

    if (result.success) {
      setTimeLeft(600);
      setCanResend(false);
      setOtp('');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <Logo variant="light" size="lg" to="/login" />
            <p className="text-white/90 text-lg font-medium mt-2">
              {step === 'signup' ? 'Create Your Account' : 'Verify Your Email'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20"
          >
            {step === 'signup' ? (
              // SIGNUP FORM
              <>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">Get Started</h2>
                  <p className="text-white/70">Join thousands finding their perfect home</p>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-500/20 border border-red-400 rounded-2xl text-white text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <Label htmlFor="name" className="text-white mb-2 block">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                        className="pl-12 bg-white/10 border-white/20 text-white h-14 rounded-2xl"
                      />
                    </div>
                  </div>

                  {/* Email */}
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
                        disabled={loading}
                        className="pl-12 bg-white/10 border-white/20 text-white h-14 rounded-2xl"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone" className="text-white mb-2 block">Phone Number (Optional)</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+880 1XXXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={loading}
                        className="pl-12 bg-white/10 border-white/20 text-white h-14 rounded-2xl"
                      />
                    </div>
                  </div>

                  {/* Password */}
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
                        className="pl-12 bg-white/10 border-white/20 text-white h-14 rounded-2xl"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-white text-indigo-600 hover:bg-white/90 rounded-2xl text-lg font-semibold shadow-lg"
                  >
                    {loading ? "Sending OTP..." : "Get OTP"}
                    {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-white/70">
                    Already have an account?{' '}
                    <Link to="/login" className="text-white hover:underline font-semibold">Sign in</Link>
                  </p>
                </div>
              </>
            ) : (
              // OTP VERIFICATION FORM
              <>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold text-white mb-2">Verify Email</h2>
                  <p className="text-white/70 text-sm">We sent a 6-digit code to <br/><span className="font-semibold">{email}</span></p>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-500/20 border border-red-400 rounded-2xl text-white text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleOTPSubmit} className="space-y-5">
                  {/* OTP Input */}
                  <div>
                    <Label htmlFor="otp" className="text-white mb-2 block">Enter OTP Code</Label>
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={handleOtpChange}
                      placeholder="000000"
                      maxLength="6"
                      className="text-center text-3xl font-bold letter-spacing tracking-widest bg-white/10 border-white/20 text-white h-16 rounded-2xl"
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full h-14 bg-white text-indigo-600 hover:bg-white/90 rounded-2xl text-lg font-semibold shadow-lg disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                    {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
                  </Button>
                </form>

                {/* Timer and Resend */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-center gap-2 text-white/70 text-sm">
                    <Clock className="w-4 h-4" />
                    {timeLeft > 0 ? (
                      <span>
                        OTP expires in: <span className="font-bold text-white">{minutes}:{seconds.toString().padStart(2, '0')}</span>
                      </span>
                    ) : (
                      <span className="text-red-400">OTP has expired</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend || loading}
                    className="w-full py-2 text-white/70 hover:text-white disabled:text-white/30 text-sm font-medium transition"
                  >
                    {canResend ? 'Resend OTP' : `Resend in ${seconds.toString().padStart(2, '0')}s`}
                  </button>
                </div>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setStep('signup')}
                    className="text-white/70 hover:text-white text-sm"
                  >
                    ← Back to signup
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
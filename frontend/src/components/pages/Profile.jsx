import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { User, Mail, Phone, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, updateProfile, logout, fetchCurrentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'tenant',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoPreview, setPhotoPreview] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Load user profile data on mount and when user changes
  useEffect(() => {
    // First, try to load from localStorage (fast)
    const savedUserData = localStorage.getItem('livesync_user');
    if (savedUserData) {
      try {
        const userData = JSON.parse(savedUserData);
        console.log('Loaded user from localStorage:', userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          role: userData.role || 'tenant',
        });
        
        if (userData.avatar_url) {
          setPhotoPreview(userData.avatar_url);
        }
        setPageLoading(false);
      } catch (err) {
        console.error('Error parsing saved user data:', err);
      }
    }
    
    // Then, fetch latest user data from backend
    if (fetchCurrentUser) {
      fetchCurrentUser();
    }
  }, []); // Run once on mount

  // Update form when user data from context changes
  useEffect(() => {
    if (!user) {
      return;
    }
    
    // Initialize form data from user
    console.log('User data loaded from context:', { name: user.name, email: user.email, role: user.role, avatar_url: user.avatar_url });
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'tenant',
    });
    
    // Set photo preview from database
    if (user.avatar_url) {
      setPhotoPreview(user.avatar_url);
    } else {
      setPhotoPreview(null);
    }
    
    setPageLoading(false);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleRoleChange = (value) => {
    console.log('Role changed to:', value);
    setFormData(prev => ({ ...prev, role: value }));
    setError('');
  };

  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Photo size must be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Compress image before reading
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          // Create canvas and compress image
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Scale down if image is too large
          const maxWidth = 500;
          const maxHeight = 500;
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to compressed base64
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
          setPhotoPreview(compressedBase64);
          setFormData(prev => ({ ...prev, avatar_url: compressedBase64 }));
          setError('');
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending profile update:', { name: formData.name, email: formData.email, phone: formData.phone, role: formData.role, hasPhoto: !!formData.avatar_url });
      const result = await updateProfile(formData);
      
      if (result.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-[700px] h-[700px] bg-white/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 18, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navbar */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Logo variant="light" size="md" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-white hover:text-white/90 transition-colors border border-white/30 px-4 py-2 rounded-lg hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Centered Profile Form with Motion */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="bg-white/10 backdrop-blur-3xl border border-white/20 rounded-3xl p-10 shadow-2xl">
              {/* Profile Header */}
              <div className="flex flex-col items-center mb-10">
                <label className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-5 overflow-hidden cursor-pointer hover:bg-white/30 transition-colors relative group">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-white text-xs font-semibold">Change Photo</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
                <h1 className="text-3xl font-bold text-white">Your Profile</h1>
                <p className="text-white/70 mt-1">Update your information</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 bg-red-500/20 border border-red-400 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="mb-6 p-3 bg-green-500/20 border border-green-400 rounded-lg flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                  <p className="text-green-200 text-sm">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label className="text-white mb-2 block text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your name"
                      className="pl-12 bg-white/20 border-white/30 text-white h-14 rounded-2xl placeholder:text-white/50"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className="pl-12 bg-white/20 border-white/30 text-white h-14 rounded-2xl placeholder:text-white/50"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-2 block text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+880 1234567890"
                      className="pl-12 bg-white/20 border-white/30 text-white h-14 rounded-2xl placeholder:text-white/50"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-3 block text-sm font-medium">I am a:</Label>
                  <RadioGroup value={formData.role} onValueChange={handleRoleChange} className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex-1 ${formData.role === 'owner' ? 'border-white/40 bg-white/20' : 'border-white/30 hover:bg-white/10'}`}>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="owner" id="owner" disabled={loading} />
                          <div>
                            <div className="font-medium text-white text-sm">Owner</div>
                            <div className="text-xs text-white/70">I have property</div>
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center">
                      <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex-1 ${formData.role === 'tenant' ? 'border-white/40 bg-white/20' : 'border-white/30 hover:bg-white/10'}`}>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="tenant" id="tenant" disabled={loading} />
                          <div>
                            <div className="font-medium text-white text-sm">Tenant</div>
                            <div className="text-xs text-white/70">Looking for property</div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-white text-purple-600 font-semibold rounded-2xl text-lg mt-8 hover:bg-white/95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating...' : 'Update Profile →'}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../ui/Logo';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { User, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'khansh921@gmail.com',
    phone: user?.phone || '+880 1234567890',
    role: user?.role || 'owner',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (value) => {
    setFormData({ ...formData, role: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    alert('Profile updated successfully!');
    navigate('/dashboard');
  };

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
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 text-white hover:text-white/90 transition-colors border border-white/30 px-4 py-2 rounded-lg"
            >
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Centered Profile Form with Motion */}
        <div className="flex-1 flex items-center justify-center px-6">
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
                  {user?.photo ? (
                    <img src={user.photo} alt="Profile" className="w-full h-full object-cover" />
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
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setFormData({ ...formData, photo: event.target.result });
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                <h1 className="text-3xl font-bold text-white">Your Profile</h1>
                <p className="text-white/70 mt-1">Update your information</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label className="text-white mb-2 block text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 w-5 h-5" />
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-12 bg-white/20 border-white/30 text-white h-14 rounded-2xl placeholder:text-white/50"
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
                      className="pl-12 bg-white/20 border-white/30 text-white h-14 rounded-2xl placeholder:text-white/50"
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
                      className="pl-12 bg-white/20 border-white/30 text-white h-14 rounded-2xl placeholder:text-white/50"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white mb-3 block text-sm font-medium">I am a:</Label>
                  <RadioGroup value={formData.role} onValueChange={handleRoleChange} className="grid grid-cols-2 gap-4">
                    <label className={`p-4 rounded-2xl border cursor-pointer transition-all ${formData.role === 'owner' ? 'border-white/40 bg-white/20' : 'border-white/30 hover:bg-white/10'}`}>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="owner" id="owner" />
                        <div>
                          <div className="font-medium text-white text-sm">Owner</div>
                          <div className="text-xs text-white/70">I have property to rent</div>
                        </div>
                      </div>
                    </label>

                    <label className={`p-4 rounded-2xl border cursor-pointer transition-all ${formData.role === 'tenant' ? 'border-white/40 bg-white/20' : 'border-white/30 hover:bg-white/10'}`}>
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="tenant" id="tenant" />
                        <div>
                          <div className="font-medium text-white text-sm">Tenant</div>
                          <div className="text-xs text-white/70">I'm looking for property</div>
                        </div>
                      </div>
                    </label>
                  </RadioGroup>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-white text-purple-600 font-semibold rounded-2xl text-lg mt-8 hover:bg-white/95 transition-all"
                >
                  Update Profile →
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../ui/Logo';
import api from '../../services/api';                    // ← Real API
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreatePost() {
  const [searchParams] = useSearchParams();
  const flatType = searchParams.get('type') || 'family';

  const { user } = useAuth();
  const navigate = useNavigate();

  const [postType, setPostType] = useState('offer');
  const [roomType, setRoomType] = useState('needed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    area: '',
    rent: '',
    budget: '',
    rooms: '',
    floor: '',
    bathrooms: '',
    balconies: '',
    hasLift: 'yes',
    utilityCost: '',
    availableFrom: '',
    moveInDate: '',
    distanceFrom: '',
    distanceKm: '',
    description: '',
    sharedFacilities: '',
    rentShare: '',
  });

  const [imageUrls, setImageUrls] = useState([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user) {
      setError('Please login first');
      setLoading(false);
      return;
    }

    // Basic validation
    if (!formData.area.trim() || !formData.description.trim()) {
      setError('Area and Description are required');
      setLoading(false);
      return;
    }

    try {
      const postData = {
        type: flatType,
        postType,
        area: formData.area,
        description: formData.description,
        images: imageUrls,
        rooms: formData.rooms ? parseInt(formData.rooms) : undefined,
        distanceFrom: formData.distanceFrom || undefined,
        distanceKm: formData.distanceKm ? parseFloat(formData.distanceKm) : undefined,
      };

      // Add price fields based on postType and flatType
      if (postType === 'offer') {
        if (flatType === 'family') {
          postData.rent = formData.rent ? parseInt(formData.rent) : undefined;
          postData.availableFrom = formData.availableFrom || undefined;
        } else {
          postData.rentShare = formData.rentShare ? parseInt(formData.rentShare) : undefined;
        }
      } else {
        postData.budget = formData.budget ? parseInt(formData.budget) : undefined;
        postData.moveInDate = formData.moveInDate || undefined;
      }

      // Family specific fields
      if (flatType === 'family') {
        postData.floor = formData.floor ? parseInt(formData.floor) : undefined;
        postData.bathrooms = formData.bathrooms ? parseInt(formData.bathrooms) : undefined;
        postData.balconies = formData.balconies ? parseInt(formData.balconies) : undefined;
        postData.hasLift = formData.hasLift === 'yes';
        postData.utilityCost = formData.utilityCost ? parseInt(formData.utilityCost) : undefined;
      }

      // Bachelor specific fields
      if (flatType === 'bachelor') {
        postData.roomType = roomType;
        postData.sharedFacilities = formData.sharedFacilities || undefined;
      }

      const response = await api.post('/posts', postData);

      alert('Post created successfully!');
      navigate('/listings');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDemoImage = () => {
    const newImage = `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/600`;
    setImageUrls(prev => [...prev, newImage]);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 5;

    if (imageUrls.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    files.forEach(file => {
      if (file.size > 2 * 1024 * 1024) {
        alert('Each image must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrls(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo variant="gradient" size="md" to="/dashboard" />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Create {flatType === 'family' ? 'Family' : 'Bachelor'} {postType === 'offer' ? 'Offer' : 'Requirement'}
            </h1>
            <p className="text-gray-600 mt-1">Fill in the details below</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post Type */}
            <div>
              <Label className="text-base font-medium">What would you like to do?</Label>
              <RadioGroup value={postType} onValueChange={setPostType} className="flex gap-6 mt-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offer" id="offer" />
                  <Label htmlFor="offer" className="cursor-pointer">I want to Offer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="requirement" id="requirement" />
                  <Label htmlFor="requirement" className="cursor-pointer">I am Looking For</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Area */}
            <div>
              <Label htmlFor="area">Area Name *</Label>
              <Input
                id="area"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                placeholder="Dhanmondi, Mirpur, Gulshan..."
                required
              />
            </div>

            {/* Price Section */}
            {postType === 'offer' ? (
              <div>
                <Label>
                  {flatType === 'family' ? 'Monthly Rent (BDT) *' : 'Rent Share per Person (BDT) *'}
                </Label>
                <Input
                  type="number"
                  name={flatType === 'family' ? 'rent' : 'rentShare'}
                  value={flatType === 'family' ? formData.rent : formData.rentShare}
                  onChange={handleInputChange}
                  placeholder="25000"
                  required
                />
              </div>
            ) : (
              <div>
                <Label>Maximum Budget (BDT) *</Label>
                <Input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  placeholder="20000"
                  required
                />
              </div>
            )}

            {/* Rooms */}
            <div>
              <Label htmlFor="rooms">Number of Rooms *</Label>
              <Input
                id="rooms"
                name="rooms"
                type="number"
                value={formData.rooms}
                onChange={handleInputChange}
                placeholder="3"
                required
              />
            </div>

            {/* Family Specific Fields */}
            {flatType === 'family' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="floor">Floor</Label>
                  <Input id="floor" name="floor" type="number" value={formData.floor} onChange={handleInputChange} placeholder="5" />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" name="bathrooms" type="number" value={formData.bathrooms} onChange={handleInputChange} placeholder="2" />
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                placeholder="Describe the property or your requirements..."
                required
              />
            </div>

            {/* Image Upload Section */}
            <div>
              <Label>Property Images (Max 5)</Label>
              <div className="mt-3">
                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img src={url} alt={`preview-${index}`} className="w-full h-24 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-6 text-center">
                    <Upload className="mx-auto mb-2 text-gray-500" />
                    <span className="text-sm font-medium">Upload Images</span>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>

                  <Button type="button" variant="outline" onClick={handleAddDemoImage} className="flex-1">
                    Add Sample Image
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 h-12"
              >
                {loading ? 'Creating Post...' : 'Create Post'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1 h-12">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
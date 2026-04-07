import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../ui/Logo';
import { addPost } from '../../data/mockData';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ArrowLeft, Upload } from 'lucide-react';

export default function CreatePost() {
  const [searchParams] = useSearchParams();
  const flatType = searchParams.get('type') || 'family';

  const { user } = useAuth();
  const navigate = useNavigate();

  const [postType, setPostType] = useState('offer');
  const [roomType, setRoomType] = useState('needed');

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please login first');
      navigate('/login');
      return;
    }

    // Validation
    if (!formData.area.trim()) {
      alert('Please enter area name');
      return;
    }

    if (!formData.description.trim()) {
      alert('Please enter description');
      return;
    }

    // Price validation based on post type
    if (postType === 'offer') {
      if (flatType === 'family' && !formData.rent) {
        alert('Please enter monthly rent amount');
        return;
      }
      if (flatType === 'bachelor' && !formData.rentShare) {
        alert('Please enter rent share amount');
        return;
      }
    }

    if (postType === 'requirement' && !formData.budget) {
      alert('Please enter budget');
      return;
    }

    try {
      const priceValue = 
        postType === 'offer' 
          ? (flatType === 'family' ? parseInt(formData.rent) : parseInt(formData.rentShare))
          : parseInt(formData.budget);

      const newPost = {
        id: Math.random().toString(36).substr(2, 9),
        type: flatType,
        postType,
        userId: user.id,
        userName: user.name,
        userPhoto: user.photo,
        area: formData.area,
        description: formData.description,
        images: imageUrls,
        createdAt: new Date().toISOString(),
        price: priceValue,

        ...(postType === 'offer' && {
          rent: flatType === 'family' ? (formData.rent ? parseInt(formData.rent) : undefined) : undefined,
          rentShare: flatType === 'bachelor' ? (formData.rentShare ? parseInt(formData.rentShare) : undefined) : undefined,
          availableFrom: formData.availableFrom,
        }),
        ...(postType === 'requirement' && {
          budget: formData.budget ? parseInt(formData.budget) : undefined,
          moveInDate: formData.moveInDate,
        }),
        ...(formData.rooms && { rooms: parseInt(formData.rooms) }),
        ...(formData.distanceFrom && { distanceFrom: formData.distanceFrom }),
        ...(formData.distanceKm && { distanceKm: parseFloat(formData.distanceKm) }),

        ...(flatType === 'family' && {
          floor: formData.floor ? parseInt(formData.floor) : undefined,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
          balconies: formData.balconies ? parseInt(formData.balconies) : undefined,
          hasLift: formData.hasLift === 'yes',
          utilityCost: formData.utilityCost ? parseInt(formData.utilityCost) : undefined,
        }),

        ...(flatType === 'bachelor' && {
          roomType,
          sharedFacilities: formData.sharedFacilities,
        }),
      };

      addPost(newPost);
      alert('Post created successfully!');
      navigate('/listings');
    } catch (error) {
      console.error('Error creating post:', error);
      alert(`Error creating post: ${error.message || 'Please try again.'}`);
    }
  };

  const handleAddImage = () => {
    // Demo image (works reliably)
    const newImage = `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/800/600`;
    setImageUrls([...imageUrls, newImage]);
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (files) {
      const maxImages = 5; // Limit to 5 images
      const remainingSlots = maxImages - imageUrls.length;
      
      if (remainingSlots <= 0) {
        alert('Maximum 5 images allowed');
        return;
      }

      Array.from(files).slice(0, remainingSlots).forEach(file => {
        // Check file size (limit to 2MB per image)
        if (file.size > 2 * 1024 * 1024) {
          alert('Image must be less than 2MB');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          setImageUrls(prev => {
            if (prev.length < maxImages) {
              return [...prev, event.target.result];
            }
            return prev;
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo variant="gradient" size="md" to="/dashboard" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create {flatType === 'family' ? 'Family' : 'Bachelor'} Flat Post
            </h1>
            <p className="text-gray-600">Fill in the details to create your post</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post Type Selection */}
            <div>
              <Label>What would you like to do?</Label>
              <RadioGroup
                value={postType}
                onValueChange={setPostType}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offer" id="offer" />
                  <Label htmlFor="offer">Post an Offer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="requirement" id="requirement" />
                  <Label htmlFor="requirement">Post a Requirement</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Bachelor Room Type */}
            {flatType === 'bachelor' && postType === 'offer' && (
              <div>
                <Label>Room Type</Label>
                <RadioGroup
                  value={roomType}
                  onValueChange={setRoomType}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="needed" id="needed" />
                    <Label htmlFor="needed">Roommate Needed</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="available" id="available" />
                    <Label htmlFor="available">Room Available</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Area */}
            <div>
              <Label htmlFor="area">Area Name *</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="e.g., Dhanmondi, Gulshan, Mirpur"
                required
                className="mt-1"
              />
            </div>

            {/* Rent / Budget */}
            {postType === 'offer' ? (
              <div>
                <Label htmlFor="rent">
                  {flatType === 'bachelor' ? 'Rent Share Amount' : 'Monthly Rent'} (BDT) *
                </Label>
                <Input
                  id="rent"
                  type="number"
                  value={flatType === 'bachelor' ? formData.rentShare : formData.rent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [flatType === 'bachelor' ? 'rentShare' : 'rent']: e.target.value,
                    })
                  }
                  placeholder="25000"
                  required
                  className="mt-1"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="budget">Budget (BDT) *</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="20000"
                  required
                  className="mt-1"
                />
              </div>
            )}

            {/* Rooms */}
            <div>
              <Label htmlFor="rooms">Number of Rooms *</Label>
              <Input
                id="rooms"
                type="number"
                value={formData.rooms}
                onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                placeholder="3"
                required
                className="mt-1"
              />
            </div>

            {/* Family Flat Specific Fields */}
            {flatType === 'family' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="floor">Floor Number</Label>
                    <Input
                      id="floor"
                      type="number"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      placeholder="5"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                      placeholder="2"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="balconies">Balconies</Label>
                    <Input
                      id="balconies"
                      type="number"
                      value={formData.balconies}
                      onChange={(e) => setFormData({ ...formData, balconies: e.target.value })}
                      placeholder="1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Lift Available</Label>
                    <RadioGroup
                      value={formData.hasLift}
                      onValueChange={(v) => setFormData({ ...formData, hasLift: v })}
                      className="flex gap-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="lift-yes" />
                        <Label htmlFor="lift-yes">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="lift-no" />
                        <Label htmlFor="lift-no">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {postType === 'offer' && (
                  <div>
                    <Label htmlFor="utilityCost">Utility Cost (BDT/month)</Label>
                    <Input
                      id="utilityCost"
                      type="number"
                      value={formData.utilityCost}
                      onChange={(e) => setFormData({ ...formData, utilityCost: e.target.value })}
                      placeholder="3000"
                      className="mt-1"
                    />
                  </div>
                )}
              </>
            )}

            {/* Bachelor Flat Specific Fields */}
            {flatType === 'bachelor' && (
              <div>
                <Label htmlFor="sharedFacilities">Shared Facilities</Label>
                <Input
                  id="sharedFacilities"
                  value={formData.sharedFacilities}
                  onChange={(e) => setFormData({ ...formData, sharedFacilities: e.target.value })}
                  placeholder="Kitchen, Bathroom, Living Room"
                  className="mt-1"
                />
              </div>
            )}

            {/* Distance */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="distanceFrom">Distance From (Landmark)</Label>
                <Input
                  id="distanceFrom"
                  value={formData.distanceFrom}
                  onChange={(e) => setFormData({ ...formData, distanceFrom: e.target.value })}
                  placeholder="Dhaka University"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="distanceKm">Distance (km)</Label>
                <Input
                  id="distanceKm"
                  type="number"
                  step="0.1"
                  value={formData.distanceKm}
                  onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                  placeholder="2.5"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Available From / Move In Date */}
            {postType === 'offer' ? (
              <div>
                <Label htmlFor="availableFrom">Available From</Label>
                <Input
                  id="availableFrom"
                  value={formData.availableFrom}
                  onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                  placeholder="March 2026"
                  className="mt-1"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="moveInDate">Preferred Move-in Date</Label>
                <Input
                  id="moveInDate"
                  value={formData.moveInDate}
                  onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                  placeholder="March 2026"
                  className="mt-1"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the property or your requirements in detail..."
                rows={4}
                required
                className="mt-1"
              />
            </div>

            {/* Image Upload */}
            {postType === 'offer' && (
              <div>
                <Label>Property Images (optional)</Label>
                <div className="mt-2 space-y-3">
                  {/* Image Preview Grid */}
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {imageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* File Input */}
                  <div>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 bg-gray-50 hover:bg-blue-50 transition-colors">
                      <Upload className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Click to upload images or drag and drop</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB each</p>
                  </div>

                  {/* Add Demo Image Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddImage}
                    className="w-full gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Add Sample Image
                  </Button>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                Create Post
              </Button>
              <Button
                type="button"
                onClick={() => navigate('/dashboard')}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
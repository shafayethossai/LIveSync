import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Logo } from '../ui/Logo';
import { getPosts } from '../../data/mockData';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ArrowLeft, MapPin, Bed, Bath, Wind, Building2, Users, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PostDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { admin } = useAdminAuth();
  const navigate = useNavigate();

  const posts = getPosts();
  const post = posts.find(p => p.id === id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Determine if we came from admin portal
  const isFromAdmin = searchParams.get('from') === 'admin' || admin;

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Post not found</h2>
          <Button onClick={() => navigate(isFromAdmin ? '/admin/posts' : '/listings')}>
            Back to {isFromAdmin ? 'Posts' : 'Listings'}
          </Button>
        </div>
      </div>
    );
  }

  const handleMessage = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/messages?postId=${post.id}`);
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % post.images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Logo variant="gradient" size="md" to="/dashboard" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => navigate(isFromAdmin ? '/admin/posts' : '/listings')} 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {isFromAdmin ? 'Posts' : 'Listings'}
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {post.images.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="relative h-96 bg-gray-200">
                  <img src={post.images[currentImageIndex]} alt={post.area} className="w-full h-full object-cover" />
                  {post.images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg">
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {post.images.length}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-96 flex items-center justify-center">
                {post.type === 'family' ? <Building2 className="w-24 h-24 text-gray-400" /> : <Users className="w-24 h-24 text-gray-400" />}
              </div>
            )}

            {/* Property Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex gap-2 mb-3">
                    <Badge className={post.type === 'family' ? 'bg-blue-500' : 'bg-green-500'}>
                      {post.type === 'family' ? 'Family Flat' : 'Bachelor Flat'}
                    </Badge>
                    <Badge variant="outline">{post.postType === 'offer' ? 'Available' : 'Looking For'}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <h1 className="text-3xl font-bold">{post.area}</h1>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    ৳{(post.rent || post.rentShare || post.budget || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">per month</div>
                </div>
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {post.rooms && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Bed className="w-5 h-5 text-blue-600" />
                    <div><div className="text-sm text-gray-600">Bedrooms</div><div className="font-semibold">{post.rooms}</div></div>
                  </div>
                )}
                {post.bathrooms && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Bath className="w-5 h-5 text-blue-600" />
                    <div><div className="text-sm text-gray-600">Bathrooms</div><div className="font-semibold">{post.bathrooms}</div></div>
                  </div>
                )}
                {post.hasLift !== undefined && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Wind className="w-5 h-5 text-blue-600" />
                    <div><div className="text-sm text-gray-600">Lift</div><div className="font-semibold">{post.hasLift ? 'Yes' : 'No'}</div></div>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">{post.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-24">
              <h3 className="font-semibold text-lg mb-6">Posted By</h3>
              <div className="flex items-center gap-4 mb-8">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={post.userPhoto} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                    {post.userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{post.userName}</div>
                  <div className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <Button onClick={handleMessage} className="w-full h-12 gap-2 bg-gradient-to-r from-blue-600 to-green-600">
                <MessageCircle className="w-4 h-4" />
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
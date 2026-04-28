import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Logo } from '../ui/Logo';
import api from '../../services/api';                    // ← Real API
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { ArrowLeft, MapPin, Bed, Bath, Wind, Building2, Users, ChevronLeft, ChevronRight, MessageCircle, Loader, RotateCcw } from 'lucide-react';

export default function PostDetails() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { admin } = useAdminAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isFromAdmin = searchParams.get('from') === 'admin' || admin;

  // Fetch post with retry logic
  const fetchPost = async (attempts = 0) => {
    try {
      setError('');
      setRetrying(attempts > 0);
      const response = await api.get(`/posts/${id}`);
      setPost(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch post", error);
      
      // Retry logic: exponential backoff (1s, 2s, 4s)
      if (attempts < 2) {
        const delay = Math.pow(2, attempts) * 1000;
        console.log(`Retrying in ${delay}ms... (attempt ${attempts + 1})`);
        setTimeout(() => {
          fetchPost(attempts + 1);
        }, delay);
      } else {
        setError('Failed to load post. Please check your connection and try again.');
        setPost(null);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleRetry = () => {
    setLoading(true);
    fetchPost();
  };

  const handleMessageOwner = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const ownerId = post?.user_id || post?.userId;
    const ownerName = post?.user_name || post?.userName || 'User';
    navigate(`/messages?postId=${id}&ownerId=${ownerId}&ownerName=${encodeURIComponent(ownerName)}`);
  };

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % (post?.images?.length || 1));
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + (post?.images?.length || 1)) % (post?.images?.length || 1));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading post details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Unable to Load Post</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleRetry}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {loading ? 'Retrying...' : 'Try Again'}
            </Button>
            <Button
              onClick={() => navigate(isFromAdmin ? '/admin/posts' : '/listings')}
              variant="outline"
            >
              Back to {isFromAdmin ? 'Posts' : 'Listings'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Post not found</h2>
          <Button onClick={() => navigate(isFromAdmin ? '/admin/posts' : '/listings')}>
            Back to {isFromAdmin ? 'Admin Posts' : 'Listings'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm">
        <div className="w-full px-2 sm:px-4 lg:px-8 py-2 sm:py-4">
          <Logo variant="gradient" size="sm" to="/dashboard" className="flex-shrink-0" />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button 
          onClick={() => navigate(isFromAdmin ? '/admin/posts' : '/listings')} 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {isFromAdmin ? 'Posts' : 'Listings'}
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            {post.images?.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="relative h-96 bg-gray-200">
                  <img 
                    src={post.images[currentImageIndex]} 
                    alt={post.area} 
                    className="w-full h-full object-cover" 
                  />
                  {post.images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg">
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg h-96 flex items-center justify-center">
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

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed">{post.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar - Poster Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-24">
              <h3 className="font-semibold text-lg mb-6">Posted By</h3>
              <div className="flex items-center gap-4 mb-8">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={post.userPhoto} />
                  <AvatarFallback>{post.userName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-gray-900">{post.userName}</div>
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400 mb-1">Posted on</div>
                  <div className="text-sm text-slate-600">
                    {(() => {
                      const rawDate = post.createdAt || post.created_at;
                      const date = rawDate ? new Date(rawDate) : null;
                      if (!date || Number.isNaN(date.getTime())) {
                        return 'Date unavailable';
                      }

                      return date.toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      }).replace(',', ' ·');
                    })()}
                  </div>
                </div>
              </div>

              <Button
                onClick={handleMessageOwner}
                className="w-full h-12 gap-2 bg-gradient-to-r from-blue-600 to-green-600"
              >
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
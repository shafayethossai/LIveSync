import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../ui/Logo';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, MapPin, Bed, Building2, Users, MessageCircle, Loader, RotateCcw } from 'lucide-react';

export default function Listings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20; // Load 20 posts per page

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPostType, setFilterPostType] = useState('all');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [minRooms, setMinRooms] = useState('');
  const [hasLift, setHasLift] = useState('all');
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  // Fetch posts with retry logic
  const fetchPosts = async (page = 1, attempts = 0) => {
    try {
      setRetrying(attempts > 0);
      setError('');
      
      const response = await api.get(`/posts?page=${page}&limit=${PAGE_SIZE}`);
      console.log('Posts API response:', response.data);
      
      // Handle both formats: direct array or object with posts array and pagination
      let postsData = [];
      let pagination = { total: 0, page: 1, limit: PAGE_SIZE };
      
      if (Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response.data.posts) {
        postsData = response.data.posts;
        pagination = response.data.pagination || { total: postsData.length, page, limit: PAGE_SIZE };
      }
      
      setPosts(postsData);
      setTotalCount(pagination.total || 0);
      setTotalPages(Math.ceil((pagination.total || 0) / PAGE_SIZE));
      setCurrentPage(pagination.page || page);
      setRetryCount(0);
    } catch (error) {
      console.error("Failed to fetch posts", error);
      
      // Retry logic: exponential backoff (1s, 2s, 4s)
      if (attempts < 2) {
        const delay = Math.pow(2, attempts) * 1000;
        console.log(`Retrying in ${delay}ms... (attempt ${attempts + 1})`);
        setTimeout(() => {
          setRetryCount(attempts + 1);
          fetchPosts(page, attempts + 1);
        }, delay);
      } else {
        setError('Failed to load listings. Please check your connection and try again.');
        setPosts([]);
        setRetryCount(0);
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  // Fetch posts when page changes
  useEffect(() => {
    setLoading(true);
    fetchPosts(currentPage);
  }, [currentPage]);

  // Manual retry button
  const handleRetry = () => {
    setRetryCount(0);
    fetchPosts(currentPage);
  };

  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return [];
    
    return posts.filter((post) => {
      if (searchTerm && !post.area.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterType !== 'all' && post.type !== filterType) return false;
      if (filterPostType !== 'all' && post.post_type !== filterPostType) return false;

      const postRent = post.rent || post.rent_share || post.budget || 0;
      if (minRent && postRent < parseInt(minRent)) return false;
      if (maxRent && postRent > parseInt(maxRent)) return false;
      if (minRooms && post.rooms && post.rooms < parseInt(minRooms)) return false;

      if (hasLift !== 'all' && post.type === 'family') {
        if (hasLift === 'yes' && !post.has_lift) return false;
        if (hasLift === 'no' && post.has_lift) return false;
      }
      return true;
    });
  }, [posts, searchTerm, filterType, filterPostType, minRent, maxRent, minRooms, hasLift]);

  const handleMessageOwner = (post) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const ownerId = post.user_id || post.userId;
    const ownerName = post.user_name || post.userName || 'User';
    navigate(`/messages?postId=${post.id}&ownerId=${ownerId}&ownerName=${encodeURIComponent(ownerName)}`);
  };

  // Pagination helpers
  const getPaginationNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  if (loading && !retrying && currentPage === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="w-full px-2 sm:px-4 lg:px-8 py-2 sm:py-4 flex items-center justify-between gap-1 sm:gap-4">
          <Logo size="sm" className="flex-shrink-0" />
          <div className="flex items-center gap-1 sm:gap-3 relative">
            <Button
              onClick={() => setShowCreateOptions((prev) => !prev)}
              className="bg-gradient-to-r from-blue-600 to-green-600 px-1.5 sm:px-4 py-1 sm:py-2 h-auto text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">Create Post</span>
              <span className="sm:hidden">+</span>
            </Button>
            {showCreateOptions && (
              <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 w-52 z-20">
                <Button
                  onClick={() => {
                    setShowCreateOptions(false);
                    navigate('/create-post?type=family');
                  }}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  Family Post
                </Button>
                <Button
                  onClick={() => {
                    setShowCreateOptions(false);
                    navigate('/create-post?type=bachelor');
                  }}
                  variant="ghost"
                  className="w-full justify-start"
                >
                  Bachelor Post
                </Button>
              </div>
            )}
            {user && (
              <Button onClick={() => navigate('/profile')} variant="outline" className="px-1.5 sm:px-4 py-1 sm:py-2 h-auto text-xs sm:text-sm">
                <span className="hidden sm:inline">{user.name || 'Profile'}</span>
                <span className="sm:hidden">👤</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="bachelor">Bachelor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPostType} onValueChange={setFilterPostType}>
              <SelectTrigger>
                <SelectValue placeholder="Post Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Post Types</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="requirement">Requirement</SelectItem>
              </SelectContent>
            </Select>

            <Select value={hasLift} onValueChange={setHasLift}>
              <SelectTrigger>
                <SelectValue placeholder="Lift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Lift</SelectItem>
                <SelectItem value="yes">With Lift</SelectItem>
                <SelectItem value="no">Without Lift</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Min rent"
              value={minRent}
              onChange={(e) => setMinRent(e.target.value)}
              className="rounded-lg"
            />

            <Input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Max rent"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              className="rounded-lg"
            />

            <Input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Min rooms"
              value={minRooms}
              onChange={(e) => setMinRooms(e.target.value)}
              className="rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {filteredPosts.length} Listings Found
            {totalCount > 0 && <span className="text-sm font-normal text-gray-600"> (Total: {totalCount})</span>}
          </h1>
          {retrying && (
            <span className="text-sm text-amber-600 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Retrying... (Attempt {retryCount})
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Unable to Load Listings</h3>
            <p className="text-red-700 text-sm mb-3">{error}</p>
            <Button
              onClick={handleRetry}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {loading ? 'Retrying...' : 'Try Again'}
            </Button>
          </div>
        )}

        {filteredPosts.length === 0 && !error ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No listings found. Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer group"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  {/* Image */}
                  {post.images && post.images.length > 0 ? (
                    <img
                      src={post.images[0]}
                      alt="Post"
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    {/* Type and Post Type Badge */}
                    <div className="flex gap-2 mb-3">
                      <Badge className="bg-blue-100 text-blue-800">
                        {post.type === 'family' ? 'Family' : 'Bachelor'}
                      </Badge>
                      <Badge className="bg-green-100 text-green-800">
                        {post.post_type === 'offer' ? 'Offer' : 'Requirement'}
                      </Badge>
                    </div>

                    {/* Area */}
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <p className="font-semibold text-gray-900">{post.area}</p>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {post.description}
                    </p>

                    {/* Rooms and Price */}
                    <div className="flex items-center justify-between mb-3">
                      {post.rooms && (
                        <div className="flex items-center gap-1">
                          <Bed className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{post.rooms} rooms</span>
                        </div>
                      )}
                      {post.rent && (
                        <span className="font-bold text-green-600">
                          ৳{post.rent.toLocaleString()}
                        </span>
                      )}
                      {post.rent_share && (
                        <span className="font-bold text-green-600">
                          ৳{post.rent_share.toLocaleString()}
                        </span>
                      )}
                      {post.budget && (
                        <span className="font-bold text-green-600">
                          Budget: ৳{post.budget.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Views */}
                    <div className="text-xs text-gray-500 mb-3">
                      {post.views_count} views • {post.post_type}
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessageOwner(post);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message Owner
                    </Button>

                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                <Button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  variant={currentPage === 1 ? "disabled" : "outline"}
                  className="px-4 py-2"
                >
                  Previous
                </Button>

                {getPaginationNumbers().map((page) => (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                    variant={currentPage === page ? "default" : "outline"}
                    className={`px-3 py-2 ${currentPage === page ? 'bg-blue-600 text-white' : ''}`}
                  >
                    {page}
                  </Button>
                ))}

                <Button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages || loading}
                  variant={currentPage === totalPages ? "disabled" : "outline"}
                  className="px-4 py-2"
                >
                  Next
                </Button>
              </div>
            )}

            {/* Page Info */}
            <div className="text-center text-sm text-gray-600 mb-4">
              Page {currentPage} of {totalPages} • Showing {filteredPosts.length} posts
            </div>
          </>
        )}
      </main>
    </div>
  );
}

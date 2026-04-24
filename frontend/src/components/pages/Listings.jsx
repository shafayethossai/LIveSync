import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../ui/Logo';
import api from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, MapPin, Bed, Building2, Users } from 'lucide-react';

export default function Listings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPostType, setFilterPostType] = useState('all');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [minRooms, setMinRooms] = useState('');
  const [hasLift, setHasLift] = useState('all');
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  // Fetch real posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get('/posts');
        console.log('Posts API response:', response.data);
        
        // Handle both formats: direct array or object with posts array
        const postsData = Array.isArray(response.data) ? response.data : response.data.posts || [];
        console.log('Posts data extracted:', postsData);
        setPosts(postsData);
      } catch (error) {
        console.error("Failed to fetch posts", error);
        setError('Failed to load listings');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading listings...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4 relative">
            <Button
              onClick={() => setShowCreateOptions((prev) => !prev)}
              className="bg-gradient-to-r from-blue-600 to-green-600"
            >
              Create Post
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
              <Button onClick={() => navigate('/profile')} variant="outline">
                {user.name || 'Profile'}
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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {filteredPosts.length} Listings Found
          </h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No listings found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
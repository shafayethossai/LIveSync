import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { getPosts, savePosts } from '../../../data/mockData';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Shield, Search, ArrowLeft, MapPin, Building2, Users, Bed, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

export default function AdminPosts() {
  const { admin, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPostType, setFilterPostType] = useState('all');

  useEffect(() => {
    if (isLoading) return;
    
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    setPosts(getPosts());
  }, [admin, navigate, isLoading]);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || post.type === filterType;
    const matchesPostType = filterPostType === 'all' || post.postType === filterPostType;

    return matchesSearch && matchesType && matchesPostType;
  });

  const handleDeletePost = (postId) => {
    if (window.confirm('Delete this post?')) {
      const updated = posts.filter(p => p.id !== postId);
      setPosts(updated);
      savePosts(updated);
    }
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                LiveSync Admin
              </span>
            </Link>
            <div className="flex items-center gap-8">
              <Link to="/admin/dashboard" className="text-gray-700 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link to="/admin/users" className="text-gray-700 hover:text-gray-900 font-medium">
                Manage Users
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 mb-6 text-indigo-600 hover:text-indigo-700 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Post Management</h1>
          <p className="text-gray-500 mb-6">{filteredPosts.length} posts found</p>

          <div className="flex gap-4 mb-6 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by area or user name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="bachelor">Bachelor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPostType} onValueChange={setFilterPostType}>
              <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
                <SelectValue placeholder="All Posts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="requirement">Requirement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredPosts.map((post) => {
              const images = post.images || [];
              const currentImage = images.length > 0 ? images[0] : null;

              return (
                <div key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image */}
                  <div className="relative h-40 bg-gray-100">
                    {currentImage ? (
                      <img src={currentImage} alt={post.area} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    {/* Badges */}
                    <div className="flex gap-2 mb-3">
                      <Badge className={post.type === 'family' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-green-500 text-white hover:bg-green-600'}>
                        {post.type}
                      </Badge>
                      <Badge variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-300">
                        {post.postType}
                      </Badge>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">{post.area}</h3>
                    </div>

                    {/* Price */}
                    <p className="text-lg font-bold text-gray-900 mb-2">৳{post.price?.toLocaleString()}</p>

                    {/* Posted by */}
                    <p className="text-sm text-gray-600 mb-2">Posted by: {post.userName}</p>

                    {/* Rooms */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Bed className="w-4 h-4" />
                      <span>{post.rooms || 1} Rooms</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => navigate(`/post/${post.id}?from=admin`)}
                      >
                        View
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
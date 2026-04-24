import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import api from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Shield, Search, ArrowLeft, MapPin, Building2, Bed, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

export default function AdminPosts() {
  const { admin, loading } = useAdminAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (loading) return;
    
    if (!admin) {
      navigate('/admin/login');
      return;
    }
    
    fetchPosts();
  }, [admin, navigate, loading, filterType, filterStatus, searchTerm]);

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      setError(null);
      
      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(filterType !== 'all' && { type: filterType }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      };
      
      const response = await api.get('/admin/posts', { params });
      
      if (response.data && Array.isArray(response.data.posts)) {
        setPosts(response.data.posts);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleViewPost = (postId) => {
    // Navigate to post details with from=admin parameter
    navigate(`/post/${postId}?from=admin`);
  };

  const handleApprovePost = async (postId) => {
    if (!window.confirm('Approve this post?')) return;
    
    try {
      setActionLoading(postId);
      setError(null);
      
      await api.put(`/admin/posts/${postId}/approve`);
      
      // Refresh posts list
      await fetchPosts();
    } catch (err) {
      console.error('Error approving post:', err);
      setError(err.response?.data?.message || 'Failed to approve post');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectPost = async (postId) => {
    if (!window.confirm('Reject this post?')) return;
    
    try {
      setActionLoading(postId);
      setError(null);
      
      await api.put(`/admin/posts/${postId}/reject`);
      
      // Refresh posts list
      await fetchPosts();
    } catch (err) {
      console.error('Error rejecting post:', err);
      setError(err.response?.data?.message || 'Failed to reject post');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    
    try {
      setActionLoading(postId);
      setError(null);
      
      await api.delete(`/admin/posts/${postId}`);
      
      // Refresh posts list
      await fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
      setError(err.response?.data?.message || 'Failed to delete post');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      (post.area || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.user_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

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

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

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

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40 bg-gray-50 border-gray-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {postsLoading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No posts found</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredPosts.map((post) => {
              const images = post.images || [];
              const currentImage = images.length > 0 ? images[0] : null;

              return (
                <div key={post.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* Image with overlay */}
                  <div className="relative h-40 bg-gray-100">
                    {currentImage ? (
                      <img src={currentImage} alt={post.area} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    {/* View Details Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button
                        onClick={() => handleViewPost(post.id)}
                        size="sm"
                        className="bg-white text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  <div className="p-4">
                    {/* Badges */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <Badge className={post.type === 'family' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-green-500 text-white hover:bg-green-600'}>
                        {post.type || 'Unknown'}
                      </Badge>
                      <Badge className={
                        post.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 
                        post.status === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-100' : 
                        'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                      }>
                        {post.status === 'inactive' ? 'Pending' : post.status || 'Unknown'}
                      </Badge>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">{post.area || 'N/A'}</h3>
                    </div>

                    {/* Price */}
                    <p className="text-lg font-bold text-gray-900 mb-2">{post.price ? `৳${post.price.toLocaleString()}` : 'N/A'}</p>

                    {/* Posted by */}
                    <p className="text-sm text-gray-600 mb-2">By: {post.user_name || 'Unknown'}</p>

                    {/* Rooms */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                      <Bed className="w-4 h-4" />
                      <span>{post.rooms || 1} Rooms</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {post.status !== 'active' && (
                        <Button 
                          size="sm"
                          onClick={() => handleApprovePost(post.id)}
                          disabled={actionLoading === post.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {post.status !== 'rejected' && post.status !== 'active' && (
                        <Button 
                          size="sm"
                          onClick={() => handleRejectPost(post.id)}
                          disabled={actionLoading === post.id}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      )}
                      <Button 
                        size="sm"
                        onClick={() => handleDeletePost(post.id)}
                        disabled={actionLoading === post.id}
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
          )}
        </div>
      </main>
    </div>
  );
}
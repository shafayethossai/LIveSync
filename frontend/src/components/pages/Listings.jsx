import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../ui/Logo';
import api from '../../services/api';           // ← Use real API
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, MapPin, Bed, Building2, Users, MessageCircle } from 'lucide-react';

export default function Listings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPostType, setFilterPostType] = useState('all');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [minRooms, setMinRooms] = useState('');
  const [hasLift, setHasLift] = useState('all');

  // Fetch real posts from backend
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await api.get('/posts');
        setPosts(response.data);
      } catch (error) {
        console.error("Failed to fetch posts", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (searchTerm && !post.area.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterType !== 'all' && post.type !== filterType) return false;
      if (filterPostType !== 'all' && post.postType !== filterPostType) return false;

      const postRent = post.rent || post.rentShare || post.budget || 0;
      if (minRent && postRent < parseInt(minRent)) return false;
      if (maxRent && postRent > parseInt(maxRent)) return false;
      if (minRooms && post.rooms && post.rooms < parseInt(minRooms)) return false;

      if (hasLift !== 'all' && post.type === 'family') {
        if (hasLift === 'yes' && !post.hasLift) return false;
        if (hasLift === 'no' && post.hasLift) return false;
      }
      return true;
    });
  }, [posts, searchTerm, filterType, filterPostType, minRent, maxRent, minRooms, hasLift]);

  const handleMessage = (postId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/messages?postId=${postId}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading listings...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header & Filters remain same as you had */}
      {/* ... (your existing header and filter section) */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{filteredPosts.length} Listings Found</h1>
          <Button onClick={() => navigate('/create-post?type=family')} className="bg-gradient-to-r from-blue-600 to-green-600">
            Create Post
          </Button>
        </div>

        {/* Rest of your card grid remains almost same */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
              {/* Your existing card content */}
              {/* ... */}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../ui/Logo';
import { getPosts } from '../../data/mockData';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, MapPin, Bed, Building2, Users, MessageCircle } from 'lucide-react';

export default function Listings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts] = useState(getPosts());

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPostType, setFilterPostType] = useState('all');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [minRooms, setMinRooms] = useState('');
  const [hasLift, setHasLift] = useState('all');

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
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
      })
      .sort((a, b) => {
        if (a.distanceKm && b.distanceKm) return a.distanceKm - b.distanceKm;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [posts, searchTerm, filterType, filterPostType, minRent, maxRent, minRooms, hasLift]);

  const handleMessage = (postId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/messages?postId=${postId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Logo variant="gradient" size="md" to="/dashboard" />
            <nav className="flex items-center gap-4">
              <Link to="/dashboard"><Button variant="ghost">Dashboard</Button></Link>
              <Link to="/messages"><Button variant="ghost">Messages</Button></Link>
              <Link to="/profile"><Button variant="outline">Profile</Button></Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by area name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="bachelor">Bachelor</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPostType} onValueChange={setFilterPostType}>
              <SelectTrigger><SelectValue placeholder="Post Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Posts</SelectItem>
                <SelectItem value="offer">Offers</SelectItem>
                <SelectItem value="requirement">Requirements</SelectItem>
              </SelectContent>
            </Select>

            <Input type="number" placeholder="Min Rent" value={minRent} onChange={(e) => setMinRent(e.target.value)} />
            <Input type="number" placeholder="Max Rent" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} />
            <Input type="number" placeholder="Min Rooms" value={minRooms} onChange={(e) => setMinRooms(e.target.value)} />

            <Select value={hasLift} onValueChange={setHasLift}>
              <SelectTrigger><SelectValue placeholder="Lift" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="yes">With Lift</SelectItem>
                <SelectItem value="no">No Lift</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Listings */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{filteredPosts.length} Listings Found</h1>
          <Button onClick={() => navigate('/create-post?type=family')} className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
            Create Post
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden cursor-pointer"
              onClick={() => navigate(`/post/${post.id}`)}
            >
              {post.images.length > 0 ? (
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img src={post.images[0]} alt={post.area} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                  {post.type === 'family' ? <Building2 className="w-16 h-16 text-gray-400" /> : <Users className="w-16 h-16 text-gray-400" />}
                </div>
              )}

              <div className="p-5">
                <div className="flex gap-2 mb-3">
                  <Badge variant={post.type === 'family' ? 'default' : 'secondary'} className={post.type === 'family' ? 'bg-blue-500' : 'bg-green-500'}>
                    {post.type === 'family' ? 'Family' : 'Bachelor'}
                  </Badge>
                  <Badge variant="outline">{post.postType === 'offer' ? 'Offer' : 'Looking For'}</Badge>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-lg">{post.area}</h3>
                </div>

                <div className="text-2xl font-bold text-gray-900 mb-3">
                  ৳{(post.rent || post.rentShare || post.budget || 0).toLocaleString()}
                  <span className="text-sm text-gray-500 font-normal">/month</span>
                </div>

                {post.rooms && (
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Bed className="w-4 h-4" /> {post.rooms} Rooms
                    </div>
                  </div>
                )}

                {post.distanceFrom && post.distanceKm && (
                  <p className="text-sm text-gray-600 mb-3">{post.distanceKm} km from {post.distanceFrom}</p>
                )}

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{post.description}</p>

                <Button
                  onClick={(e) => { e.stopPropagation(); handleMessage(post.id); }}
                  className="w-full gap-2"
                  variant="outline"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters</p>
            <Button onClick={() => {
              setSearchTerm(''); setFilterType('all'); setFilterPostType('all');
              setMinRent(''); setMaxRent(''); setMinRooms(''); setHasLift('all');
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
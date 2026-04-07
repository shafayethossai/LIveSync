import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Logo } from '../../ui/Logo';
import { getPosts } from '../../../data/mockData';
import { Button } from '../../ui/button';
import { Shield, Users, FileText, BarChart3, LogOut } from 'lucide-react';

export default function AdminDashboard() {
  const { admin, logoutAdmin, isLoading } = useAdminAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    familyPosts: 0,
    bachelorPosts: 0,
    offerPosts: 0,
    requirementPosts: 0,
  });

  useEffect(() => {
    if (isLoading) return;
    
    if (!admin) {
      navigate('/admin/login');
      return;
    }

    const posts = getPosts();
    const savedUsers = JSON.parse(localStorage.getItem('livesync_users') || '[]');

    setStats({
      totalUsers: savedUsers.length + 1,
      totalPosts: posts.length,
      familyPosts: posts.filter(p => p.type === 'family').length,
      bachelorPosts: posts.filter(p => p.type === 'bachelor').length,
      offerPosts: posts.filter(p => p.postType === 'offer').length,
      requirementPosts: posts.filter(p => p.postType === 'requirement').length,
    });
  }, [admin, navigate, isLoading]);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
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
              <Link to="/admin/users" className="text-gray-700 hover:text-gray-900 font-medium">
                Manage Users
              </Link>
              <Link to="/admin/posts" className="text-gray-700 hover:text-gray-900 font-medium">
                Manage Posts
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome back, Admin User</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Users</p>
                <p className="text-4xl font-bold text-purple-600">{stats.totalUsers}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Registered on platform</p>
          </div>

          {/* Total Posts */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Posts</p>
                <p className="text-4xl font-bold text-indigo-600">{stats.totalPosts}</p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Active listings</p>
          </div>

          {/* Family Posts */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Family Posts</p>
                <p className="text-4xl font-bold text-blue-600">{stats.familyPosts}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Family flat listings</p>
          </div>

          {/* Bachelor Posts */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Bachelor Posts</p>
                <p className="text-4xl font-bold text-green-600">{stats.bachelorPosts}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Bachelor flat listings</p>
          </div>

          {/* Offers */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Offers</p>
                <p className="text-4xl font-bold text-orange-600">{stats.offerPosts}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Available properties</p>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Requirements</p>
                <p className="text-4xl font-bold text-pink-600">{stats.requirementPosts}</p>
              </div>
              <div className="bg-pink-100 p-3 rounded-lg">
                <FileText className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500">Looking for properties</p>
          </div>
        </div>

        {/* Management Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-3">User Management</h3>
            <p className="text-gray-600 mb-6">View, edit, and manage all registered users on the platform.</p>
            <Link to="/admin/users">
              <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg">
                Manage Users
              </Button>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Post Management</h3>
            <p className="text-gray-600 mb-6">Monitor, approve, or remove posts and listings from the platform.</p>
            <Link to="/admin/posts">
              <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg">
                Manage Posts
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
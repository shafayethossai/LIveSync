import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import api from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Shield, Search, ArrowLeft, User, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';

export default function AdminUsers() {
  const { admin, loading } = useAdminAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (loading) return;
    
    if (!admin) {
      navigate('/admin/login');
      return;
    }

    fetchUsers();
  }, [admin, navigate, loading, page, searchTerm]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setError(null);
      
      const params = {
        page,
        limit: pageSize,
        ...(searchTerm && { search: searchTerm })
      };
      
      const response = await api.get('/admin/users', { params });
      
      if (response.data && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Suspend this user?')) return;
    
    try {
      setActionLoading(userId);
      setError(null);
      
      await api.put(`/admin/users/${userId}/suspend`);
      
      // Refresh users list
      await fetchUsers();
    } catch (err) {
      console.error('Error suspending user:', err);
      setError(err.response?.data?.message || 'Failed to suspend user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateUser = async (userId) => {
    if (!window.confirm('Activate this user?')) return;
    
    try {
      setActionLoading(userId);
      setError(null);
      
      await api.put(`/admin/users/${userId}/activate`);
      
      // Refresh users list
      await fetchUsers();
    } catch (err) {
      console.error('Error activating user:', err);
      setError(err.response?.data?.message || 'Failed to activate user');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Link to="/admin/posts" className="text-gray-700 hover:text-gray-900 font-medium">
                Manage Posts
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-500 mb-6">{filteredUsers.length} users found</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>

          {usersLoading ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Joined</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className={index !== filteredUsers.length - 1 ? "border-b" : ""}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.photo} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold">
                            {(user.name || '').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700 mb-1">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-4 h-4" />
                        {user.phone || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={!user.is_active ? 'bg-red-100 text-red-700 hover:bg-red-100' : 'bg-green-100 text-green-700 hover:bg-green-100'}>
                        {!user.is_active ? 'Suspended' : 'Active'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {!user.is_active ? (
                          <Button 
                            size="sm" 
                            onClick={() => handleActivateUser(user.id)}
                            disabled={actionLoading === user.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Activate
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => handleSuspendUser(user.id)}
                            disabled={actionLoading === user.id}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Suspend
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
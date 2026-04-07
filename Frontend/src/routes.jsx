import { createBrowserRouter } from 'react-router-dom';

import Login from './components/pages/Login';
import Signup from './components/pages/Signup';
import ForgotPassword from './components/pages/ForgotPassword';
import Dashboard from './components/pages/Dashboard';
import Profile from './components/pages/Profile';
import CreatePost from './components/pages/CreatePost';
import Listings from './components/pages/Listings';
import PostDetails from './components/pages/PostDetails';
import Messages from './components/pages/Messages';

import AdminLogin from './components/pages/admin/AdminLogin';
import AdminDashboard from './components/pages/admin/AdminDashboard';
import AdminUsers from './components/pages/admin/AdminUsers';
import AdminPosts from './components/pages/admin/AdminPosts';

export const router = createBrowserRouter([
  { path: '/', element: <Login /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/profile', element: <Profile /> },
  { path: '/create-post', element: <CreatePost /> },
  { path: '/listings', element: <Listings /> },
  { path: '/post/:id', element: <PostDetails /> },
  { path: '/messages', element: <Messages /> },

  { path: '/admin/login', element: <AdminLogin /> },
  { path: '/admin/dashboard', element: <AdminDashboard /> },
  { path: '/admin/users', element: <AdminUsers /> },
  { path: '/admin/posts', element: <AdminPosts /> },
]);
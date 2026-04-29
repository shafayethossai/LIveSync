import { RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { router } from './routes';
import { AuthProvider } from './components/context/AuthContext';
import { AdminAuthProvider } from './components/context/AdminAuthContext';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <AdminAuthProvider>
          <RouterProvider router={router} />
        </AdminAuthProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
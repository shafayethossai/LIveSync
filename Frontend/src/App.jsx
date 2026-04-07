import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider } from './components/context/AuthContext';
import { AdminAuthProvider } from './components/context/AdminAuthContext';

export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <RouterProvider router={router} />
      </AdminAuthProvider>
    </AuthProvider>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ReportIssue from './pages/ReportIssue';
import MyComplaints from './pages/MyComplaints';
import AdminDashboard from './pages/AdminDashboard';
import ComplaintDetails from './pages/ComplaintDetails';
import Profile from './pages/Profile';

function ProtectedRoute({ children, allowedRole }) {
  const [authStatus, setAuthStatus] = useState('loading');
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        if (active) setAuthStatus('unauthorized');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            if (active) setAuthStatus('unauthorized');
            return;
          }

          throw new Error('Unable to verify your login session.');
        }

        const data = await response.json();
        const authenticatedUser = data.user || data;

        if (!authenticatedUser.role) {
          throw new Error('Invalid account information.');
        }

        localStorage.setItem('user', JSON.stringify(authenticatedUser));

        if (active) {
          setUser(authenticatedUser);
          setAuthStatus('authenticated');
        }
      } catch (error) {
        if (active) {
          setAuthStatus('error');
        }
      }
    };

    verifySession();

    return () => {
      active = false;
    };
  }, []);

  if (authStatus === 'loading') {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        Verifying your login session...
      </div>
    );
  }

  if (authStatus === 'error') {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Unable to verify your session</h2>
        <p>Please check that the CiviSynq backend is running.</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (authStatus === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin-dashboard" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Citizen Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRole="citizen">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRole="citizen">
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/report-issue"
          element={
            <ProtectedRoute allowedRole="citizen">
              <ReportIssue />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-complaints"
          element={
            <ProtectedRoute allowedRole="citizen">
              <MyComplaints />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/complaint-details/:id"
          element={
            <ProtectedRoute allowedRole="admin">
              <ComplaintDetails />
            </ProtectedRoute>
          }
        />

        {/* Unknown Routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

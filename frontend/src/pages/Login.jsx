
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import './Auth.css';

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      if (!data.token || !data.user || !data.user.role) {
        throw new Error('Invalid login response from server.');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.role === 'admin') {
        navigate('/admin-dashboard', { replace: true });
      } else if (data.user.role === 'citizen') {
        navigate('/dashboard', { replace: true });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Invalid account role.');
      }
    } catch (error) {
      setMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          Civi<span>Synq</span>
        </Link>

        <div className="auth-heading">
          <h1>Welcome Back!</h1>
          <p>Login to continue making your city better.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email Address</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {message && (
            <p style={{ color: '#dc2626', fontSize: '14px' }}>
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login to your account'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create Account</Link>
        </p>

        <Link to="/" className="back-home">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}

export default Login;

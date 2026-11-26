
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Profile.css';

const API_URL = 'http://localhost:5000/api';

function Profile() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: ''
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const savedUser = JSON.parse(localStorage.getItem('user') || 'null');

    if (savedUser?.role === 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load profile.');
        }

        setProfile(data.user);
      } catch (error) {
        setProfileError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const completionFields = [
    profile.fullName,
    profile.email,
    profile.phone
  ];

  const completedFields = completionFields.filter(
    (field) => field && field.trim()
  ).length;

  const completion = Math.round((completedFields / 3) * 100);

  const handleProfileChange = (event) => {
    setProfile({
      ...profile,
      [event.target.name]: event.target.value
    });
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileMessage('');
    setProfileError('');
    setSavingProfile(true);

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: profile.fullName,
          phone: profile.phone
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed.');
      }

      setProfile(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      setProfileMessage(data.message);
    } catch (error) {
      setProfileError(error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = (event) => {
    setPasswords({
      ...passwords,
      [event.target.name]: event.target.value
    });
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordMessage('');
    setPasswordError('');
    setSavingPassword(true);

    try {
      const response = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(passwords)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password change failed.');
      }

      setPasswordMessage(data.message);
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } catch (error) {
      setPasswordError(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (!token || loading) {
    return <div className="profile-loading">Loading your profile...</div>;
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <Link to="/dashboard" className="profile-logo">
          Civi<span>Synq</span>
        </Link>
        <Link to="/dashboard" className="profile-back-link">
          ← Back to Dashboard
        </Link>
      </header>

      <main className="profile-container">
        <section className="profile-intro">
          <p className="profile-eyebrow">ACCOUNT SETTINGS</p>
          <h1>My Profile</h1>
          <p>Manage your personal information and account security.</p>
        </section>

        <section className="profile-completion-card">
          <div className="completion-top">
            <div>
              <h2>Profile Completion</h2>
              <p>Keep your account information up to date.</p>
            </div>
            <strong>{completion}%</strong>
          </div>
          <div className="completion-track">
            <div style={{ width: `${completion}%` }} />
          </div>
          <p className="completion-caption">
            {completedFields} of 3 profile details completed
          </p>
        </section>

        <section className="profile-panel">
          <div className="profile-panel-heading">
            <div className="profile-avatar">
              {profile.fullName?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <h2>Personal Information</h2>
              <p>Update your name and contact number.</p>
            </div>
          </div>

          {profileError && <div className="profile-message error">{profileError}</div>}
          {profileMessage && <div className="profile-message success">{profileMessage}</div>}

          <form onSubmit={handleProfileSubmit}>
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              name="fullName"
              value={profile.fullName}
              onChange={handleProfileChange}
              minLength="2"
              maxLength="60"
              required
            />

            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              value={profile.email}
              disabled
            />
            <small className="profile-hint">Your registered email address cannot be changed here.</small>

            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={profile.phone}
              onChange={handleProfileChange}
              required
            />

            <button className="profile-primary-button" disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </section>

        <section className="profile-panel">
          <div className="profile-panel-heading">
            <div className="security-icon">🔒</div>
            <div>
              <h2>Change Password</h2>
              <p>Use a strong password with at least 8 characters.</p>
            </div>
          </div>

          {passwordError && <div className="profile-message error">{passwordError}</div>}
          {passwordMessage && <div className="profile-message success">{passwordMessage}</div>}

          <form onSubmit={handlePasswordSubmit}>
            <label htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              autoComplete="current-password"
              required
            />

            <label htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              minLength="8"
              autoComplete="new-password"
              required
            />

            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              name="confirmNewPassword"
              type="password"
              value={passwords.confirmNewPassword}
              onChange={handlePasswordChange}
              minLength="8"
              autoComplete="new-password"
              required
            />

            <button className="profile-primary-button" disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Change Password'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Profile;

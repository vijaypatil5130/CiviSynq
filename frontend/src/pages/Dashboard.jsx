
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config/api';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }

  const [complaints, setComplaints] = useState([]);
  const [communityComplaints, setCommunityComplaints] = useState([]);
  const [categoryRanking, setCategoryRanking] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [error, setError] = useState('');
  const [communityError, setCommunityError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;

    try {
      const [complaintResponse, notificationResponse, communityResponse] =
        await Promise.all([
          fetch(`${API_URL}/complaints/my-complaints`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/notifications`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}/complaints/community/all`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

      const [complaintData, notificationData, communityData] =
        await Promise.all([
          complaintResponse.json(),
          notificationResponse.json(),
          communityResponse.json()
        ]);

      if (!complaintResponse.ok) {
        throw new Error(
          complaintData.message || 'Unable to load your complaints.'
        );
      }

      if (!notificationResponse.ok) {
        throw new Error(
          notificationData.message || 'Unable to load notifications.'
        );
      }

      setComplaints(complaintData.complaints || []);
      setNotifications(notificationData.notifications || []);
      setUnreadCount(notificationData.unreadCount || 0);
      setError('');

      if (!communityResponse.ok) {
        throw new Error(
          communityData.message || 'Unable to load community complaints.'
        );
      }

      setCommunityComplaints(communityData.complaints || []);
      setCategoryRanking(communityData.categoryRanking || []);
      setCommunityError('');
    } catch (err) {
      setError(err.message);
      setCommunityError(err.message);
    } finally {
      setLoading(false);
      setCommunityLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (user?.role === 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, [token, user?.role, navigate, fetchDashboardData]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleRefresh = () => {
    setLoading(true);
    setCommunityLoading(true);
    fetchDashboardData();
  };

  const totalComplaints = complaints.length;

  const pendingCount = complaints.filter(
    (item) => item.status === 'Pending'
  ).length;

  const inProgressCount = complaints.filter(
    (item) => item.status === 'In Progress'
  ).length;

  const resolvedCount = complaints.filter(
    (item) => item.status === 'Resolved'
  ).length;

  const recentComplaints = [...complaints]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt)
    )
    .slice(0, 4);

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const markNotificationRead = async (notification) => {
    try {
      if (!notification.isRead) {
        const response = await fetch(
          `${API_URL}/notifications/${notification._id}/read`,
          {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!response.ok) {
          throw new Error('Unable to mark notification as read.');
        }
      }

      setNotifications((previous) =>
        previous.map((item) =>
          item._id === notification._id
            ? { ...item, isRead: true }
            : item
        )
      );

      if (!notification.isRead) {
        setUnreadCount((previous) => Math.max(0, previous - 1));
      }

      setShowNotifications(false);
      navigate('/my-complaints');
    } catch (err) {
      setError(err.message);
    }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Unable to update notifications.');
      }

      setNotifications((previous) =>
        previous.map((item) => ({ ...item, isRead: true }))
      );

      setUnreadCount(0);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!token) return null;

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <Link to="/" className="auth-logo">
          Civi<span>Synq</span>
        </Link>

        <div className="dashboard-header-actions">
          <div className="notification-wrapper">
            <button
              className="notification-bell"
              onClick={() =>
                setShowNotifications((previous) => !previous)
              }
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <span className="bell-icon">♢</span>
              <span className="bell-text">Notifications</span>

              {unreadCount > 0 && (
                <span className="notification-count">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-heading">
                  <div>
                    <h3>Notifications</h3>
                    <p>{unreadCount} unread notifications</p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      className="mark-all-button"
                      onClick={markAllRead}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="empty-notifications">
                      <span>🔔</span>
                      <p>No notifications yet.</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification._id}
                        className={`notification-item ${
                          notification.isRead ? 'read' : 'unread'
                        }`}
                        onClick={() =>
                          markNotificationRead(notification)
                        }
                      >
                        <div className="notification-dot"></div>

                        <div className="notification-details">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <span>
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="dashboard-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-welcome">
          <p className="dashboard-label">CITIZEN DASHBOARD</p>
          <h1>Welcome, {user?.fullName || 'Citizen'}!</h1>
          <p>
            Together, let's make Hubballi-Dharwad a better place.
          </p>
        </section>

        {error && (
          <div className="dashboard-error">
            {error}
            <button onClick={handleRefresh}>Retry</button>
          </div>
        )}

        {/* YOUR COMPLAINT OVERVIEW */}

        <section className="dashboard-stats-section">
          <div className="section-heading">
            <div>
              <h2 className="overview-heading">
                Your Complaint Overview
              </h2>
              <p>Track the progress of your reported issues.</p>
            </div>

            <button
              className="dashboard-refresh"
              onClick={handleRefresh}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="dashboard-stats">
            <div className="stat-card total-stat">
              <div className="stat-icon">📋</div>
              <p>Total Complaints</p>
              <h2>{loading ? '...' : totalComplaints}</h2>
            </div>

            <div className="stat-card pending-stat">
              <div className="stat-icon">⏳</div>
              <p>Pending</p>
              <h2>{loading ? '...' : pendingCount}</h2>
            </div>

            <div className="stat-card progress-stat">
              <div className="stat-icon">
                <span className="progress-loading-spinner"></span>
              </div>
              <p>In Progress</p>
              <h2>{loading ? '...' : inProgressCount}</h2>
            </div>

            <div className="stat-card resolved-stat">
              <div className="stat-icon">✓</div>
              <p>Resolved</p>
              <h2>{loading ? '...' : resolvedCount}</h2>
            </div>
          </div>
        </section>

        {/* MAIN DASHBOARD CARDS */}

        <section className="dashboard-cards">
          <div className="dashboard-card report-card">
            <div className="dashboard-card-icon">📢</div>
            <h2>Report an Issue</h2>
            <p>
              Report problems like garbage dumping, damaged roads,
              water issues and other civic problems.
            </p>
            <button onClick={() => navigate('/report-issue')}>
              Report Now →
            </button>
          </div>

          <div className="dashboard-card complaints-card">
            <div className="dashboard-card-icon">📍</div>
            <h2>My Complaints</h2>
            <p>
              View your submitted complaints and track their
              progress and current status.
            </p>
            <button onClick={() => navigate('/my-complaints')}>
              View Complaints →
            </button>
          </div>

          <div className="dashboard-card profile-card">
            <div className="dashboard-card-icon">👤</div>
            <h2>My Profile</h2>

            <div className="profile-information">
              <p>
                <strong>Name</strong>
                <span>{user?.fullName || 'Citizen'}</span>
              </p>
              <p>
                <strong>Email</strong>
                <span>{user?.email || 'Not available'}</span>
              </p>
              <p>
                <strong>Phone</strong>
                <span>{user?.phone || 'Not available'}</span>
              </p>
            </div>

            <button onClick={() => navigate('/profile')}>
              Manage Profile →
            </button>
          </div>
        </section>

        {/* MOST REPORTED ISSUES */}

        <section className="community-section">
          <div className="section-heading">
            <div>
              <h2>Most Reported Issues</h2>
              <p>
                Community-wide category ranking based on total reports.
              </p>
            </div>
          </div>

          {communityLoading ? (
            <div className="community-message">
              Loading community statistics...
            </div>
          ) : communityError ? (
            <div className="community-message community-error">
              Unable to load category rankings. Please refresh.
            </div>
          ) : categoryRanking.length === 0 ? (
            <div className="community-message">
              No category statistics available yet.
            </div>
          ) : (
            <div className="category-ranking-grid">
              {categoryRanking.map((item, index) => (
                <div
                  className={`category-ranking-card ${
                    index === 0 ? 'top-category' : ''
                  }`}
                  key={item.category}
                >
                  <div className="category-rank">
                    #{item.priority || index + 1}
                  </div>

                  <div className="category-ranking-info">
                    <h3>{item.category}</h3>
                    <p>
                      {item.count}{' '}
                      {item.count === 1 ? 'complaint' : 'complaints'}
                    </p>
                  </div>

                  {index === 0 && item.count > 0 && (
                    <span className="priority-label">Highest</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* COMMUNITY COMPLAINTS */}

        <section className="community-section">
          <div className="section-heading">
            <div>
              <h2>Community Complaints</h2>
              <p>
                Civic issues reported by citizens across Hubballi-Dharwad.
              </p>
            </div>

            <span className="community-total">
              {communityLoading
                ? 'Loading...'
                : `${communityComplaints.length} Reports`}
            </span>
          </div>

          {communityLoading ? (
            <div className="community-message">
              Loading community complaints...
            </div>
          ) : communityError ? (
            <div className="community-message community-error">
              {communityError}
              <button onClick={handleRefresh}>Try Again</button>
            </div>
          ) : communityComplaints.length === 0 ? (
            <div className="community-message">
              <span className="community-empty-icon">🏙️</span>
              <h3>No community complaints yet</h3>
              <p>Be the first to report a civic issue in your area.</p>
              <button onClick={() => navigate('/report-issue')}>
                Report an Issue
              </button>
            </div>
          ) : (
            <div className="community-complaints-grid">
              {communityComplaints.map((complaint) => (
                <article
                  className="community-complaint-card"
                  key={complaint._id}
                >
                  {complaint.image ? (
                    <img
                      className="community-complaint-image"
                      src={complaint.image}
                      alt={complaint.title || 'Civic issue'}
                      loading="lazy"
                    />
                  ) : (
                    <div className="community-image-placeholder">
                      <span>📷</span>
                      <p>No photo uploaded</p>
                    </div>
                  )}

                  <div className="community-complaint-body">
                    <div className="community-card-top">
                      <span className="community-category">
                        {complaint.category || 'Other'}
                      </span>

                      <span
                        className={`recent-status ${(
                          complaint.status || 'Pending'
                        )
                          .toLowerCase()
                          .replace(' ', '-')}`}
                      >
                        {complaint.status || 'Pending'}
                      </span>
                    </div>

                    <h3>{complaint.title || 'Untitled complaint'}</h3>

                    <p className="community-description">
                      {complaint.description || 'No description provided.'}
                    </p>

                    <div className="community-complaint-meta">
                      <p>
                        <span>📍</span>
                        {complaint.location || 'Location not provided'}
                      </p>

                      <p>
                        <span>👤</span>
                        Reported by:{' '}
                        {complaint.reportedBy?.fullName || 'Citizen'}
                      </p>

                      <p>
                        <span>📅</span>
                        {formatDate(complaint.createdAt)}
                      </p>
                    </div>

                    {complaint.latitude != null &&
                      complaint.longitude != null && (
                        <a
                          className="community-map-link"
                          href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on Map ↗
                        </a>
                      )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* YOUR RECENT COMPLAINT UPDATES */}

        <section className="recent-complaints-section">
          <div className="section-heading">
            <div>
              <h2>Recent Complaint Updates</h2>
              <p>Check the latest activity on your complaints.</p>
            </div>

            <Link to="/my-complaints" className="view-all-link">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="recent-empty">
              Loading your complaints...
            </div>
          ) : recentComplaints.length === 0 ? (
            <div className="recent-empty">
              <span>📋</span>
              <h3>No complaints reported yet</h3>
              <p>Start by reporting a civic issue in your area.</p>
              <button onClick={() => navigate('/report-issue')}>
                Report Your First Issue
              </button>
            </div>
          ) : (
            <div className="recent-complaints-list">
              {recentComplaints.map((complaint) => (
                <div className="recent-complaint" key={complaint._id}>
                  <div className="recent-complaint-info">
                    <h3>{complaint.title}</h3>
                    <p>
                      {complaint.category} · {complaint.location}
                    </p>
                    <span>
                      Last updated:{' '}
                      {formatDate(
                        complaint.updatedAt || complaint.createdAt
                      )}
                    </span>
                  </div>

                  <span
                    className={`recent-status ${complaint.status
                      ?.toLowerCase()
                      .replace(' ', '-')}`}
                  >
                    {complaint.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer className="dashboard-footer">
          <p>
            © {new Date().getFullYear()} CiviSynq.
            Building a better Hubballi-Dharwad together.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default Dashboard;

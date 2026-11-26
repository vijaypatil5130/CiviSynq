
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AdminComplaintMap from '../components/AdminComplaintMap';
import { API_URL, getImageUrl } from '../config/api';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const fetchComplaints = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    setError('');

    try {
      const response = await fetch(`${API_URL}/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load complaints');
      }

      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      navigate('/login');
      return;
    }

    fetchComplaints();
  }, [navigate, token, user?.role, fetchComplaints]);

  const updateStatus = async (complaintId, status) => {
    try {
      setUpdatingId(complaintId);

      const response = await fetch(
        `${API_URL}/admin/${complaintId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update status');
      }

      setComplaints((previous) =>
        previous.map((complaint) =>
          complaint._id === complaintId
            ? {
                ...complaint,
                status: data.complaint?.status || status
              }
            : complaint
        )
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const pendingCount = complaints.filter(
    (item) => item.status === 'Pending'
  ).length;

  const progressCount = complaints.filter(
    (item) => item.status === 'In Progress'
  ).length;

  const resolvedCount = complaints.filter(
    (item) => item.status === 'Resolved'
  ).length;

  const categories = useMemo(() => {
    return [...new Set(complaints.map((item) => item.category).filter(Boolean))].sort();
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return complaints.filter((complaint) => {
      const matchesStatus =
        statusFilter === 'All' || complaint.status === statusFilter;

      const matchesCategory =
        categoryFilter === 'All' || complaint.category === categoryFilter;

      const matchesSearch =
        !search ||
        complaint.title?.toLowerCase().includes(search) ||
        complaint.category?.toLowerCase().includes(search) ||
        complaint.location?.toLowerCase().includes(search) ||
        complaint.description?.toLowerCase().includes(search) ||
        complaint.reportedBy?.fullName?.toLowerCase().includes(search) ||
        complaint.reportedBy?.email?.toLowerCase().includes(search);

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [complaints, statusFilter, categoryFilter, searchTerm]);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <Link to="/admin-dashboard" className="admin-brand">
          Civi<span>Synq</span>
          <small>ADMIN</small>
        </Link>

        <div className="admin-header-actions">
          <div className="notification-badge">
            <span>Pending</span>
            <strong>{pendingCount}</strong>
          </div>

          <button className="admin-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="admin-container">
        <section className="admin-welcome">
          <div>
            <p className="admin-eyebrow">ADMIN CONTROL PANEL</p>
            <h1>Admin Dashboard</h1>
            <p>Manage, monitor and resolve citizen complaints.</p>
          </div>

          <button
            className="admin-refresh"
            onClick={() => fetchComplaints(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </section>

        <section className="admin-stats">
          <div className="admin-stat total-stat">
            <span>Total Complaints</span>
            <h2>{complaints.length}</h2>
            <p>All reported issues</p>
          </div>

          <div className="admin-stat pending-stat">
            <span>Pending</span>
            <h2>{pendingCount}</h2>
            <p>Awaiting attention</p>
          </div>

          <div className="admin-stat progress-stat">
            <span>In Progress</span>
            <h2>{progressCount}</h2>
            <p>Currently being handled</p>
          </div>

          <div className="admin-stat resolved-stat">
            <span>Resolved</span>
            <h2>{resolvedCount}</h2>
            <p>Successfully completed</p>
          </div>
        </section>

        {pendingCount > 0 && (
          <div className="admin-alert">
            <span className="alert-icon">!</span>
            <div>
              <strong>Pending complaints need attention</strong>
              <p>
                There {pendingCount === 1 ? 'is' : 'are'} {pendingCount} pending
                {pendingCount === 1 ? ' complaint' : ' complaints'} awaiting review.
              </p>
            </div>
          </div>
        )}

        <section className="admin-map-section">
          <div className="admin-section-heading">
            <div>
              <p className="admin-eyebrow">LOCATION OVERVIEW</p>
              <h2>Complaint Locations</h2>
              <p>Explore reported civic issues across Hubballi-Dharwad.</p>
            </div>
          </div>

          {!loading && !error && (
            <div className="admin-map-container">
              <AdminComplaintMap complaints={complaints} />
            </div>
          )}

          {loading && <p>Loading complaint locations...</p>}
        </section>

        <section className="admin-complaints">
          <div className="admin-section-heading">
            <div>
              <p className="admin-eyebrow">COMPLAINT MANAGEMENT</p>
              <h2>All Citizen Complaints</h2>
              <p>Search, filter and update reported civic issues.</p>
            </div>

            <span className="results-count">
              {filteredComplaints.length} Results
            </span>
          </div>

          <div className="admin-filters">
            <input
              type="text"
              placeholder="Search title, location, citizen or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {loading && <p className="admin-message">Loading complaints...</p>}

          {error && (
            <div className="admin-error">
              <p>{error}</p>
              <button onClick={() => fetchComplaints(true)}>
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && complaints.length === 0 && (
            <div className="admin-empty">
              <h3>No complaints yet</h3>
              <p>Citizen complaints will appear here when submitted.</p>
            </div>
          )}

          {!loading && !error && complaints.length > 0 &&
            filteredComplaints.length === 0 && (
              <div className="admin-empty">
                <h3>No matching complaints found</h3>
                <p>Try changing your search or filters.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                    setCategoryFilter('All');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            )}

          <div className="admin-complaint-list">
            {!loading && !error && filteredComplaints.map((complaint) => (
              <article className="admin-complaint-card" key={complaint._id}>
                <div className="admin-card-top">
                  <span className="admin-category">
                    {complaint.category}
                  </span>

                  <span className={`admin-status-badge ${complaint.status.toLowerCase().replace(' ', '-')}`}>
                    {complaint.status}
                  </span>
                </div>

                <h3>{complaint.title}</h3>

                <p className="admin-description">
                  {complaint.description}
                </p>

                {complaint.image && (
                  <img
                    className="admin-complaint-image"
                    src={getImageUrl(complaint.image)}
                    alt="Citizen reported issue"
                  />
                )}

                <div className="admin-complaint-details">
                  <p><strong>Location:</strong> {complaint.location}</p>
                  <p>
                    <strong>Reported by:</strong>{' '}
                    {complaint.reportedBy?.fullName || 'Unknown'}
                  </p>
                  <p>
                    <strong>Email:</strong>{' '}
                    {complaint.reportedBy?.email || 'Not available'}
                  </p>
                  <p>
                    <strong>Date:</strong>{' '}
                    {new Date(complaint.createdAt).toLocaleString()}
                  </p>
                </div>

                {complaint.latitude != null && complaint.longitude != null && (
                  <a
                    className="admin-map-link"
                    href={`https://www.openstreetmap.org/?mlat=${complaint.latitude}&mlon=${complaint.longitude}#map=17/${complaint.latitude}/${complaint.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Location on Map →
                  </a>
                )}

                <div className="admin-card-actions">
                  <Link
                    to={`/complaint-details/${complaint._id}`}
                    className="admin-details-button"
                  >
                    View Details
                  </Link>

                  <div className="admin-status-control">
                    <label htmlFor={`status-${complaint._id}`}>
                      Update Status
                    </label>

                    <select
                      id={`status-${complaint._id}`}
                      value={complaint.status}
                      disabled={updatingId === complaint._id}
                      onChange={(event) =>
                        updateStatus(complaint._id, event.target.value)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>

                    {updatingId === complaint._id && (
                      <small>Saving status...</small>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;


import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './MyComplaints.css';

function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          throw new Error('Please log in to view your complaints.');
        }

        const response = await fetch(
          'http://localhost:5000/api/complaints/my-complaints',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load complaints');
        }

        setComplaints(data.complaints || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const getStatusClass = (status) => {
    if (status === 'Resolved') return 'resolved';
    if (status === 'In Progress') return 'in-progress';
    return 'pending';
  };

  const getProgressStep = (status) => {
    if (status === 'Resolved') return 3;
    if (status === 'In Progress') return 2;
    return 1;
  };

  // Search, filter and sort complaints
  const filteredComplaints = useMemo(() => {
    let result = [...complaints];

    const search = searchTerm.trim().toLowerCase();

    if (search) {
      result = result.filter((complaint) =>
        [
          complaint.title,
          complaint.description,
          complaint.location,
          complaint.category
        ].some((value) =>
          String(value || '').toLowerCase().includes(search)
        )
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter(
        (complaint) => complaint.status === statusFilter
      );
    }

    if (categoryFilter !== 'All') {
      result = result.filter(
        (complaint) => complaint.category === categoryFilter
      );
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime() || 0;
      const dateB = new Date(b.createdAt).getTime() || 0;

      return sortOrder === 'newest'
        ? dateB - dateA
        : dateA - dateB;
    });

    return result;
  }, [complaints, searchTerm, statusFilter, categoryFilter, sortOrder]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('All');
    setCategoryFilter('All');
    setSortOrder('newest');
  };

  return (
    <div className="my-complaints-page">
      <header className="complaints-header">
        <Link to="/dashboard" className="complaints-logo">
          CiviSynq
        </Link>

        <Link to="/dashboard" className="back-link">
          Back to Dashboard
        </Link>
      </header>

      <main className="complaints-container">
        <div className="complaints-heading">
          <p className="section-label">CITIZEN DASHBOARD</p>
          <h1>My Complaints</h1>
          <p>Track and manage the civic issues you have reported.</p>
        </div>

        {loading && (
          <p className="complaint-message">
            Loading your complaints...
          </p>
        )}

        {error && (
          <p className="complaint-error">{error}</p>
        )}

        {!loading && !error && complaints.length === 0 && (
          <div className="empty-complaints">
            <h2>No complaints yet</h2>
            <p>You haven't reported any civic issues.</p>

            <Link to="/report-issue" className="report-button">
              Report an Issue
            </Link>
          </div>
        )}

        {!loading && !error && complaints.length > 0 && (
          <>
            <section className="complaint-filters">
              <div className="filter-heading">
                <div>
                  <h2>Manage Your Complaints</h2>
                  <p>
                    Search, filter and track all your reported issues.
                  </p>
                </div>

                <span className="complaint-count">
                  {filteredComplaints.length} of {complaints.length} complaints
                </span>
              </div>

              <div className="filter-controls">
                <div className="filter-group search-group">
                  <label htmlFor="complaint-search">
                    Search Complaints
                  </label>
                  <input
                    id="complaint-search"
                    type="text"
                    placeholder="Search title, location or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="filter-group">
                  <label htmlFor="status-filter">Status</label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="category-filter">Category</label>
                  <select
                    id="category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    <option value="Garbage">Garbage</option>
                    <option value="Road Damage">Road Damage</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Water Supply">Water Supply</option>
                    <option value="Drainage">Drainage</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label htmlFor="sort-order">Sort By</label>
                  <select
                    id="sort-order"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                className="clear-filters-button"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </section>

            {filteredComplaints.length === 0 ? (
              <div className="no-filter-results">
                <h2>No matching complaints found</h2>
                <p>
                  Try changing your search or filters to find your complaints.
                </p>
                <button
                  type="button"
                  className="report-button"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="complaints-list">
                {filteredComplaints.map((complaint) => {
                  const currentStep = getProgressStep(complaint.status);

                  return (
                    <div className="complaint-card" key={complaint._id}>
                      <div className="complaint-card-top">
                        <span className="complaint-category">
                          {complaint.category}
                        </span>

                        <span
                          className={`status-badge ${getStatusClass(complaint.status)}`}
                        >
                          {complaint.status}
                        </span>
                      </div>

                      <h2>{complaint.title}</h2>

                      <p className="complaint-description">
                        {complaint.description}
                      </p>

                      {complaint.image && (
                        <div className="complaint-image-wrapper">
                          <img
                            src={`http://localhost:5000${complaint.image}`}
                            alt="Reported civic issue"
                            className="complaint-image"
                          />
                        </div>
                      )}

                      <div className="complaint-details">
                        <p>
                          <strong>Location:</strong> {complaint.location}
                        </p>

                        <p>
                          <strong>Reported on:</strong>{' '}
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </p>

                        {complaint.latitude != null &&
                          complaint.longitude != null && (
                            <p>
                              <a
                                href={`https://www.openstreetmap.org/?mlat=${complaint.latitude}&mlon=${complaint.longitude}#map=17/${complaint.latitude}/${complaint.longitude}`}
                                target="_blank"
                                rel="noreferrer"
                                className="complaint-map-link"
                              >
                                View on Map →
                              </a>
                            </p>
                          )}
                      </div>

                      <div className="complaint-progress">
                        <h3>Complaint Progress</h3>

                        <div className="progress-steps">
                          {['Pending', 'In Progress', 'Resolved'].map(
                            (step, index) => {
                              const stepNumber = index + 1;
                              const completed = stepNumber <= currentStep;

                              return (
                                <div className="progress-step" key={step}>
                                  <div
                                    className={`progress-circle ${completed ? 'completed' : ''}`}
                                  >
                                    {completed ? '✓' : stepNumber}
                                  </div>

                                  <span className={completed ? 'step-active' : ''}>
                                    {step}
                                  </span>
                                </div>
                              );
                            }
                          )}
                        </div>

                        <div className="progress-track">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${((currentStep - 1) / 2) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default MyComplaints;

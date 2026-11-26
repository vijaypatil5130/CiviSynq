
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './ComplaintDetails.css';

function ComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchComplaint = async () => {
      try {
        const response = await fetch(
          'http://localhost:5000/api/admin/all',
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to load complaint');
        }

        const selectedComplaint = (data.complaints || []).find(
          (item) => item._id === id
        );

        if (!selectedComplaint) {
          throw new Error('Complaint not found');
        }

        setComplaint(selectedComplaint);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!token) {
      navigate('/login');
      return;
    }

    fetchComplaint();
  }, [id, token, navigate]);

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusSaving(true);
      setStatusMessage('');

      const response = await fetch(
        `http://localhost:5000/api/admin/${id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update status');
      }

      setComplaint((previous) => ({
        ...previous,
        status: data.complaint?.status || newStatus
      }));

      setStatusMessage('Complaint status updated successfully!');
    } catch (err) {
      setStatusMessage(err.message);
    } finally {
      setStatusSaving(false);
    }
  };

  if (loading) {
    return <div className="details-page">Loading complaint details...</div>;
  }

  if (error) {
    return (
      <div className="details-page">
        <p>{error}</p>
        <button onClick={() => navigate('/admin-dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!complaint) return null;

  return (
    <div className="details-page">
      <div className="details-container">

        <Link to="/admin-dashboard" className="details-back">
          ← Back to Dashboard
        </Link>

        <div className="details-heading">
          <p>CIVISYNQ ADMIN PANEL</p>
          <h1>Complaint Details</h1>
          <span>Complete information about the reported civic issue.</span>
        </div>

        <div className="details-card">
          <h2>{complaint.title}</h2>

          <span className={`details-status ${complaint.status.toLowerCase().replace(' ', '-')}`}>
            {complaint.status}
          </span>

          {complaint.image && (
            <img
              className="details-image"
              src={`http://localhost:5000${complaint.image}`}
              alt="Reported civic issue"
            />
          )}

          <div className="details-section">
            <h3>Issue Information</h3>
            <p><strong>Category:</strong> {complaint.category}</p>
            <p><strong>Description:</strong> {complaint.description}</p>
            <p><strong>Location:</strong> {complaint.location}</p>
            <p><strong>Latitude:</strong> {complaint.latitude ?? 'Not available'}</p>
            <p><strong>Longitude:</strong> {complaint.longitude ?? 'Not available'}</p>
            <p><strong>Submitted:</strong> {new Date(complaint.createdAt).toLocaleString()}</p>
          </div>

          <div className="details-section">
            <h3>Citizen Information</h3>
            <p><strong>Name:</strong> {complaint.reportedBy?.fullName || 'Unknown'}</p>
            <p><strong>Email:</strong> {complaint.reportedBy?.email || 'Not available'}</p>
          </div>

          <div className="details-section">
            <h3>Update Complaint Status</h3>

            <select
              value={complaint.status}
              onChange={(event) => handleStatusChange(event.target.value)}
              disabled={statusSaving}
              style={{
                padding: '12px',
                width: '100%',
                maxWidth: '300px',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '15px'
              }}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            {statusSaving && <p>Updating status...</p>}

            {statusMessage && (
              <p style={{ color: statusMessage.includes('successfully') ? 'green' : 'red' }}>
                {statusMessage}
              </p>
            )}
          </div>

          {complaint.latitude != null && complaint.longitude != null && (
            <div className="details-section">
              <h3>Issue Coordinates</h3>
              <p>
                {complaint.latitude}, {complaint.longitude}
              </p>
              <a
                href={`https://www.openstreetmap.org/?mlat=${complaint.latitude}&mlon=${complaint.longitude}#map=17/${complaint.latitude}/${complaint.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                View location on OpenStreetMap
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default ComplaintDetails;

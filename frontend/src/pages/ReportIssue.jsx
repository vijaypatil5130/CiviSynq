
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LocationPicker from '../components/LocationPicker';
import { API_URL } from '../config/api';
import './ReportIssue.css';

function ReportIssue() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location: ''
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    setImage(null);
    setImagePreview('');

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setMessage('Please select a JPG, PNG or WEBP image.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5 MB.');
      e.target.value = '';
      return;
    }

    setMessage('');
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);

    try {
      const complaintData = new FormData();

      complaintData.append('title', formData.title);
      complaintData.append('category', formData.category);
      complaintData.append('description', formData.description);
      complaintData.append('location', formData.location);

      if (selectedLocation) {
        complaintData.append('latitude', selectedLocation.lat);
        complaintData.append('longitude', selectedLocation.lng);
      }

      if (image) {
        complaintData.append('image', image);
      }

      const response = await fetch(`${API_URL}/complaints`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: complaintData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit complaint.');
      }

      setMessage('Your complaint has been submitted successfully!');

      setFormData({
        title: '',
        category: '',
        description: '',
        location: ''
      });

      setImage(null);
      setImagePreview('');
      setSelectedLocation(null);

      e.target.reset();

    } catch (error) {
      setMessage(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-page">
      <header className="report-header">
        <Link to="/" className="auth-logo">
          Civi<span>Synq</span>
        </Link>

        <Link to="/dashboard" className="report-back">
          Back to Dashboard
        </Link>
      </header>

      <main className="report-container">
        <div className="report-heading">
          <p>MAKE YOUR CITY BETTER</p>
          <h1>Report a Civic Issue</h1>
          <span>
            Help us identify and resolve problems in your neighbourhood.
          </span>
        </div>

        <form className="report-form" onSubmit={handleSubmit}>
          <label>Issue Title</label>
          <input
            type="text"
            name="title"
            placeholder="Example: Garbage overflowing near main road"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <label>Issue Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select issue category</option>
            <option value="Road">Road Damage</option>
            <option value="Garbage">Garbage / Waste</option>
            <option value="Water">Water Supply</option>
            <option value="Electricity">Electricity</option>
            <option value="Drainage">Drainage</option>
            <option value="Streetlight">Streetlight</option>
            <option value="Other">Other</option>
          </select>

          <label>Describe the Issue</label>
          <textarea
            name="description"
            placeholder="Explain the problem in detail..."
            value={formData.description}
            onChange={handleChange}
            rows="5"
            required
          />

          <label>Issue Location</label>
          <input
            type="text"
            name="location"
            placeholder="Enter area, street or landmark"
            value={formData.location}
            onChange={handleChange}
            required
          />

          <label>Select Exact Location on Map</label>

          <LocationPicker onLocationSelect={setSelectedLocation} />

          <label>Upload Issue Photo (Optional)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />

          {imagePreview && (
            <div style={{ marginTop: '12px' }}>
              <p>Image Preview:</p>
              <img
                src={imagePreview}
                alt="Selected complaint"
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  maxHeight: '220px',
                  objectFit: 'cover',
                  borderRadius: '10px'
                }}
              />
            </div>
          )}

          <p style={{ fontSize: '12px', color: '#777' }}>
            Accepted formats: JPG, PNG, WEBP. Maximum size: 5 MB.
          </p>

          {message && (
            <p style={{
              color: message.includes('successfully') ? '#16a34a' : '#dc2626',
              fontSize: '14px'
            }}>
              {message}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Issue Report'}
          </button>
        </form>
      </main>
    </div>
  );
}

export default ReportIssue;

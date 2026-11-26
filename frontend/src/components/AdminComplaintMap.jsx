
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from 'react-leaflet';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function AdminComplaintMap({ complaints }) {
  const mappedComplaints = complaints.filter(
    (complaint) =>
      Number.isFinite(complaint.latitude) &&
      Number.isFinite(complaint.longitude)
  );

  return (
    <div>
      <MapContainer
        center={[15.3647, 75.1240]}
        zoom={12}
        style={{
          height: '450px',
          width: '100%',
          borderRadius: '12px'
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mappedComplaints.map((complaint) => (
          <Marker
            key={complaint._id}
            position={[complaint.latitude, complaint.longitude]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{complaint.title}</strong>
              <br />
              Category: {complaint.category}
              <br />
              Location: {complaint.location}
              <br />
              Status: {complaint.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <p style={{ fontSize: '13px', marginTop: '10px' }}>
        Showing {mappedComplaints.length} mapped complaints.
      </p>
    </div>
  );
}

export default AdminComplaintMap;

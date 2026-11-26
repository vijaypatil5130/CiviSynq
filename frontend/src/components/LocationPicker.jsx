
import { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in React
const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(event) {
      onLocationSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng
      });
    }
  });

  return null;
}

function LocationPicker({ onLocationSelect }) {
  const [position, setPosition] = useState(null);

  const handleSelect = (coordinates) => {
    setPosition(coordinates);
    onLocationSelect(coordinates);
  };

  return (
    <div>
      <MapContainer
        center={[15.3647, 75.1240]}
        zoom={13}
        style={{
          height: '350px',
          width: '100%',
          borderRadius: '12px'
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onLocationSelect={handleSelect} />

        {position && (
          <Marker
            position={[position.lat, position.lng]}
            icon={markerIcon}
          />
        )}
      </MapContainer>

      {position && (
        <p style={{ fontSize: '13px', marginTop: '10px' }}>
          Selected coordinates: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </p>
      )}

      {!position && (
        <p style={{ fontSize: '13px', marginTop: '10px' }}>
          Click on the map to select the issue location.
        </p>
      )}
    </div>
  );
}

export default LocationPicker;

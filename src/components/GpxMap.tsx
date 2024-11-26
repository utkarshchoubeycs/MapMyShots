// src/components/GpxMap.tsx

import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fixing default icon issues in Leaflet when using Webpack
import L from 'leaflet';

// Remove existing icon paths to avoid 404 errors
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Set default icons
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GPXPoint {
  lat: number;
  lon: number;
  name?: string;
  time?: string;
}

interface GpxMapProps {
  gpxPoints: GPXPoint[];
}

const startIcon = new Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to fit the map bounds to the GPX points
const FitBounds = ({ points }: { points: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [points, map]);

  return null;
};

const GpxMap: React.FC<GpxMapProps> = ({ gpxPoints }) => {
  // Convert GPXPoints to [lat, lon] tuples
  const coordinates: [number, number][] = gpxPoints.map((point) => [
    point.lat,
    point.lon,
  ]);

  // Determine center of the map
  const center =
    coordinates.length > 0
      ? coordinates[0]
      : [51.505, -0.09] as [number, number]; // Default to London if no points

  return (
    <div className="w-full h-[600px] relative">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fit map to bounds */}
        <FitBounds points={coordinates} />

        {/* Draw the GPX route */}
        {coordinates.length > 1 && (
          <Polyline positions={coordinates} color="#4285F4" weight={3} />
        )}

        {/* Start Marker */}
        {gpxPoints.length > 0 && (
          <Marker position={[gpxPoints[0].lat, gpxPoints[0].lon]} icon={startIcon}>
            <Popup>
              <strong>Start Point</strong>
              {gpxPoints[0].name && <div>{gpxPoints[0].name}</div>}
              {gpxPoints[0].time && (
                <div>{new Date(gpxPoints[0].time).toLocaleString()}</div>
              )}
            </Popup>
          </Marker>
        )}

        {/* End Marker */}
        {gpxPoints.length > 1 && (
          <Marker
            position={[gpxPoints[gpxPoints.length - 1].lat, gpxPoints[gpxPoints.length - 1].lon]}
            icon={endIcon}
          >
            <Popup>
              <strong>End Point</strong>
              {gpxPoints[gpxPoints.length - 1].name && (
                <div>{gpxPoints[gpxPoints.length - 1].name}</div>
              )}
              {gpxPoints[gpxPoints.length - 1].time && (
                <div>{new Date(gpxPoints[gpxPoints.length - 1].time).toLocaleString()}</div>
              )}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default GpxMap;
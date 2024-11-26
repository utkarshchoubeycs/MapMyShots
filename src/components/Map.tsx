import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { ImageMetadata } from '../types';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';

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

const waypointIcon = new DivIcon({
  className: 'custom-div-icon',
  html:
    '<div style="background-color: #4285F4; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

// New icons for selected markers
const selectedWaypointIcon = new DivIcon({
  className: 'custom-div-icon',
  html:
    '<div style="background-color: #FF0000; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #FFD700;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const selectedStartIcon = new Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [30, 50],
  iconAnchor: [15, 50],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedEndIcon = new Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [30, 50],
  iconAnchor: [15, 50],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapProps {
  images: ImageMetadata[];
  selectedIndex: number;
  onImageSelect: (index: number) => void;
  showLines: boolean;
  showPoints: boolean;
}

const ZoomHandler = ({ setZoomLevel, setBounds }) => {
  const map = useMapEvents({
    zoomend: () => {
      setZoomLevel(map.getZoom());
      setBounds(map.getBounds());
    },
    moveend: () => {
      setBounds(map.getBounds());
    },
  });
  return null;
};

// New component to close popups when selectedIndex changes
const PopupCloser = ({ selectedIndex }) => {
  const map = useMap();

  useEffect(() => {
    map.closePopup();
  }, [selectedIndex, map]);

  return null;
};

const Map: React.FC<MapProps> = ({
  images,
  selectedIndex,
  onImageSelect,
  showLines,
  showPoints,
}) => {
  const [zoomLevel, setZoomLevel] = useState(13); // Initialize with default zoom level
  const [bounds, setBounds] = useState(null); // State to hold map bounds

  const coordinates: [number, number][] = images.map((img) => [
    img.latitude,
    img.longitude,
  ]);

  const center =
    coordinates.length > 0
      ? coordinates[0]
      : ([51.505, -0.09] as [number, number]);

  if (!coordinates.length) {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        No coordinates available to display
      </div>
    );
  }

  // Define sample rate based on zoom level
  const calculateSampleRate = (zoom) => {
    if (zoom >= 18) return 1;
    if (zoom >= 17) return 6;
    if (zoom >= 16) return 12;
    if (zoom >= 15) return 18;
    if (zoom >= 14) return 24;
    if (zoom >= 13) return 30;
    return 40; // For zoom levels less than 13
  };

  const sampleRate = calculateSampleRate(zoomLevel);

  // Sample waypoints based on sample rate
  const waypointIndices = images.map((_, idx) => idx);

  // Ensure first and last indices are always included
  const sampledWaypointIndices = waypointIndices.filter(
    (idx) =>
      idx === 0 ||
      idx === images.length - 1 ||
      idx % sampleRate === 0 ||
      idx === selectedIndex // Ensure selected index is included
  );

  // Filter markers to only include those within the current viewport
  const markersToRender = sampledWaypointIndices.filter((imageIdx) => {
    if (imageIdx === 0 || imageIdx === images.length - 1) return true; // Always include first and last points
    if (imageIdx === selectedIndex) return true; // Always include selected marker
    const coord = coordinates[imageIdx];
    if (!bounds) return true; // If bounds are not set yet, include all
    return bounds.contains(coord);
  });

  return (
    <div className="w-full h-[600px] relative">
      <MapContainer
        center={center}
        zoom={13}
        whenCreated={(mapInstance) => {
          setZoomLevel(mapInstance.getZoom());
          setBounds(mapInstance.getBounds());
        }}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg z-0"
      >
        {/* Include the ZoomHandler to update zoom level and bounds */}
        <ZoomHandler setZoomLevel={setZoomLevel} setBounds={setBounds} />

        {/* Include the PopupCloser to close popups when selectedIndex changes */}
        <PopupCloser selectedIndex={selectedIndex} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {showLines && coordinates.length > 1 && (
          <Polyline positions={coordinates} color="#4285F4" weight={3} />
        )}

        {showPoints && (
          <>
            {/* Markers */}
            {markersToRender.map((imageIdx) => {
              const coord = coordinates[imageIdx];
              const image = images[imageIdx];

              // Determine the appropriate icon
              let icon = waypointIcon;
              if (imageIdx === 0) {
                icon = imageIdx === selectedIndex ? selectedStartIcon : startIcon;
              } else if (imageIdx === images.length - 1) {
                icon = imageIdx === selectedIndex ? selectedEndIcon : endIcon;
              } else if (imageIdx === selectedIndex) {
                icon = selectedWaypointIcon;
              }

              // Marker component
              return (
                <Marker
                  key={`marker-${imageIdx}`}
                  position={coord}
                  icon={icon}
                  eventHandlers={{
                    click: () => onImageSelect(imageIdx),
                  }}
                >
                  <Popup>
                    <div className="text-sm space-y-1">
                      {imageIdx === 0 && <strong>Start Point</strong>}
                      {imageIdx === images.length - 1 && (
                        <strong>End Point</strong>
                      )}
                      {imageIdx !== 0 &&
                        imageIdx !== images.length - 1 && (
                          <strong>Photo {imageIdx + 1}</strong>
                        )}
                      {image.timestamp && (
                        <div>{format(image.timestamp, 'PPpp')}</div>
                      )}
                      {image.make && image.model && (
                        <div>
                          {image.make} {image.model}
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default Map;

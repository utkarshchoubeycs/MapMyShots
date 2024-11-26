import React from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { ImageMetadata } from '../types';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';

const startIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const waypointIcon = new DivIcon({
  className: 'custom-div-icon',
  html: '<div style="background-color: #4285F4; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

interface MapProps {
  images: ImageMetadata[];
  selectedIndex: number;
  onImageSelect: (index: number) => void;
  showLines: boolean;
  showPoints: boolean;
}

const Map: React.FC<MapProps> = ({ images, selectedIndex, onImageSelect, showLines, showPoints }) => {
  const coordinates: [number, number][] = images.map(img => [img.latitude, img.longitude]);
  
  const center = coordinates.length > 0 
    ? coordinates[0] 
    : [51.505, -0.09] as [number, number];

  if (!coordinates.length) {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
        No coordinates available to display
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] relative">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {showLines && coordinates.length > 1 && (
          <Polyline
            positions={coordinates}
            color="#4285F4"
            weight={3}
          />
        )}
        
        {showPoints && (
          <>
            {/* Start Marker */}
            <Marker 
              position={coordinates[0]} 
              icon={startIcon}
            >
              <Popup>
                <div className="text-sm">
                  <strong>Start Point</strong><br />
                  {images[0].timestamp && format(images[0].timestamp, 'PPpp')}
                </div>
              </Popup>
            </Marker>

            {/* Waypoint Markers */}
            {coordinates.slice(1, -1).map((coord, idx) => {
              const imageIdx = idx + 1;
              const image = images[imageIdx];
              return (
                <Marker
                  key={`waypoint-${imageIdx}`}
                  position={coord}
                  icon={waypointIcon}
                  eventHandlers={{
                    click: () => onImageSelect(imageIdx)
                  }}
                >
                  <Popup>
                    <div className="text-sm space-y-1">
                      <strong>Photo {imageIdx + 1}</strong>
                      {image.timestamp && (
                        <div>{format(image.timestamp, 'PPpp')}</div>
                      )}
                      {image.make && image.model && (
                        <div>{image.make} {image.model}</div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* End Marker */}
            {coordinates.length > 1 && (
              <Marker 
                position={coordinates[coordinates.length - 1]} 
                icon={endIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>End Point</strong><br />
                    {images[coordinates.length - 1].timestamp && 
                      format(images[coordinates.length - 1].timestamp, 'PPpp')}
                  </div>
                </Popup>
              </Marker>
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default Map;
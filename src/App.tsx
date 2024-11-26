import React, { useState, useCallback } from 'react';
import { Upload, Download, Map as MapIcon, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import Map from './components/Map';
import { generateGPX } from './utils/gpx';
import ImageViewer from './components/ImageViewer';
import { ImageMetadata } from './types';
import exifr from 'exifr';

function App() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLines, setShowLines] = useState(false);
  const [showPoints, setShowPoints] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setLoading(true);
    setError(null);
    const newImages: ImageMetadata[] = [];

    try {
      for (const file of files) {
        const metadata = await exifr.parse(file, true);
        if (metadata?.latitude && metadata?.longitude) {
          newImages.push({
            latitude: metadata.latitude,
            longitude: metadata.longitude,
            timestamp: metadata.DateTimeOriginal || metadata.CreateDate,
            make: metadata.Make,
            model: metadata.Model,
            fileName: file.name,
            url: URL.createObjectURL(file),
            altitude: metadata.GPSAltitude,
            exposureTime: metadata.ExposureTime,
            fNumber: metadata.FNumber,
            iso: metadata.ISO,
            focalLength: metadata.FocalLength
          });
        }
      }

      if (newImages.length === 0) {
        setError('No GPS data found in the uploaded images. Please ensure your images contain GPS information.');
      } else {
        setImages(newImages);
        setSelectedImageIndex(0);
      }
    } catch (err) {
      console.error('Error processing images:', err);
      setError('Error processing images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadGPX = useCallback(() => {
    if (images.length === 0) {
      setError('No coordinates available to generate GPX');
      return;
    }

    const gpxData = generateGPX(images);
    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'photo-route.gpx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [images]);

  const handleNext = () => {
    setSelectedImageIndex(prev => Math.min(prev + 1, images.length - 1));
  };

  const handlePrevious = () => {
    setSelectedImageIndex(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Udaan Recce Route Mapper
          </h1>
          <p className="text-lg text-gray-600">
            Upload images with GPS data to visualize your route instantly
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Upload Images
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select multiple images with GPS data to create your route. The images should be in their original format and contain GPS information.
            </p>
          </div>
          <label className="block">
            <span className="sr-only">Choose images</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </label>
        </div>

        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Processing images...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {images.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapIcon className="w-5 h-5" />
                Your Photo Route
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowLines(!showLines)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100"
                >
                  {showLines ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showLines ? 'Hide Routes' : 'Show Routes'}
                </button>
                <button
                  onClick={() => setShowPoints(!showPoints)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100"
                >
                  {showPoints ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPoints ? 'Hide Points' : 'Show Points'}
                </button>
                <button
                  onClick={downloadGPX}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download GPX
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <Map 
                  images={images}
                  selectedIndex={selectedImageIndex}
                  onImageSelect={setSelectedImageIndex}
                  showLines={showLines}
                  showPoints={showPoints}
                />
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <ImageViewer
                  images={images}
                  currentIndex={selectedImageIndex}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {images.length} photos plotted • Total distance: {calculateDistance(images).toFixed(2)} km
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function calculateDistance(images: ImageMetadata[]): number {
  let total = 0;
  for (let i = 0; i < images.length - 1; i++) {
    total += getDistanceFromLatLonInKm(
      images[i].latitude, images[i].longitude,
      images[i + 1].latitude, images[i + 1].longitude
    );
  }
  return total;
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default App;
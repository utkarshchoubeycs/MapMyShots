// src/App.tsx

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  Download,
  Map as MapIcon,
  Image as ImageIcon,
  Eye,
  EyeOff,
  FileText,
  Info,
} from 'lucide-react';
import Map from './components/Map';
import GpxMap from './components/GpxMap'; // Import the new GpxMap component
import { generateGPX } from './utils/gpx';
import ImageViewer from './components/ImageViewer';
import { ImageMetadata } from './types';
import exifr from 'exifr';

function App() {
  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<'map' | 'gpxViewer' | 'metadataViewer'>('map');

  /* ==========================
     ====== Map Tab States =====
     ========================== */
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLines, setShowLines] = useState(false);
  const [showPoints, setShowPoints] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadInputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Handle Image Upload (Replaces Existing Images)
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
            focalLength: metadata.FocalLength,
          });
        }
      }

      if (newImages.length === 0) {
        setError(
          'No GPS data found in the uploaded images. Please ensure your images contain GPS information.'
        );
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

  // Handle Adding Images (Appends to Existing Images)
  const handleAddImages = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
            focalLength: metadata.FocalLength,
          });
        }
      }

      // Get existing filenames
      const existingFilenames = images.map((img) => img.fileName);

      // Filter out images with duplicate filenames
      const filteredNewImages = newImages.filter(
        (newImg) => !existingFilenames.includes(newImg.fileName)
      );

      if (filteredNewImages.length === 0) {
        setError(
          'No new images added. All images already exist or contain no GPS data.'
        );
      } else {
        setImages([...images, ...filteredNewImages]);
        setSelectedImageIndex(images.length); // Set to first new image
      }
    } catch (err) {
      console.error('Error processing images:', err);
      setError('Error processing images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle GPX Download
  const downloadGPX = useCallback(async () => {
    if (images.length === 0) {
      setError('No coordinates available to generate GPX');
      return;
    }

    try {
      const gpxData = await generateGPX(images); // Await the async function
      const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'photo-route.gpx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating GPX:', err);
      setError('Error generating GPX. Please try again.');
    }
  }, [images]);

  const handleNext = () => {
    setSelectedImageIndex((prev) => Math.min(prev + 1, images.length - 1));
  };

  const handlePrevious = () => {
    setSelectedImageIndex((prev) => Math.max(prev - 1, 0));
  };

  /* ==============================
     ====== GPX Viewer States ======
     ============================== */
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [gpxPoints, setGpxPoints] = useState<GPXPoint[]>([]); // Define GPXPoint type
  const [gpxLoading, setGpxLoading] = useState(false);
  const [gpxError, setGpxError] = useState<string | null>(null);
  const gpxInputRef = useRef<HTMLInputElement>(null);

  // Define GPXPoint type
  interface GPXPoint {
    lat: number;
    lon: number;
    name?: string;
    time?: string;
  }

  // Handle GPX File Upload
  const handleGpxUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setGpxFile(file);
    setGpxLoading(true);
    setGpxError(null);
    setGpxPoints([]); // Reset previous GPX points

    try {
      const text = await file.text();
      // Parse GPX data using DOMParser
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'application/xml');

      // Check for parsing errors
      const parserError = xml.getElementsByTagName('parsererror');
      if (parserError.length > 0) {
        throw new Error('Error parsing GPX file.');
      }

      const trkpts = xml.getElementsByTagName('trkpt');
      const points: GPXPoint[] = [];

      for (let i = 0; i < trkpts.length; i++) {
        const trkpt = trkpts[i];
        const lat = parseFloat(trkpt.getAttribute('lat') || '0');
        const lon = parseFloat(trkpt.getAttribute('lon') || '0');

        // Extract optional data like name and time
        const nameElement = trkpt.getElementsByTagName('name')[0];
        const timeElement = trkpt.getElementsByTagName('time')[0];
        const name = nameElement ? nameElement.textContent || undefined : undefined;
        const time = timeElement ? timeElement.textContent || undefined : undefined;

        points.push({ lat, lon, name, time });
      }

      if (points.length === 0) {
        throw new Error('No track points found in GPX file.');
      }

      setGpxPoints(points);
    } catch (err: any) {
      console.error('Error parsing GPX file:', err);
      setGpxError(err.message || 'Error parsing GPX file. Please ensure it is a valid GPX format.');
    } finally {
      setGpxLoading(false);
    }
  };

  /* ==============================
     ====== Metadata Viewer States ===
     ============================== */
  const [metadataImage, setMetadataImage] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<Record<string, any> | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataError, setMetadataError] = useState<string | null>(null);
  const metadataInputRef = useRef<HTMLInputElement>(null);

  // Handle Metadata Image Upload
  const handleMetadataUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setMetadataImage(file);
    setMetadataLoading(true);
    setMetadataError(null);
    setMetadata(null);

    try {
      const extractedMetadata = await exifr.parse(file, true);
      if (!extractedMetadata) {
        setMetadataError('No metadata found in the uploaded image.');
      } else {
        setMetadata(extractedMetadata);
      }
    } catch (err) {
      console.error('Error extracting metadata:', err);
      setMetadataError('Error extracting metadata. Please try again.');
    } finally {
      setMetadataLoading(false);
    }
  };

  /* ==============================
     ====== Helper Functions ======
     ============================== */
  function calculateDistance(images: ImageMetadata[]): number {
    let total = 0;
    for (let i = 0; i < images.length - 1; i++) {
      total += getDistanceFromLatLonInKm(
        images[i].latitude,
        images[i].longitude,
        images[i + 1].latitude,
        images[i + 1].longitude
      );
    }
    return total;
  }

  function getDistanceFromLatLonInKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /* ==============================
     ====== Render Function ========
     ============================== */
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Udaan Recce Route Mapper
          </h1>
          <p className="text-lg text-gray-600">
            Upload images with GPS data to visualize your route instantly
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                activeTab === 'map'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              Map
            </button>
            <button
              onClick={() => setActiveTab('gpxViewer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                activeTab === 'gpxViewer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              GPX Viewer
            </button>
            <button
              onClick={() => setActiveTab('metadataViewer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                activeTab === 'metadataViewer'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Info className="w-4 h-4" />
              Metadata Viewer
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          {activeTab === 'map' && (
            /* =====================
               ====== Map Tab ======
               ===================== */
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Upload or Add Images
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Select images with GPS data to create or update your route. The
                  images should be in their original format and contain GPS
                  information.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => uploadInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Images
                </button>
                <button
                  onClick={() => addInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Add Images
                </button>
              </div>
              {/* Hidden file inputs */}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                ref={uploadInputRef}
                style={{ display: 'none' }}
              />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleAddImages}
                ref={addInputRef}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {activeTab === 'gpxViewer' && (
            /* =========================
               ====== GPX Viewer ========
               ========================= */
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Upload GPX File
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a GPX file to view the route on the map.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => gpxInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload GPX
                </button>
                {gpxFile && (
                  <span className="text-gray-700">
                    {gpxFile.name}
                  </span>
                )}
              </div>
              {/* Hidden GPX file input */}
              <input
                type="file"
                accept=".gpx"
                onChange={handleGpxUpload}
                ref={gpxInputRef}
                style={{ display: 'none' }}
              />

              {/* Loading Indicator */}
              {gpxLoading && (
                <div className="mt-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-600">Processing GPX file...</p>
                </div>
              )}

              {/* Error Message */}
              {gpxError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{gpxError}</p>
                </div>
              )}

              {/* GPX Map Display */}
              {gpxPoints.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <MapIcon className="w-5 h-5" />
                    GPX Route
                  </h3>
                  <GpxMap gpxPoints={gpxPoints} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'metadataViewer' && (
            /* ================================
               ====== Metadata Viewer ========
               ================================ */
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Upload Image to View Metadata
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a single image to view all its available metadata.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => metadataInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </button>
                {metadataImage && (
                  <span className="text-gray-700">
                    {metadataImage.name}
                  </span>
                )}
              </div>
              {/* Hidden Metadata Image file input */}
              <input
                type="file"
                accept="image/*"
                onChange={handleMetadataUpload}
                ref={metadataInputRef}
                style={{ display: 'none' }}
              />

              {/* Loading Indicator */}
              {metadataLoading && (
                <div className="mt-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-yellow-500 border-t-transparent"></div>
                  <p className="mt-2 text-gray-600">Extracting metadata...</p>
                </div>
              )}

              {/* Error Message */}
              {metadataError && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{metadataError}</p>
                </div>
              )}

              {/* Metadata Display */}
              {metadata && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">
                    Metadata for {metadataImage?.name}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                      <thead>
                        <tr>
                          <th className="py-2 px-4 border-b">Field</th>
                          <th className="py-2 px-4 border-b">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(metadata).map(([key, value]) => (
                          <tr key={key}>
                            <td className="py-2 px-4 border-b font-medium">
                              {key}
                            </td>
                            <td className="py-2 px-4 border-b">
                              {typeof value === 'object' ? JSON.stringify(value) : value?.toString() || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading Indicator for Map Tab */}
        {activeTab === 'map' && loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-2 text-gray-600">Processing images...</p>
          </div>
        )}

        {/* Error Message for Map Tab */}
        {activeTab === 'map' && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Map Tab Content */}
        {activeTab === 'map' && images.length > 0 && (
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
                  {showLines ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  {showLines ? 'Hide Routes' : 'Show Routes'}
                </button>
                <button
                  onClick={() => setShowPoints(!showPoints)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100"
                >
                  {showPoints ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
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
              {images.length} photos plotted • Total distance:{' '}
              {calculateDistance(images).toFixed(2)} km
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

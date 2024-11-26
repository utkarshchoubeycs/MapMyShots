// src/App.tsx

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload, Download, Map as MapIcon, Image as ImageIcon,
  Eye, EyeOff, FileText, Info, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // Ensure framer-motion is installed
import Map from './components/Map';
import GpxMap from './components/GpxMap';
import { generateGPX } from './utils/gpx';
import ImageViewer from './components/ImageViewer';
import { ImageMetadata } from './types';
import exifr from 'exifr';
import { theme } from './themes'; // Import the theme

// Define GPXPoint type
interface GPXPoint {
  lat: number;
  lon: number;
  name?: string;
  time?: string;
}

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
  const [gpxPoints, setGpxPoints] = useState<GPXPoint[]>([]);
  const [gpxLoading, setGpxLoading] = useState(false);
  const [gpxError, setGpxError] = useState<string | null>(null);
  const gpxInputRef = useRef<HTMLInputElement>(null);

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
    <div className={`${theme.layout.container}`}>
      <motion.div
        className="max-w-7xl mx-auto space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className={`${theme.layout.header}`}
          variants={theme.animations.fadeIn}
          initial="initial"
          animate="animate"
        >
          <h1 className={theme.text.heading1}>
            Udaan Recce Route Mapper
          </h1>
          <p className={theme.text.paragraph}>
            Transform your journey into interactive visualizations
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          className={`${theme.layout.glassPane}`}
          variants={theme.animations.fadeIn}
          initial="initial"
          animate="animate"
        >
          <nav className={`${theme.layout.nav}`}>
            {['map', 'gpxViewer', 'metadataViewer'].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'bg-gray-300/50 text-gray-800 hover:bg-gray-400/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab === 'map' && <MapIcon className={theme.colors.button.icon} />}
                {tab === 'gpxViewer' && <FileText className={theme.colors.button.icon} />}
                {tab === 'metadataViewer' && <Info className={theme.colors.button.icon} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace('Viewer', ' Viewer')}
              </motion.button>
            ))}
          </nav>
        </motion.div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            className={`${theme.layout.contentPane}`}
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'map' && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className={`${theme.text.heading2}`}>
                    <ImageIcon className="w-6 h-6 text-blue-500" />
                    <span>Image Upload</span>
                  </h2>
                  <p className={`${theme.text.textSecondary}`}>
                    Select GPS-tagged images to visualize your route. Supported formats: JPG, JPEG, PNG
                  </p>
                  <div className="flex gap-4">
                    <motion.button
                      onClick={() => uploadInputRef.current?.click()}
                      className={`${theme.buttons.upload} ${theme.colors.primary}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Upload className={`${theme.colors.button.icon}`} />
                      Upload Images
                    </motion.button>
                    <motion.button
                      onClick={() => addInputRef.current?.click()}
                      className={`${theme.buttons.upload} ${theme.colors.secondary}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Upload className={`${theme.colors.button.icon}`} />
                      Add More Images
                    </motion.button>
                  </div>
                </div>

                {loading && (
                  <motion.div
                    className="flex items-center justify-center py-8"
                    variants={theme.animations.spinner}
                    initial="initial"
                    animate="animate"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className={`${theme.colors.spinner}`} />
                      <p className={`${theme.text.textSecondary}`}>Processing your images...</p>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    className={`${theme.colors.error} p-4 rounded-lg`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="font-medium">Error</p>
                    <p className="text-sm opacity-90">{error}</p>
                  </motion.div>
                )}

                {images.length > 0 && (
                  <motion.div
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <MapIcon className="w-5 h-5 text-blue-500" />
                        Route Visualization
                      </h3>
                      <div className="flex items-center gap-4">
                        <motion.button
                          onClick={() => setShowLines(!showLines)}
                          className={`${theme.buttons.toggle}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {showLines ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {showLines ? 'Hide Routes' : 'Show Routes'}
                        </motion.button>
                        <motion.button
                          onClick={() => setShowPoints(!showPoints)}
                          className={`${theme.buttons.toggle}`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {showPoints ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {showPoints ? 'Hide Points' : 'Show Points'}
                        </motion.button>
                        <motion.button
                          onClick={downloadGPX}
                          className={`${theme.colors.primary} px-6 py-2 rounded-lg flex items-center gap-2`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Download className={`${theme.colors.button.icon}`} />
                          Export GPX
                        </motion.button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <motion.div
                        className={`${theme.layout.glassPane} overflow-hidden`}
                        layout
                      >
                        <Map
                          images={images}
                          selectedIndex={selectedImageIndex}
                          onImageSelect={setSelectedImageIndex}
                          showLines={showLines}
                          showPoints={showPoints}
                        />
                      </motion.div>
                      <motion.div
                        className={`${theme.layout.glassPane} overflow-hidden`}
                        layout
                      >
                        <ImageViewer
                          images={images}
                          currentIndex={selectedImageIndex}
                          onNext={handleNext}
                          onPrevious={handlePrevious}
                        />
                      </motion.div>
                    </div>

                    <motion.div
                      className="text-sm text-gray-600 flex items-center gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <span className={`${theme.layout.badge}`}>
                        {images.length} photos plotted
                      </span>
                      <span className={`${theme.layout.badge}`}>
                        {calculateDistance(images).toFixed(2)} km total distance
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === 'gpxViewer' && (
              <motion.div
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="space-y-4">
                  <h2 className={`${theme.text.heading2}`}>
                    <FileText className="w-6 h-6 text-blue-500" />
                    GPX File Viewer
                  </h2>
                  <p className={`${theme.text.textSecondary}`}>
                    Upload a GPX file to visualize your route data
                  </p>
                  <motion.button
                    onClick={() => gpxInputRef.current?.click()}
                    className={`${theme.colors.primary} ${theme.buttons.upload}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Upload className={`${theme.colors.button.icon}`} />
                    Upload GPX File
                    {gpxFile && (
                      <span className="ml-2 text-sm opacity-80">
                        ({gpxFile.name})
                      </span>
                    )}
                  </motion.button>
                </div>

                {gpxLoading && (
                  <motion.div
                    className="flex items-center justify-center py-8"
                    variants={theme.animations.spinner}
                    initial="initial"
                    animate="animate"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className={`${theme.colors.spinner}`} />
                      <p className={`${theme.text.textSecondary}`}>Processing GPX file...</p>
                    </div>
                  </motion.div>
                )}

                {gpxError && (
                  <motion.div
                    className={`${theme.colors.error} p-4 rounded-lg`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="font-medium">Error</p>
                    <p className="text-sm opacity-90">{gpxError}</p>
                  </motion.div>
                )}

                {gpxPoints.length > 0 && (
                  <motion.div
                    className={`${theme.layout.glassPane} p-4`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <GpxMap gpxPoints={gpxPoints} />
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'metadataViewer' && (
              <motion.div
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="space-y-4">
                  <h2 className={`${theme.text.heading2}`}>
                    <Info className="w-6 h-6 text-blue-500" />
                    Image Metadata Viewer
                  </h2>
                  <p className={`${theme.text.textSecondary}`}>
                    Upload an image to view its detailed metadata
                  </p>
                  <motion.button
                    onClick={() => metadataInputRef.current?.click()}
                    className={`${theme.colors.primary} ${theme.buttons.upload}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Upload className={`${theme.colors.button.icon}`} />
                    Select Image
                    {metadataImage && (
                      <span className="ml-2 text-sm opacity-80">
                        ({metadataImage.name})
                      </span>
                    )}
                  </motion.button>
                </div>

                {metadataLoading && (
                  <motion.div
                    className="flex items-center justify-center py-8"
                    variants={theme.animations.spinner}
                    initial="initial"
                    animate="animate"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className={`${theme.colors.spinner}`} />
                      <p className={`${theme.text.textSecondary}`}>Extracting metadata...</p>
                    </div>
                  </motion.div>
                )}

                {metadataError && (
                  <motion.div
                    className={`${theme.colors.error} p-4 rounded-lg`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="font-medium">Error</p>
                    <p className="text-sm opacity-90">{metadataError}</p>
                  </motion.div>
                )}

                {metadata && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <h3 className={`${theme.text.heading3}`}>
                      Metadata Results
                    </h3>
                    <div className={`${theme.layout.glassPane} overflow-x-auto`}>
                      <table className={`${theme.layout.table}`}>
                        <thead>
                          <tr className={`${theme.layout.tableHeader}`}>
                            <th className="py-3 px-4 text-left text-gray-600">Field</th>
                            <th className="py-3 px-4 text-left text-gray-600">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(metadata).map(([key, value]) => (
                            <tr key={key} className={`${theme.layout.tableRow}`}>
                              <td className="py-3 px-4 font-medium text-blue-500">{key}</td>
                              <td className="py-3 px-4 text-gray-700">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Hidden Input Elements */}
        <input type="file" multiple accept="image/*" onChange={handleImageUpload} ref={uploadInputRef} className="hidden" />
        <input type="file" multiple accept="image/*" onChange={handleAddImages} ref={addInputRef} className="hidden" />
        <input type="file" accept=".gpx" onChange={handleGpxUpload} ref={gpxInputRef} className="hidden" />
        <input type="file" accept="image/*" onChange={handleMetadataUpload} ref={metadataInputRef} className="hidden" />
      </motion.div>
    </div>
  );
}

export default App;
import React, { useEffect, useState, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Calendar,
  Mountain,
  Aperture,
  X,
  Maximize,
  Minimize,
} from 'lucide-react';
import { ImageMetadata } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Centralized Theme Object (Ensure this matches the theme in App.tsx)
const theme = {
  glassPane:
    'backdrop-blur-md bg-white/80 border border-gray-200 rounded-xl',
  buttonPrimary:
    'bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 ease-in-out transform hover:scale-105',
  buttonSecondary:
    'bg-gray-300 hover:bg-gray-400 text-black transition-all duration-200 ease-in-out',
  inputStyle:
    'bg-gray-200 border border-gray-300 rounded-lg p-2 text-black focus:ring-2 focus:ring-blue-500',
  textPrimary: 'text-gray-800',
  textSecondary: 'text-gray-600',
  errorBg: 'bg-red-100 border border-red-400 text-red-700',
  successBg: 'bg-green-100 border border-green-400 text-green-700',
};

interface ImageViewerProps {
  images: ImageMetadata[];
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  currentIndex,
  onNext,
  onPrevious,
}) => {
  const currentImage = images[currentIndex];
  const [isEnlarged, setIsEnlarged] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        onPrevious();
      }
      if (e.key === 'ArrowRight') {
        onNext();
      }
      if (e.key.toLowerCase() === 'f') {
        toggleEnlarge();
      }
      if (e.key === 'Escape' && isEnlarged) {
        setIsEnlarged(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onNext, onPrevious, isEnlarged]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isEnlarged) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isEnlarged]);

  if (!currentImage) return null;

  const formatExposure = (exposure: number) => {
    if (exposure >= 1) return `${exposure}s`;
    return `1/${Math.round(1 / exposure)}s`;
  };

  const toggleEnlarge = () => {
    setIsEnlarged((prev) => !prev);
  };

  return (
    <>
      <div className="relative" ref={imageContainerRef}>
        <div className="relative aspect-video">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage.url}
              src={currentImage.url}
              alt={`Location ${currentIndex + 1}`}
              className="w-full h-full object-cover cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleEnlarge}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900/90 pointer-events-none" />

          {/* Navigation Buttons */}
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <motion.button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="p-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white/90 hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Previous Image"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <motion.button
              onClick={onNext}
              disabled={currentIndex === images.length - 1}
              className="p-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white/90 hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Next Image"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <motion.h3
              className="text-lg font-medium text-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Photo {currentIndex + 1} of {images.length}
            </motion.h3>
            <div className="flex items-center gap-2">
              <motion.div
                className="px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-blue-500 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {currentImage.fileName}
              </motion.div>
              {/* Enlarge Toggle Button */}
              <motion.button
                onClick={toggleEnlarge}
                className="p-2 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 transition-all duration-200 ease-in-out"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={isEnlarged ? 'Minimize Image' : 'Enlarge Image'}
              >
                {isEnlarged ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Instruction for Enlarge Toggle */}
          <motion.div
            className="text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Press <kbd className="bg-gray-200 px-1 rounded">F</kbd> to toggle enlarge
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {currentImage.timestamp && (
              <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>{format(new Date(currentImage.timestamp), 'PPpp')}</span>
              </div>
            )}
            {(currentImage.make || currentImage.model) && (
              <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-lg">
                <Camera className="w-4 h-4 text-blue-500" />
                <span>
                  {[currentImage.make, currentImage.model].filter(Boolean).join(' ')}
                </span>
              </div>
            )}
            {currentImage.altitude !== undefined &&
              currentImage.altitude !== null && (
                <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-lg">
                  <Mountain className="w-4 h-4 text-blue-500" />
                  <span>Altitude: {Math.round(currentImage.altitude)}m</span>
                </div>
              )}
            {(currentImage.fNumber ||
              currentImage.exposureTime ||
              currentImage.iso) && (
              <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-lg">
                <Aperture className="w-4 h-4 text-blue-500" />
                <span>
                  {currentImage.fNumber && `ƒ/${currentImage.fNumber}`}
                  {currentImage.exposureTime && ` ${formatExposure(currentImage.exposureTime)}`}
                  {currentImage.iso && ` ISO${currentImage.iso}`}
                </span>
              </div>
            )}
            {(currentImage.latitude !== undefined &&
              currentImage.latitude !== null) && (
              <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-lg">
                <Mountain className="w-4 h-4 text-blue-500" />
                <span>Latitude: {currentImage.latitude.toFixed(6)}</span>
              </div>
            )}
            {(currentImage.longitude !== undefined &&
              currentImage.longitude !== null) && (
              <div className="flex items-center gap-3 bg-gray-100 px-4 py-3 rounded-lg">
                <Mountain className="w-4 h-4 text-blue-500" />
                <span>Longitude: {currentImage.longitude.toFixed(6)}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Enlarged Image Modal */}
      <AnimatePresence>
        {isEnlarged && (
          <motion.div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleEnlarge}
          >
            <motion.div
              className="relative bg-white rounded-lg overflow-hidden"
              style={{ width: '80vw' }} // 80% of viewport width
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
              <motion.img
                src={currentImage.url}
                alt={`Location ${currentIndex + 1}`}
                className="w-full h-auto object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
              <motion.button
                onClick={toggleEnlarge}
                className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white/100 transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close Enlarged View"
              >
                <X className="w-6 h-6 text-gray-800" />
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ImageViewer;
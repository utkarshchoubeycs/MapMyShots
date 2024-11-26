import React from 'react';
import { ChevronLeft, ChevronRight, Camera, Calendar, Mountain, Aperture } from 'lucide-react';
import { ImageMetadata } from '../types';
import { format } from 'date-fns';

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

  if (!currentImage) return null;

  const formatExposure = (exposure: number) => {
    if (exposure >= 1) return `${exposure}s`;
    return `1/${Math.round(1/exposure)}s`;
  };

  return (
    <div className="relative bg-white rounded-lg overflow-hidden">
      <div className="relative aspect-video">
        <img
          src={currentImage.url}
          alt={`Location ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50" />
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Photo {currentIndex + 1} of {images.length}</h3>
          <div className="flex gap-2">
            <button
              onClick={onPrevious}
              disabled={currentIndex === 0}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onNext}
              disabled={currentIndex === images.length - 1}
              className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-1 text-sm text-gray-600">
          {currentImage.timestamp && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(currentImage.timestamp, 'PPpp')}</span>
            </div>
          )}
          {(currentImage.make || currentImage.model) && (
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span>{[currentImage.make, currentImage.model].filter(Boolean).join(' ')}</span>
            </div>
          )}
          {currentImage.altitude && (
            <div className="flex items-center gap-2">
              <Mountain className="w-4 h-4" />
              <span>Altitude: {Math.round(currentImage.altitude)}m</span>
            </div>
          )}
          {(currentImage.fNumber || currentImage.exposureTime || currentImage.iso) && (
            <div className="flex items-center gap-2">
              <Aperture className="w-4 h-4" />
              <span>
                {currentImage.fNumber && `ƒ/${currentImage.fNumber}`}
                {currentImage.exposureTime && ` ${formatExposure(currentImage.exposureTime)}`}
                {currentImage.iso && ` ISO${currentImage.iso}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageViewer;
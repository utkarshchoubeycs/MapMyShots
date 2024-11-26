import { buildGPX, BaseBuilder } from 'gpx-builder';
import { ImageMetadata } from '../types';
const { Point, Metadata } = BaseBuilder.MODELS;

export const generateGPX = (images: ImageMetadata[]) => {
  const points = images.map(img => {
    const point = new Point(img.latitude, img.longitude);
    if (img.timestamp) {
      point.time = img.timestamp;
    }
    // Add device info as a comment if available
    if (img.make || img.model) {
      point.comment = [img.make, img.model].filter(Boolean).join(' ');
    }
    return point;
  });
  
  const gpxBuilder = new BaseBuilder();
  
  // Add metadata
  const metadata = new Metadata();
  metadata.name = 'Photo Route';
  metadata.desc = `Route generated from ${images.length} photos`;
  metadata.time = new Date();
  
  gpxBuilder.setMetadata(metadata);
  gpxBuilder.setSegmentPoints(points);
  
  return buildGPX(gpxBuilder.toObject());
};

export const parseGPX = async (gpxString: string): Promise<[number, number][]> => {
  const parser = new DOMParser();
  const gpxDoc = parser.parseFromString(gpxString, 'text/xml');
  const trackPoints = gpxDoc.getElementsByTagName('trkpt');
  
  const coordinates: [number, number][] = [];
  
  for (let i = 0; i < trackPoints.length; i++) {
    const point = trackPoints[i];
    const lat = parseFloat(point.getAttribute('lat') || '0');
    const lon = parseFloat(point.getAttribute('lon') || '0');
    coordinates.push([lat, lon]);
  }
  
  return coordinates;
};
import { buildGPX, BaseBuilder } from 'gpx-builder';
import { ImageMetadata } from '../types';
const { Point, Metadata } = BaseBuilder.MODELS;

export const generateGPX = (images: ImageMetadata[]) => {
  const points = images.map(img => {
    const pointOptions: any = {};
    if (img.timestamp) {
      pointOptions.time = img.timestamp;
    }
    // Use 'cmt' for comments as per GPX schema
    if (img.make || img.model) {
      pointOptions.cmt = [img.make, img.model].filter(Boolean).join(' ');
    }
    // Pass additional properties in the third parameter
    return new Point(img.latitude, img.longitude, pointOptions);
  });

  const gpxBuilder = new BaseBuilder();

  // Add metadata directly using an object
  gpxBuilder.setMetadata(new Metadata({
    name: 'Photo Route',
    desc: `Route generated from ${images.length} photos`,
    time: new Date(),
  }));

  gpxBuilder.setSegmentPoints(points);

  // Use the buildGPX function imported from 'gpx-builder'
  return buildGPX(gpxBuilder.toObject());
};

export interface ImageMetadata {
  latitude: number;
  longitude: number;
  timestamp?: Date;
  make?: string;
  model?: string;
  fileName: string;
  url: string;
  altitude?: number;
  exposureTime?: number;
  fNumber?: number;
  iso?: number;
  focalLength?: number;
}

export interface GPXRoute {
  name?: string;
  desc?: string;
  author?: string;
  email?: string;
  link?: string;
  time?: Date;
}

export interface GPXPoint {
  lat: number;
  lon: number;
  name?: string;
  time?: string;
}
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
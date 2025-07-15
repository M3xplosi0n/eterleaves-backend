import { Point } from "geojson";

export interface EterLeaf {
  id: number;
  title: string;
  content: string;
  location: Point;
  created_at: Date;
}

export interface CreateEterLeafRequest {
  title: string;
  content: string;
  longitude: number;
  latitude: number;
}

export interface GetNearbyRequest {
  longitude: string;
  latitude: string;
  radius?: number;
}

export interface EterLeafResponse extends Omit<EterLeaf, "location"> {
  location: Point;
}

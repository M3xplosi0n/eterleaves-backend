import { EterLeaf } from "../models/leaves";
import { DEFAULT_RADIUS_METERS } from "../constants";
import { Point } from "geojson";

// Tipi per il servizio
interface CreateEterLeafRequest {
  title: string;
  content: string;
  longitude: number;
  latitude: number;
}

interface GetNearbyRequest {
  longitude: string;
  latitude: string;
  radius?: number;
}

interface EterLeafResponse {
  id: number;
  title: string;
  content: string;
  location: Point;
  created_at: Date;
}

// Esportiamo i tipi per l'uso nel controller
export type { CreateEterLeafRequest, GetNearbyRequest, EterLeafResponse };

export class EterLeafService {
  static async createEterLeaf(data: CreateEterLeafRequest): Promise<any> {
    const { title, content, longitude, latitude } = data;

    const newSpot = await EterLeaf.query()
      .insert({
        title,
        content,
        location: EterLeaf.createLocation(longitude, latitude),
      })
      .returning("*");

    return newSpot;
  }

  static async getAllEterLeaves(): Promise<EterLeafResponse[]> {
    const spots = await EterLeaf.selectWithLocation();
    return spots;
  }

  static async getNearbyEterLeaves(
    params: GetNearbyRequest
  ): Promise<EterLeafResponse[]> {
    const { longitude, latitude, radius = DEFAULT_RADIUS_METERS } = params;

    const spots = await EterLeaf.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      radius
    );
    return spots;
  }
}

import { EterLeaf } from "../models/leaves";
import {
  CreateEterLeafRequest,
  EterLeafResponse,
  GetNearbyRequest,
} from "../types/leaves";
import { DEFAULT_RADIUS_METERS } from "../constants";

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

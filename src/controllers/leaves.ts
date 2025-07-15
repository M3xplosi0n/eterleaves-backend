import { Request, Response } from "express";
import { EterLeafService } from "../services/leaves";
import { CreateEterLeafRequest, GetNearbyRequest } from "../types/leaves";

export class EterLeafController {
  static async createEterLeaf(
    req: Request<{}, {}, CreateEterLeafRequest>,
    res: Response
  ) {
    try {
      const newSpot = await EterLeafService.createEterLeaf(req.body);
      res.status(201).json(newSpot);
    } catch (error) {
      console.error("Error creating eter leaf:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getAllEterLeaves(req: Request, res: Response) {
    try {
      const spots = await EterLeafService.getAllEterLeaves();
      res.json(spots);
    } catch (error) {
      console.error("Error fetching eter leaves:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getNearbyEterLeaves(req: Request, res: Response) {
    try {
      const { longitude, latitude } = req.query as {
        longitude: string;
        latitude: string;
      };

      if (!longitude || !latitude) {
        res.status(400).json({ error: "Longitude and latitude are required" });
        return;
      }

      const spots = await EterLeafService.getNearbyEterLeaves({
        longitude,
        latitude,
      });

      res.json(spots);
    } catch (error) {
      console.error("Error fetching nearby eter leaves:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

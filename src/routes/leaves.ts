import { Router } from "express";
import { EterLeafController } from "../controllers/leaves";
import {
  validateCreateEterLeaf,
  validateCoordinates,
} from "../middleware/leaves";

const router = Router();

// POST /api/leaves - Create a new eter leaf
router.post("/", validateCreateEterLeaf, EterLeafController.createEterLeaf);

// GET /api/leaves - Get all eter leaves
router.get("/", EterLeafController.getAllEterLeaves);

// GET /api/leaves/near - Get nearby eter leaves
router.get(
  "/near",
  validateCoordinates,
  EterLeafController.getNearbyEterLeaves
);

export default router;

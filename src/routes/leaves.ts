import { Router } from "express";
import { EterLeafController } from "../controllers/leaves";
import {
  validateCoordinates,
  validateSubmitSignedTransaction,
} from "../middleware/leaves";

const router = Router();

// POST /api/leaves - Create a new eter leaf (blockchain transaction)
router.post(
  "/",
  validateSubmitSignedTransaction,
  EterLeafController.createEterLeaf
);

// GET /api/leaves - Get all eter leaves
router.get("/", EterLeafController.getAllEterLeaves);

// GET /api/leaves/near - Get nearby eter leaves
router.get(
  "/near",
  validateCoordinates,
  EterLeafController.getNearbyEterLeaves
);

export default router;

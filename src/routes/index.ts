import { Router } from "express";
import eterLeafRoutes from "./leaves";

const router = Router();

// Mount eter leaf routes
router.use("/leaves", eterLeafRoutes);

export default router;

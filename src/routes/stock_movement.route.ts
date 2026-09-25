import { Router } from "express";
import { createStockMovement, listStockMovements } from "../controller/stock_movement.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", createStockMovement);
router.get("/", listStockMovements);

export default router;
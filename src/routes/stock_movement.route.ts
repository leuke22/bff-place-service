import { Router } from "express";
import { createStockMovement, listStockMovements } from "../controller/stock_movement.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("admin", "manager"), createStockMovement);
router.get("/", listStockMovements);

export default router;
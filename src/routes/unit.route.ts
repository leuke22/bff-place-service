import { Router } from "express";
import { createUnit, listUnits, getUnit, updateUnit, deleteUnit } from "../controller/unit.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("admin", "manager"), createUnit);
router.get("/", listUnits);
router.get("/:id", getUnit);
router.put("/:id", requireRole("admin", "manager"), updateUnit);
router.delete("/:id", requireRole("admin", "manager"), deleteUnit);

export default router;
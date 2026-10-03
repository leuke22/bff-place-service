import { Router } from "express";
import { openShift, getCurrentShift, getShift, closeShift, listShifts } from "../controller/shift.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", openShift);
router.get("/current", getCurrentShift);
router.get("/", requireRole("admin", "manager"), listShifts);
router.get("/:id", getShift);
router.patch("/:id/close", closeShift);

export default router;
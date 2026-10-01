import { Router } from "express";
import { openShift, getCurrentShift, closeShift, listShifts } from "../controller/shift.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", openShift);
router.get("/current", getCurrentShift);
router.get("/", requireRole("admin", "manager"), listShifts);
router.patch("/:id/close", closeShift);

export default router;
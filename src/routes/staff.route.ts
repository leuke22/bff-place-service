import { Router } from "express";
import { createStaff, listStaff, getStaff, updateStaff, deleteStaff } from "../controller/staff.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth, requireRole("admin", "manager"));

router.post("/", createStaff);
router.get("/", listStaff);
router.get("/:id", getStaff);
router.patch("/:id", updateStaff);
router.delete("/:id", deleteStaff);

export default router;
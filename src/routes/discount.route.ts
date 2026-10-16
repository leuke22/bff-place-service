import { Router } from "express";
import { createDiscount, listDiscounts, getDiscount, updateDiscount, deleteDiscount } from "../controller/discount.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

// Any signed-in role (cashiers included) can read and apply discounts; only admin/manager manage them.
router.get("/", listDiscounts);
router.get("/:id", getDiscount);
router.post("/", requireRole("admin", "manager"), createDiscount);
router.put("/:id", requireRole("admin", "manager"), updateDiscount);
router.delete("/:id", requireRole("admin", "manager"), deleteDiscount);

export default router;

import { Router } from "express";
import { createSupplier, listSuppliers, getSupplier, updateSupplier, deleteSupplier } from "../controller/supplier.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("admin", "manager"), createSupplier);
router.get("/", listSuppliers);
router.get("/:id", getSupplier);
router.put("/:id", requireRole("admin", "manager"), updateSupplier);
router.delete("/:id", requireRole("admin", "manager"), deleteSupplier);

export default router;
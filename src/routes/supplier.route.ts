import { Router } from "express";
import { createSupplier, listSuppliers, getSupplier, updateSupplier, deleteSupplier } from "../controller/supplier.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", createSupplier);
router.get("/", listSuppliers);
router.get("/:id", getSupplier);
router.put("/:id", updateSupplier);
router.delete("/:id", deleteSupplier);

export default router;
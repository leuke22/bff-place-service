import { Router } from "express";
import {
    createPurchaseOrder,
    listPurchaseOrders,
    getPurchaseOrder,
    markAsOrdered,
    receivePurchaseOrder,
    cancelPurchaseOrder,
} from "../controller/purchase_order.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("admin", "manager"), createPurchaseOrder);
router.get("/", listPurchaseOrders);
router.get("/:id", getPurchaseOrder);
router.patch("/:id/order", requireRole("admin", "manager"), markAsOrdered);
router.patch("/:id/receive", requireRole("admin", "manager"), receivePurchaseOrder);
router.patch("/:id/cancel", requireRole("admin", "manager"), cancelPurchaseOrder);

export default router;
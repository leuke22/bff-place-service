import { Router } from "express";
import {
    createPurchaseOrder,
    listPurchaseOrders,
    getPurchaseOrder,
    markAsOrdered,
    receivePurchaseOrder,
    cancelPurchaseOrder,
} from "../controller/purchase_order.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", createPurchaseOrder);
router.get("/", listPurchaseOrders);
router.get("/:id", getPurchaseOrder);
router.patch("/:id/order", markAsOrdered);
router.patch("/:id/receive", receivePurchaseOrder);
router.patch("/:id/cancel", cancelPurchaseOrder);

export default router;
import { Router } from "express";
import { createOrder, listOrders, getOrder, updateOrderStatus } from "../controller/order.controller";
import { payOrder } from "../controller/payment.controller";
import { requireAuth } from "../middleware/auth";
    
const router = Router();

router.use(requireAuth);

router.post("/", createOrder);
router.get("/", listOrders);
router.get("/:id", getOrder);
router.patch("/:id/status", updateOrderStatus);
router.post("/:id/payment", payOrder);

export default router;
import { Router } from "express";
import { createOrder, listOrders, getOrder, updateOrderStatus } from "../controller/order.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", createOrder);
router.get("/", listOrders);
router.get("/:id", getOrder);
router.patch("/:id/status", updateOrderStatus);

export default router;
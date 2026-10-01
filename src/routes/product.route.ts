import { Router } from "express";
import { createProduct, listProducts, getProduct, updateProduct, deleteProduct } from "../controller/product.controller";
import { requireAuth, requireRole } from "../middleware/auth";
import productIngredientRoutes from "./product_ingredient.route";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("admin", "manager"), createProduct);
router.get("/", listProducts);
router.get("/:id", getProduct);
router.put("/:id", requireRole("admin", "manager"), updateProduct);
router.delete("/:id", requireRole("admin", "manager"), deleteProduct);

router.use("/:productId/ingredients", productIngredientRoutes);

export default router;
import { Router } from "express";
import { createProduct, listProducts, getProduct, updateProduct, deleteProduct } from "../controller/product.controller";
import { requireAuth } from "../middleware/auth";
import productIngredientRoutes from "./product_ingredient.route";

const router = Router();

router.use(requireAuth);

router.post("/", createProduct);
router.get("/", listProducts);
router.get("/:id", getProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

router.use("/:productId/ingredients", productIngredientRoutes);

export default router;
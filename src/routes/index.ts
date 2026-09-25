import { Router } from "express";
import authRoutes from "./auth.route";
import categoryRoutes from "./category.route";
import productRoutes from "./product.route";
import ingredientRoutes from "./ingredient.route";
import supplierRoutes from "./supplier.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/ingredients", ingredientRoutes);
router.use("/suppliers", supplierRoutes);

export default router;
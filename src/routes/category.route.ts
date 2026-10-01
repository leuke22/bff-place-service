import { Router } from "express";
import { createCategory, listCategories, getCategory, updateCategory, deleteCategory, listCategoryByProductCount } from "../controller/category.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("admin", "manager"), createCategory);
router.get("/", listCategories);
router.get("/product-count", listCategoryByProductCount);
router.get("/:id", getCategory);
router.put("/:id", requireRole("admin", "manager"), updateCategory);
router.delete("/:id", requireRole("admin", "manager"), deleteCategory);

export default router;
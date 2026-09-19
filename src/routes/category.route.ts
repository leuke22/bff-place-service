import { Router } from "express";
import { createCategory, listCategories, getCategory, updateCategory, deleteCategory, listCategoryByProductCount } from "../controller/category.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", createCategory);
router.get("/", listCategories);
router.get("/product-count", listCategoryByProductCount);
router.get("/:id", getCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
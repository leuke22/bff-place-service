import { Router } from "express";
import { createCategory, listCategories, getCategory, updateCategory, deleteCategory } from "../controller/category.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", createCategory);
router.get("/", listCategories);
router.get("/:id", getCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
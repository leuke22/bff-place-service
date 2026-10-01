import { Router } from "express";
import { addRecipeItem, listRecipe, updateRecipeItem, removeRecipeItem } from "../controller/product_ingredient.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post("/", requireRole("admin", "manager"), addRecipeItem);
router.get("/", listRecipe);
router.patch("/:ingredientId", requireRole("admin", "manager"), updateRecipeItem);
router.delete("/:ingredientId", requireRole("admin", "manager"), removeRecipeItem);

export default router;
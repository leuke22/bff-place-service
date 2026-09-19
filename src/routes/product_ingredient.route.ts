import { Router } from "express";
import { addRecipeItem, listRecipe, updateRecipeItem, removeRecipeItem } from "../controller/product_ingredient.controller";
import { requireAuth } from "../middleware/auth";

const router = Router({ mergeParams: true }); // mergeParams lets this router read :productId from the parent

router.use(requireAuth);

router.post("/", addRecipeItem);
router.get("/", listRecipe);
router.patch("/:ingredientId", updateRecipeItem);
router.delete("/:ingredientId", removeRecipeItem);

export default router;
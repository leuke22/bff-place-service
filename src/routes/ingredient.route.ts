import { Router } from "express";
import { createIngredient, listIngredients, getIngredient, updateIngredient, deleteIngredient } from "../controller/ingredient.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", createIngredient);
router.get("/", listIngredients);
router.get("/:id", getIngredient);
router.patch("/:id", updateIngredient);
router.delete("/:id", deleteIngredient);

export default router;
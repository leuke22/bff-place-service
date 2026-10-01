import { Router } from "express";
import { createIngredient, listIngredients, getIngredient, updateIngredient, deleteIngredient } from "../controller/ingredient.controller";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/", requireRole("admin", "manager"), createIngredient);
router.get("/", listIngredients);
router.get("/:id", getIngredient);
router.patch("/:id", requireRole("admin", "manager"), updateIngredient);
router.delete("/:id", requireRole("admin", "manager"), deleteIngredient);

export default router;
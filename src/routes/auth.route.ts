import { Router } from "express";
import { register, login, refresh, logout, me, updateProfile, changePassword } from "../controller/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, updateProfile);
router.patch("/me/password", requireAuth, changePassword);

export default router;
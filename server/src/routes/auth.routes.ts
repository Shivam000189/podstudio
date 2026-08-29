import { Router } from "express";
import { register, login, me, logout, syncClerkUser } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/sync", syncClerkUser);

router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);

export default router;
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(token);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
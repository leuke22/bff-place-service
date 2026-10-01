import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, UserRole } from "../utils/jwt";

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

// Use after requireAuth. Any authenticated role not in the allow-list gets a 403.
export function requireRole(...roles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "You do not have permission to perform this action" });
        }
        next();
    };
}
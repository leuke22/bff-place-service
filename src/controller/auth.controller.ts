import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { eq, and, ne, isNull } from "drizzle-orm";
import { db } from "../db";
import { Users, RefreshTokens } from "../models";
import { registerSchema, loginSchema, refreshSchema, updateProfileSchema, changePasswordSchema } from "../utils/validators";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { hashToken } from "../utils/hash";
import z from "zod";
import { parseDurationToMs } from "../utils/duration";
import { env } from "../env";

const SALT_ROUNDS = 10;

export async function register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const { first_name, middle_name, last_name, email, password } = parsed.data;

    const existing = await db.query.Users.findFirst({ where: eq(Users.email, email) });
    if (existing) {
        return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // role is never taken from the request body — it always falls back to the DB
    // default ("cashier"). Promoting someone to manager/admin is done via Staff Management.
    const [newUser] = await db
        .insert(Users)
        .values({ first_name, middle_name, last_name, email, password: hashedPassword, is_active: true })
        .returning({ id: Users.id, uuid: Users.uuid, first_name: Users.first_name, email: Users.email, role: Users.role });

    const accessToken = signAccessToken({ user_id: newUser.id, email: newUser.email, role: newUser.role });
    const refreshToken = signRefreshToken({ user_id: newUser.id, email: newUser.email, role: newUser.role });

    await storeRefreshToken(newUser.id, refreshToken);

    return res.status(201).json({ user: newUser, access_token: accessToken, refresh_token: refreshToken });
}

export async function login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const { email, password } = parsed.data;

    const user = await db.query.Users.findFirst({ where: eq(Users.email, email) });
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = signAccessToken({ user_id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ user_id: user.id, email: user.email, role: user.role });

    await storeRefreshToken(user.id, refreshToken);

    res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/api/auth",
        maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN),
    });

    return res.json({
        user: { id: user.id, uuid: user.uuid, first_name: user.first_name, email: user.email, role: user.role },
        access_token: accessToken
    });
}

export async function refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
    }

    try {
        const payload = verifyRefreshToken(refreshToken);
        const tokenHash = hashToken(refreshToken);

        const stored = await db.query.RefreshTokens.findFirst({
            where: and(eq(RefreshTokens.token_hash, tokenHash), isNull(RefreshTokens.revoked_at)),
        });

        if (!stored) {
            return res.status(401).json({ message: "Refresh token not recognized or has been revoked" });
        }

        const accessToken = signAccessToken({ user_id: payload.user_id, email: payload.email, role: payload.role });
        return res.json({ access_token: accessToken });
    } catch {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
}

export async function logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
        const tokenHash = hashToken(refreshToken);
        await db
            .update(RefreshTokens)
            .set({ revoked_at: new Date() })
            .where(eq(RefreshTokens.token_hash, tokenHash));
    }

    res.clearCookie("refresh_token", { path: "/api/auth" });
    return res.status(204).send();
}

export async function me(req: Request, res: Response) {
    const userId = req.user!.user_id;

    const user = await db.query.Users.findFirst({
        where: eq(Users.id, userId),
        columns: { id: true, uuid: true, first_name: true, middle_name: true, last_name: true, email: true, avatar: true, role: true, created_at: true },
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
}

export async function updateProfile(req: Request, res: Response) {
    const userId = req.user!.user_id;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    if (parsed.data.email) {
        const existing = await db.query.Users.findFirst({
            where: and(eq(Users.email, parsed.data.email), ne(Users.id, userId)),
        });
        if (existing) {
            return res.status(409).json({ message: "Email is already in use" });
        }
    }

    const [updated] = await db
        .update(Users)
        .set({ ...parsed.data, updated_at: new Date() })
        .where(eq(Users.id, userId))
        .returning({
            id: Users.id, uuid: Users.uuid, first_name: Users.first_name, middle_name: Users.middle_name,
            last_name: Users.last_name, email: Users.email, avatar: Users.avatar, role: Users.role, created_at: Users.created_at,
        });

    return res.json({ user: updated });
}

export async function changePassword(req: Request, res: Response) {
    const userId = req.user!.user_id;
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const user = await db.query.Users.findFirst({ where: eq(Users.id, userId) });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const isValid = await bcrypt.compare(parsed.data.current_password, user.password);
    if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(parsed.data.new_password, SALT_ROUNDS);
    await db.update(Users).set({ password: hashedPassword, updated_at: new Date() }).where(eq(Users.id, userId));

    return res.status(204).send();
}

async function storeRefreshToken(userId: number, token: string) {
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN));

    await db.insert(RefreshTokens).values({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
    });
}
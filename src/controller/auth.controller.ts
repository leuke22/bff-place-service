import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../db";
import { Users, RefreshTokens } from "../models";
import { registerSchema, loginSchema, refreshSchema } from "../utils/validators";
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

    const [newUser] = await db
        .insert(Users)
        .values({ first_name, middle_name, last_name, email, password: hashedPassword, is_active: true })
        .returning({ id: Users.id, uuid: Users.uuid, first_name: Users.first_name, email: Users.email });

    const accessToken = signAccessToken({ user_id: newUser.id, email: newUser.email });
    const refreshToken = signRefreshToken({ user_id: newUser.id, email: newUser.email });

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

    const accessToken = signAccessToken({ user_id: user.id, email: user.email });
    const refreshToken = signRefreshToken({ user_id: user.id, email: user.email });

    await storeRefreshToken(user.id, refreshToken);

    return res.json({
        user: { id: user.id, uuid: user.uuid, first_name: user.first_name, email: user.email },
        access_token: accessToken,
        refresh_token: refreshToken,
    });
}

export async function refresh(req: Request, res: Response) {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const { refresh_token } = parsed.data;

    try {
        const payload = verifyRefreshToken(refresh_token);
        const tokenHash = hashToken(refresh_token);

        const stored = await db.query.RefreshTokens.findFirst({
            where: and(eq(RefreshTokens.token_hash, tokenHash), isNull(RefreshTokens.revoked_at)),
        });

        if (!stored) {
            return res.status(401).json({ message: "Refresh token not recognized or has been revoked" });
        }

        const accessToken = signAccessToken({ user_id: payload.user_id, email: payload.email });
        return res.json({ access_token: accessToken });
    } catch {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
}

export async function logout(req: Request, res: Response) {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const tokenHash = hashToken(parsed.data.refresh_token);

    await db
        .update(RefreshTokens)
        .set({ revoked_at: new Date() })
        .where(eq(RefreshTokens.token_hash, tokenHash));

    return res.status(204).send();
}

export async function me(req: Request, res: Response) {
    const userId = req.user!.user_id;

    const user = await db.query.Users.findFirst({
        where: eq(Users.id, userId),
        columns: { id: true, uuid: true, first_name: true, last_name: true, email: true, avatar: true, created_at: true },
    });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user });
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
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { eq, and, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { Users } from "../models";
import { createStaffSchema, updateStaffSchema } from "../utils/validators";
import { DataResponse, ListResponse } from "../utils/responseHelper";

const SALT_ROUNDS = 10;

// Never return the password hash to the client
const STAFF_QUERY_COLUMNS = {
    id: true,
    uuid: true,
    first_name: true,
    middle_name: true,
    last_name: true,
    email: true,
    avatar: true,
    role: true,
    is_active: true,
    created_at: true,
    updated_at: true,
} as const;

const STAFF_RETURNING_COLUMNS = {
    id: Users.id,
    uuid: Users.uuid,
    first_name: Users.first_name,
    middle_name: Users.middle_name,
    last_name: Users.last_name,
    email: Users.email,
    avatar: Users.avatar,
    role: Users.role,
    is_active: Users.is_active,
    created_at: Users.created_at,
    updated_at: Users.updated_at,
};

export async function createStaff(req: Request, res: Response) {
    const parsed = createStaffSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }
    const { first_name, middle_name, last_name, email, password, role } = parsed.data;

    // Only an admin can hand out the admin role — a manager can only create managers/cashiers.
    if (role === "admin" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only an admin can create another admin account" });
    }

    const existing = await db.query.Users.findFirst({ where: eq(Users.email, email) });
    if (existing) {
        return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [newUser] = await db
        .insert(Users)
        .values({ first_name, middle_name, last_name, email, password: hashedPassword, role, is_active: true })
        .returning(STAFF_RETURNING_COLUMNS);

    return DataResponse(res, newUser, 201);
}

export async function listStaff(req: Request, res: Response) {
    const [staff, [{ count }]] = await Promise.all([
        db.query.Users.findMany({
            where: isNull(Users.deleted_at),
            columns: STAFF_QUERY_COLUMNS,
            orderBy: (u, { asc }) => [asc(u.first_name)],
        }),
        db.select({ count: sql<number>`count(*)` }).from(Users).where(isNull(Users.deleted_at)),
    ]);

    return ListResponse(res, staff, Number(count));
}

export async function getStaff(req: Request, res: Response) {
    const uuid = req.params.id as string;

    const staff = await db.query.Users.findFirst({
        where: and(eq(Users.uuid, uuid), isNull(Users.deleted_at)),
        columns: STAFF_QUERY_COLUMNS,
    });

    if (!staff) {
        return res.status(404).json({ message: "Staff member not found" });
    }
    return DataResponse(res, staff);
}

export async function updateStaff(req: Request, res: Response) {
    const uuid = req.params.id as string;
    const parsed = updateStaffSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: "Validation error", errors: z.treeifyError(parsed.error) });
    }

    const target = await db.query.Users.findFirst({ where: and(eq(Users.uuid, uuid), isNull(Users.deleted_at)) });
    if (!target) {
        return res.status(404).json({ message: "Staff member not found" });
    }

    // Only an admin can promote someone to admin, or touch an existing admin's account at all.
    if (req.user!.role !== "admin" && (parsed.data.role === "admin" || target.role === "admin")) {
        return res.status(403).json({ message: "Only an admin can manage admin accounts" });
    }
    // Stop anyone editing their own role/active status through this endpoint — self-lockout guard.
    if (target.id === req.user!.user_id && (parsed.data.role || parsed.data.is_active === false)) {
        return res.status(400).json({ message: "You can't change your own role or deactivate your own account here" });
    }

    const [updated] = await db
        .update(Users)
        .set({ ...parsed.data, updated_at: new Date() })
        .where(eq(Users.uuid, uuid))
        .returning(STAFF_RETURNING_COLUMNS);

    return DataResponse(res, updated);
}

export async function deleteStaff(req: Request, res: Response) {
    const uuid = req.params.id as string;

    const target = await db.query.Users.findFirst({ where: and(eq(Users.uuid, uuid), isNull(Users.deleted_at)) });
    if (!target) {
        return res.status(404).json({ message: "Staff member not found" });
    }
    if (target.id === req.user!.user_id) {
        return res.status(400).json({ message: "You can't remove your own account" });
    }
    if (target.role === "admin" && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Only an admin can remove an admin account" });
    }

    await db.update(Users).set({ deleted_at: new Date() }).where(eq(Users.uuid, uuid));
    return res.status(204).send();
}
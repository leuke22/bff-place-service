import { z } from "zod";

export const registerSchema = z.object({
    first_name: z.string().min(1, "First name is required").max(100),
    middle_name: z.string().max(100).optional(),
    last_name: z.string().min(1, "Last name is required").max(100),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
    refresh_token: z.string().min(1, "refresh_token is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
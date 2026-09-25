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

export const createCategorySchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().max(255).optional(),
    icon: z.string().max(100).optional(),
    color: z.string().max(20).optional(),
    is_active: z.boolean().optional(),
    image: z.string().max(255).optional(),
});

export const createProductSchema = z.object({
    category_id: z.number().int().positive("category_id is required"),
    name: z.string().min(1, "Name is required").max(150),
    description: z.string().optional(),
    price: z.number().positive("Price must be greater than 0"),
    image: z.string().max(255).optional(),
});

export const createIngredientSchema = z.object({
    name: z.string().min(1, "Name is required").max(150),
    unit: z.enum(["kg", "g", "L", "ml", "pcs"], { message: "unit must be one of kg, g, L, ml, pcs" }),
    image: z.string().max(255).optional(),
    current_stock: z.number().nonnegative().default(0),
    reorder_level: z.number().nonnegative().default(0),
});

export const createSupplierSchema = z.object({
    name: z.string().min(1, "Name is required").max(150),
    contact_person: z.string().max(150).optional(),
    contact_number: z.string().max(30).optional(),
    email: z.email("Invalid email address").max(255).optional(),
    address: z.string().max(255).optional(),
    is_active: z.boolean().optional(),
});

export const addRecipeItemSchema = z.object({
    ingredient_id: z.number().int().positive("ingredient_id is required"),
    quantity_used: z.number().positive("quantity_used must be greater than 0"),
});

export const updateRecipeItemSchema = z.object({
    quantity_used: z.number().positive("quantity_used must be greater than 0"),
});


export const updateCategorySchema = createCategorySchema.partial();
export const updateProductSchema = createProductSchema.partial();
export const updateIngredientSchema = createIngredientSchema.partial();
export const updateSupplierSchema = createSupplierSchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type UpdateIngredientInput = z.infer<typeof updateIngredientSchema>;

export type AddRecipeItemInput = z.infer<typeof addRecipeItemSchema>;
export type UpdateRecipeItemInput = z.infer<typeof updateRecipeItemSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
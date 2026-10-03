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

export const createStockMovementSchema = z.object({
    ingredient_id: z.number().int().positive("ingredient_id is required"),
    type: z.enum(["in", "out", "adjustment"], { message: "type must be one of in, out, adjustment" }),
    quantity: z.number().positive("quantity must be greater than 0"),
    reason: z.string().max(255).optional(),
    reference_type: z.string().max(50).optional(),
    reference_id: z.number().int().positive().optional(),
});

export const addRecipeItemSchema = z.object({
    ingredient_id: z.number().int().positive("ingredient_id is required"),
    quantity_used: z.number().positive("quantity_used must be greater than 0"),
});

export const updateRecipeItemSchema = z.object({
    quantity_used: z.number().positive("quantity_used must be greater than 0"),
});

export const purchaseOrderItemSchema = z.object({
    ingredient_id: z.number().int().positive("ingredient_id is required"),
    quantity: z.number().positive("quantity must be greater than 0"),
    unit_cost: z.number().nonnegative("unit_cost must be 0 or more"),
});

export const createPurchaseOrderSchema = z.object({
    supplier_id: z.number().int().positive("supplier_id is required"),
    items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required"),
});

export const orderItemSchema = z.object({
    product_id: z.number().int().positive("product_id is required"),
    variant_id: z.number().int().positive().optional(),
    quantity: z.number().int().positive("quantity must be at least 1").max(999),
    notes: z.string().max(255).optional(),
});

export const createOrderSchema = z.object({
    order_type: z.enum(["dine_in", "takeout"], { message: "order_type must be dine_in or takeout" }),
    discount: z.number().nonnegative().default(0),
    items: z.array(orderItemSchema).min(1, "At least one item is required"),
});

export const createPaymentSchema = z.object({
    method: z.enum(["cash", "gcash", "card", "bank_transfer"], { message: "Invalid payment method" }),
    amount_tendered: z.number().positive("amount_tendered must be greater than 0"),
});

export const openShiftSchema = z.object({
    opening_cash: z.number().nonnegative("opening_cash must be 0 or more"),
});

export const closeShiftSchema = z.object({
    closing_cash: z.number().nonnegative("closing_cash must be 0 or more"),
});

export const createStaffSchema = z.object({
    first_name: z.string().min(1, "First name is required").max(100),
    middle_name: z.string().max(100).optional(),
    last_name: z.string().min(1, "Last name is required").max(100),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["admin", "manager", "cashier"], { message: "role must be admin, manager or cashier" }),
});

export const updateStaffSchema = z.object({
    first_name: z.string().min(1).max(100).optional(),
    middle_name: z.string().max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    role: z.enum(["admin", "manager", "cashier"]).optional(),
    is_active: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
    first_name: z.string().min(1).max(100).optional(),
    middle_name: z.string().max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    email: z.email("Invalid email address").optional(),
    avatar: z.string().max(255).optional(),
});

export const changePasswordSchema = z.object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(8, "New password must be at least 8 characters"),
});

export const updateCategorySchema = createCategorySchema.partial();
export const updateProductSchema = createProductSchema.partial();
export const updateIngredientSchema = createIngredientSchema.partial();
export const updateSupplierSchema = createSupplierSchema.partial();
export const updateOrderStatusSchema = z.object({
    status: z.enum(["preparing", "ready", "cancelled"], { message: "status must be preparing, ready or cancelled" }),
});

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

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;

export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export type OpenShiftInput = z.infer<typeof openShiftSchema>;
export type CloseShiftInput = z.infer<typeof closeShiftSchema>;

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
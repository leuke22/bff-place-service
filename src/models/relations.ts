import { relations } from "drizzle-orm";
import { Products } from "./product.model";
import { ProductVariants } from "./product_variant.model";
import { ProductIngredients } from "./product_ingredient.model";
import { Categories } from "./category.model";
import { Ingredients } from "./ingredient.model";
import { StockMovements } from "./stock_movement.model";
import { Users } from "./user.model";
import { Suppliers } from "./supplier.model";
import { PurchaseOrders } from "./purchase_order.model";
import { PurchaseOrderItems } from "./purchase_order_item.model";
import { Orders } from "./order.model";
import { OrderItems } from "./order_item.model";
import { Payments } from "./payment.model";
import { Shifts } from "./shift.model";

export const categoriesRelations = relations(Categories, ({ many }) => ({
    products: many(Products),
}));

export const productsRelations = relations(Products, ({ one, many }) => ({
    category: one(Categories, { fields: [Products.category_id], references: [Categories.id] }),
    variants: many(ProductVariants),
    ingredients: many(ProductIngredients),
}));

export const productVariantsRelations = relations(ProductVariants, ({ one }) => ({
    product: one(Products, { fields: [ProductVariants.product_id], references: [Products.id] }),
}));

export const ingredientsRelations = relations(Ingredients, ({ many }) => ({
    productIngredients: many(ProductIngredients),
    stockMovements: many(StockMovements),
    purchaseOrderItems: many(PurchaseOrderItems),
}));

export const productIngredientsRelations = relations(ProductIngredients, ({ one }) => ({
    product: one(Products, { fields: [ProductIngredients.product_id], references: [Products.id] }),
    ingredient: one(Ingredients, { fields: [ProductIngredients.ingredient_id], references: [Ingredients.id] }),
}));

export const stockMovementsRelations = relations(StockMovements, ({ one }) => ({
    ingredient: one(Ingredients, { fields: [StockMovements.ingredient_id], references: [Ingredients.id] }),
    createdBy: one(Users, { fields: [StockMovements.created_by], references: [Users.id] }),
}));

export const suppliersRelations = relations(Suppliers, ({ many }) => ({
    purchaseOrders: many(PurchaseOrders),
}));

export const purchaseOrdersRelations = relations(PurchaseOrders, ({ one, many }) => ({
    supplier: one(Suppliers, { fields: [PurchaseOrders.supplier_id], references: [Suppliers.id] }),
    orderedByUser: one(Users, { fields: [PurchaseOrders.ordered_by], references: [Users.id] }),
    items: many(PurchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(PurchaseOrderItems, ({ one }) => ({
    purchaseOrder: one(PurchaseOrders, { fields: [PurchaseOrderItems.purchase_order_id], references: [PurchaseOrders.id] }),
    ingredient: one(Ingredients, { fields: [PurchaseOrderItems.ingredient_id], references: [Ingredients.id] }),
}));

export const ordersRelations = relations(Orders, ({ one, many }) => ({
    items: many(OrderItems),
    cashier: one(Users, { fields: [Orders.cashier_id], references: [Users.id] }),
    payments: many(Payments),
}));

export const orderItemsRelations = relations(OrderItems, ({ one }) => ({
    order: one(Orders, { fields: [OrderItems.order_id], references: [Orders.id] }),
    product: one(Products, { fields: [OrderItems.product_id], references: [Products.id] }),
    variant: one(ProductVariants, { fields: [OrderItems.variant_id], references: [ProductVariants.id] }),
}));

export const paymentsRelations = relations(Payments, ({ one }) => ({
    order: one(Orders, { fields: [Payments.order_id], references: [Orders.id] }),
}));

export const shiftsRelations = relations(Shifts, ({ one }) => ({
    cashier: one(Users, { fields: [Shifts.cashier_id], references: [Users.id] }),
}));
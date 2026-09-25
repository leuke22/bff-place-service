import { relations } from "drizzle-orm";
import { Products } from "./product.model";
import { ProductVariants } from "./product_variant.model";
import { ProductIngredients } from "./product_ingredient.model";
import { Categories } from "./category.model";
import { Ingredients } from "./ingredient.model";
import { StockMovements } from "./stock_movement.model";
import { Users } from "./user.model";

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
}));

export const productIngredientsRelations = relations(ProductIngredients, ({ one }) => ({
    product: one(Products, { fields: [ProductIngredients.product_id], references: [Products.id] }),
    ingredient: one(Ingredients, { fields: [ProductIngredients.ingredient_id], references: [Ingredients.id] }),
}));

export const stockMovementsRelations = relations(StockMovements, ({ one }) => ({
    ingredient: one(Ingredients, { fields: [StockMovements.ingredient_id], references: [Ingredients.id] }),
    createdBy: one(Users, { fields: [StockMovements.created_by], references: [Users.id] }),
}));
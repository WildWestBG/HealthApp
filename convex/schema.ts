import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  userProfiles: defineTable({
    userId: v.id("users"),
    age: v.optional(v.number()),
    weight: v.optional(v.number()),
    height: v.optional(v.number()),
    activityLevel: v.optional(v.string()),
    fitnessGoals: v.optional(v.array(v.string())),
    dietaryRestrictions: v.optional(v.array(v.string())),
  }).index("by_user", ["userId"]),

  foodEntries: defineTable({
    userId: v.id("users"),
    imageId: v.optional(v.id("_storage")),
    foodName: v.string(),
    description: v.optional(v.string()),
    calories: v.optional(v.number()),
    protein: v.optional(v.number()),
    carbs: v.optional(v.number()),
    fat: v.optional(v.number()),
    fiber: v.optional(v.number()),
    sugar: v.optional(v.number()),
    sodium: v.optional(v.number()),
    mealType: v.string(), // breakfast, lunch, dinner, snack
    aiAnalysis: v.optional(v.string()),
    healthScore: v.optional(v.number()), // 1-10 scale
  }).index("by_user", ["userId"]),

  aiInsights: defineTable({
    userId: v.id("users"),
    type: v.string(), // daily_summary, weekly_report, recommendation
    content: v.string(),
    data: v.optional(v.object({
      totalCalories: v.optional(v.number()),
      macroBreakdown: v.optional(v.object({
        protein: v.number(),
        carbs: v.number(),
        fat: v.number(),
      })),
      healthScore: v.optional(v.number()),
    })),
  }).index("by_user_and_type", ["userId", "type"])
    .index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

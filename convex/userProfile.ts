import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get user profile
export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return profile;
  },
});

// Create or update user profile
export const updateUserProfile = mutation({
  args: {
    age: v.optional(v.number()),
    weight: v.optional(v.number()),
    height: v.optional(v.number()),
    activityLevel: v.optional(v.string()),
    fitnessGoals: v.optional(v.array(v.string())),
    dietaryRestrictions: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        ...args,
      });
    } else {
      await ctx.db.insert("userProfiles", {
        userId,
        ...args,
      });
    }
  },
});

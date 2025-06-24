import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.CONVEX_OPENAI_BASE_URL,
  apiKey: process.env.CONVEX_OPENAI_API_KEY,
});

// Generate upload URL for food images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

// Analyze food image with AI
export const analyzeFoodImage = action({
  args: {
    imageId: v.id("_storage"),
    mealType: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get image URL
    const imageUrl = await ctx.storage.getUrl(args.imageId);
    if (!imageUrl) {
      throw new Error("Image not found");
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this food image and provide detailed nutritional information. Return a JSON object with the following structure:
                {
                  "foodName": "name of the food",
                  "description": "brief description",
                  "calories": estimated_calories_per_serving,
                  "protein": grams_of_protein,
                  "carbs": grams_of_carbohydrates,
                  "fat": grams_of_fat,
                  "fiber": grams_of_fiber,
                  "sugar": grams_of_sugar,
                  "sodium": milligrams_of_sodium,
                  "healthScore": health_score_1_to_10,
                  "analysis": "detailed_health_analysis_and_recommendations"
                }
                
                Be as accurate as possible with nutritional estimates. The health score should consider nutritional density, processing level, and overall health impact.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("No analysis received from AI");
      }

      // Parse the JSON response
      const analysisData = JSON.parse(content);

      // Save the food entry
      await ctx.runMutation(internal.foodTracking.saveFoodEntry, {
        userId,
        imageId: args.imageId,
        mealType: args.mealType,
        analysisData,
      });

      return analysisData;
    } catch (error) {
      console.error("Error analyzing food image:", error);
      throw new Error("Failed to analyze food image");
    }
  },
});

// Internal mutation to save food entry
export const saveFoodEntry = internalMutation({
  args: {
    userId: v.id("users"),
    imageId: v.id("_storage"),
    mealType: v.string(),
    analysisData: v.object({
      foodName: v.string(),
      description: v.optional(v.string()),
      calories: v.optional(v.number()),
      protein: v.optional(v.number()),
      carbs: v.optional(v.number()),
      fat: v.optional(v.number()),
      fiber: v.optional(v.number()),
      sugar: v.optional(v.number()),
      sodium: v.optional(v.number()),
      healthScore: v.optional(v.number()),
      analysis: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("foodEntries", {
      userId: args.userId,
      imageId: args.imageId,
      foodName: args.analysisData.foodName,
      description: args.analysisData.description,
      calories: args.analysisData.calories,
      protein: args.analysisData.protein,
      carbs: args.analysisData.carbs,
      fat: args.analysisData.fat,
      fiber: args.analysisData.fiber,
      sugar: args.analysisData.sugar,
      sodium: args.analysisData.sodium,
      mealType: args.mealType,
      aiAnalysis: args.analysisData.analysis,
      healthScore: args.analysisData.healthScore,
    });
  },
});

// Get user's food entries for today
export const getTodaysFoodEntries = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const entries = await ctx.db
      .query("foodEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("_creationTime"), todayTimestamp))
      .collect();

    // Get image URLs for entries with images
    const entriesWithImages = await Promise.all(
      entries.map(async (entry) => ({
        ...entry,
        imageUrl: entry.imageId ? await ctx.storage.getUrl(entry.imageId) : null,
      }))
    );

    return entriesWithImages;
  },
});

// Get nutrition summary for today
export const getTodaysNutritionSummary = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    const entries = await ctx.db
      .query("foodEntries")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("_creationTime"), todayTimestamp))
      .collect();

    const summary = entries.reduce(
      (acc, entry) => ({
        totalCalories: acc.totalCalories + (entry.calories || 0),
        totalProtein: acc.totalProtein + (entry.protein || 0),
        totalCarbs: acc.totalCarbs + (entry.carbs || 0),
        totalFat: acc.totalFat + (entry.fat || 0),
        totalFiber: acc.totalFiber + (entry.fiber || 0),
        averageHealthScore: entries.length > 0 
          ? entries.reduce((sum, e) => sum + (e.healthScore || 0), 0) / entries.length 
          : 0,
        mealCount: acc.mealCount + 1,
      }),
      {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0,
        averageHealthScore: 0,
        mealCount: 0,
      }
    );

    return summary;
  },
});

// Generate daily AI insights
export const generateDailyInsights = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const summary = await ctx.runQuery(api.foodTracking.getTodaysNutritionSummary);
    const entries = await ctx.runQuery(api.foodTracking.getTodaysFoodEntries);

    if (!summary || entries.length === 0) {
      return "No food entries found for today. Start tracking your meals to get personalized insights!";
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `As a nutrition expert, analyze this daily food intake and provide personalized insights and recommendations:

            Daily Summary:
            - Total Calories: ${summary.totalCalories}
            - Protein: ${summary.totalProtein}g
            - Carbs: ${summary.totalCarbs}g
            - Fat: ${summary.totalFat}g
            - Fiber: ${summary.totalFiber}g
            - Average Health Score: ${summary.averageHealthScore.toFixed(1)}/10
            - Meals Tracked: ${summary.mealCount}

            Foods Consumed:
            ${entries.map((entry: any) => `- ${entry.foodName} (${entry.mealType}): ${entry.calories || 'unknown'} calories, Health Score: ${entry.healthScore || 'N/A'}/10`).join('\n')}

            Please provide:
            1. Overall assessment of today's nutrition
            2. Specific recommendations for improvement
            3. Suggestions for tomorrow's meals
            4. Any nutritional gaps or concerns
            
            Keep the response encouraging and actionable, around 200-300 words.`
          }
        ],
        max_tokens: 500,
      });

      const insights = response.choices[0].message.content;
      if (!insights) {
        throw new Error("No insights generated");
      }

      // Save insights to database
      await ctx.runMutation(internal.foodTracking.saveAIInsights, {
        userId,
        type: "daily_summary",
        content: insights,
        data: {
          totalCalories: summary.totalCalories,
          macroBreakdown: {
            protein: summary.totalProtein,
            carbs: summary.totalCarbs,
            fat: summary.totalFat,
          },
          healthScore: summary.averageHealthScore,
        },
      });

      return insights;
    } catch (error) {
      console.error("Error generating insights:", error);
      throw new Error("Failed to generate daily insights");
    }
  },
});

// Internal mutation to save AI insights
export const saveAIInsights = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiInsights", {
      userId: args.userId,
      type: args.type,
      content: args.content,
      data: args.data,
    });
  },
});

// Get latest AI insights
export const getLatestInsights = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const insights = await ctx.db
      .query("aiInsights")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();

    return insights;
  },
});

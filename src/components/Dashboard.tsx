import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function Dashboard() {
  const todaysEntries = useQuery(api.foodTracking.getTodaysFoodEntries);
  const nutritionSummary = useQuery(api.foodTracking.getTodaysNutritionSummary);
  const latestInsights = useQuery(api.foodTracking.getLatestInsights);
  const generateInsights = useAction(api.foodTracking.generateDailyInsights);
  
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  const handleGenerateInsights = async () => {
    if (!todaysEntries || todaysEntries.length === 0) {
      toast.error("Track some food first to get AI insights!");
      return;
    }

    setIsGeneratingInsights(true);
    try {
      await generateInsights();
      toast.success("AI insights generated!");
    } catch (error) {
      toast.error("Failed to generate insights");
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  if (todaysEntries === undefined || nutritionSummary === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Today's Overview</h1>
        <p className="text-gray-600">Track your nutrition and get AI-powered insights</p>
      </div>

      {/* Nutrition Summary Cards */}
      {nutritionSummary && nutritionSummary.mealCount > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{Math.round(nutritionSummary.totalCalories)}</div>
            <div className="text-sm text-gray-600">Calories</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{Math.round(nutritionSummary.totalProtein)}g</div>
            <div className="text-sm text-gray-600">Protein</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">{Math.round(nutritionSummary.totalCarbs)}g</div>
            <div className="text-sm text-gray-600">Carbs</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">{Math.round(nutritionSummary.totalFat)}g</div>
            <div className="text-sm text-gray-600">Fat</div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
          <div className="text-4xl mb-4">🍽️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No meals tracked today</h3>
          <p className="text-gray-600 mb-4">Start tracking your food to see your nutrition summary</p>
        </div>
      )}

      {/* Health Score */}
      {nutritionSummary && nutritionSummary.mealCount > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Health Score</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(nutritionSummary.averageHealthScore / 10) * 100}%` }}
              ></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {nutritionSummary.averageHealthScore.toFixed(1)}/10
            </div>
          </div>
        </div>
      )}

      {/* Today's Meals */}
      {todaysEntries && todaysEntries.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Meals</h3>
          <div className="space-y-4">
            {todaysEntries.map((entry) => (
              <div key={entry._id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                {entry.imageUrl && (
                  <img 
                    src={entry.imageUrl} 
                    alt={entry.foodName}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{entry.foodName}</div>
                  <div className="text-sm text-gray-600 capitalize">{entry.mealType}</div>
                  <div className="text-sm text-gray-500">
                    {entry.calories && `${entry.calories} cal`}
                    {entry.healthScore && ` • Health Score: ${entry.healthScore}/10`}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(entry._creationTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🤖 AI Insights</h3>
          <button
            onClick={handleGenerateInsights}
            disabled={isGeneratingInsights || !todaysEntries || todaysEntries.length === 0}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingInsights ? "Generating..." : "Get AI Insights"}
          </button>
        </div>
        
        {latestInsights ? (
          <div className="prose prose-sm max-w-none">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <div className="whitespace-pre-wrap text-gray-700">{latestInsights.content}</div>
              <div className="text-xs text-gray-500 mt-3">
                Generated {new Date(latestInsights._creationTime).toLocaleString()}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🧠</div>
            <p>Track your meals and click "Get AI Insights" for personalized recommendations!</p>
          </div>
        )}
      </div>
    </div>
  );
}

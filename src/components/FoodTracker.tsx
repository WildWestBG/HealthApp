import { useState, useRef } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function FoodTracker() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mealType, setMealType] = useState<string>("breakfast");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.foodTracking.generateUploadUrl);
  const analyzeFoodImage = useAction(api.foodTracking.analyzeFoodImage);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setAnalysisResult(null);
    }
  };

  const handleAnalyzeFood = async () => {
    if (!selectedImage) {
      toast.error("Please select an image first");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Step 2: Upload image
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedImage.type },
        body: selectedImage,
      });
      
      if (!result.ok) {
        throw new Error("Failed to upload image");
      }
      
      const { storageId } = await result.json();
      
      // Step 3: Analyze with AI
      const analysis = await analyzeFoodImage({
        imageId: storageId,
        mealType,
      });
      
      setAnalysisResult(analysis);
      toast.success("Food analyzed successfully!");
      
      // Clear the form
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
    } catch (error) {
      console.error("Error analyzing food:", error);
      toast.error("Failed to analyze food. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📸 Track Your Food</h1>
        <p className="text-gray-600">Take a photo of your meal and get instant AI analysis</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        {/* Image Upload */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Food Photo
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Food preview" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="text-4xl mb-4">📸</div>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageSelect}
                />
              </label>
            </div>
          </div>

          {/* Meal Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meal Type
            </label>
            <select
              value={mealType}
              onChange={(e) => setMealType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="breakfast">🌅 Breakfast</option>
              <option value="lunch">☀️ Lunch</option>
              <option value="dinner">🌙 Dinner</option>
              <option value="snack">🍿 Snack</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleAnalyzeFood}
              disabled={!selectedImage || isAnalyzing}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAnalyzing ? "Analyzing..." : "🤖 Analyze Food"}
            </button>
            {(selectedImage || analysisResult) && (
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Analysis Results</h3>
          
          <div className="space-y-4">
            {/* Food Name and Description */}
            <div>
              <h4 className="font-medium text-gray-900 text-lg">{analysisResult.foodName}</h4>
              {analysisResult.description && (
                <p className="text-gray-600 mt-1">{analysisResult.description}</p>
              )}
            </div>

            {/* Health Score */}
            {analysisResult.healthScore && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Health Score</span>
                  <span className="text-lg font-bold text-gray-900">
                    {analysisResult.healthScore}/10
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(analysisResult.healthScore / 10) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Nutrition Facts */}
            <div className="grid grid-cols-2 gap-4">
              {analysisResult.calories && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Calories</div>
                  <div className="text-lg font-bold text-blue-800">{analysisResult.calories}</div>
                </div>
              )}
              {analysisResult.protein && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Protein</div>
                  <div className="text-lg font-bold text-green-800">{analysisResult.protein}g</div>
                </div>
              )}
              {analysisResult.carbs && (
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">Carbs</div>
                  <div className="text-lg font-bold text-orange-800">{analysisResult.carbs}g</div>
                </div>
              )}
              {analysisResult.fat && (
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Fat</div>
                  <div className="text-lg font-bold text-purple-800">{analysisResult.fat}g</div>
                </div>
              )}
            </div>

            {/* Additional Nutrients */}
            {(analysisResult.fiber || analysisResult.sugar || analysisResult.sodium) && (
              <div className="grid grid-cols-3 gap-3">
                {analysisResult.fiber && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Fiber</div>
                    <div className="font-semibold">{analysisResult.fiber}g</div>
                  </div>
                )}
                {analysisResult.sugar && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Sugar</div>
                    <div className="font-semibold">{analysisResult.sugar}g</div>
                  </div>
                )}
                {analysisResult.sodium && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Sodium</div>
                    <div className="font-semibold">{analysisResult.sodium}mg</div>
                  </div>
                )}
              </div>
            )}

            {/* AI Analysis */}
            {analysisResult.analysis && (
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <h5 className="font-medium text-blue-900 mb-2">💡 AI Insights</h5>
                <p className="text-blue-800 text-sm whitespace-pre-wrap">{analysisResult.analysis}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
        <h3 className="font-semibold text-gray-900 mb-3">📝 Tips for Better Results</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Take clear, well-lit photos of your food</li>
          <li>• Include the entire meal in the frame</li>
          <li>• Avoid blurry or dark images</li>
          <li>• For mixed dishes, try to capture all ingredients</li>
        </ul>
      </div>
    </div>
  );
}

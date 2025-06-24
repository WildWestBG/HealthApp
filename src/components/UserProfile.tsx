import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function UserProfile() {
  const userProfile = useQuery(api.userProfile.getUserProfile);
  const updateProfile = useMutation(api.userProfile.updateUserProfile);
  const loggedInUser = useQuery(api.auth.loggedInUser);

  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    activityLevel: "",
    fitnessGoals: [] as string[],
    dietaryRestrictions: [] as string[],
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        age: userProfile.age?.toString() || "",
        weight: userProfile.weight?.toString() || "",
        height: userProfile.height?.toString() || "",
        activityLevel: userProfile.activityLevel || "",
        fitnessGoals: userProfile.fitnessGoals || [],
        dietaryRestrictions: userProfile.dietaryRestrictions || [],
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        age: formData.age ? parseInt(formData.age) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        activityLevel: formData.activityLevel || undefined,
        fitnessGoals: formData.fitnessGoals.length > 0 ? formData.fitnessGoals : undefined,
        dietaryRestrictions: formData.dietaryRestrictions.length > 0 ? formData.dietaryRestrictions : undefined,
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      fitnessGoals: prev.fitnessGoals.includes(goal)
        ? prev.fitnessGoals.filter(g => g !== goal)
        : [...prev.fitnessGoals, goal]
    }));
  };

  const handleRestrictionToggle = (restriction: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(restriction)
        ? prev.dietaryRestrictions.filter(r => r !== restriction)
        : [...prev.dietaryRestrictions, restriction]
    }));
  };

  const fitnessGoalOptions = [
    "Weight Loss",
    "Weight Gain",
    "Muscle Building",
    "Maintenance",
    "Athletic Performance",
    "General Health"
  ];

  const dietaryRestrictionOptions = [
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Keto",
    "Paleo",
    "Low-Carb",
    "Low-Fat"
  ];

  const activityLevels = [
    { value: "sedentary", label: "Sedentary (little/no exercise)" },
    { value: "light", label: "Light (light exercise 1-3 days/week)" },
    { value: "moderate", label: "Moderate (moderate exercise 3-5 days/week)" },
    { value: "active", label: "Active (hard exercise 6-7 days/week)" },
    { value: "very_active", label: "Very Active (very hard exercise, physical job)" }
  ];

  if (userProfile === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">👤 Your Profile</h1>
        <p className="text-gray-600">Help us personalize your fitness journey</p>
      </div>

      {/* User Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-2">
          <p><span className="font-medium">Email:</span> {loggedInUser?.email || "Not provided"}</p>
          <p><span className="font-medium">Name:</span> {loggedInUser?.name || "Not provided"}</p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="25"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (lbs)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="150"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (inches)
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.height}
              onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="68"
            />
          </div>
        </div>

        {/* Activity Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity Level
          </label>
          <select
            value={formData.activityLevel}
            onChange={(e) => setFormData(prev => ({ ...prev, activityLevel: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select activity level</option>
            {activityLevels.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fitness Goals */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Fitness Goals (select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {fitnessGoalOptions.map(goal => (
              <button
                key={goal}
                type="button"
                onClick={() => handleGoalToggle(goal)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  formData.fitnessGoals.includes(goal)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Restrictions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Dietary Restrictions (select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {dietaryRestrictionOptions.map(restriction => (
              <button
                key={restriction}
                type="button"
                onClick={() => handleRestrictionToggle(restriction)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  formData.dietaryRestrictions.includes(restriction)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {restriction}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {/* Tips */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border">
        <h3 className="font-semibold text-gray-900 mb-3">💡 Why We Need This Information</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• <strong>Age, Weight, Height:</strong> Calculate accurate calorie and macro recommendations</li>
          <li>• <strong>Activity Level:</strong> Adjust your daily calorie needs based on exercise</li>
          <li>• <strong>Fitness Goals:</strong> Provide targeted advice for your specific objectives</li>
          <li>• <strong>Dietary Restrictions:</strong> Ensure food recommendations fit your lifestyle</li>
        </ul>
      </div>
    </div>
  );
}

import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { FoodTracker } from "./components/FoodTracker";
import { Dashboard } from "./components/Dashboard";
import { UserProfile } from "./components/UserProfile";
import { useState } from "react";

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'track' | 'profile'>('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-primary">🏃‍♂️ FitHelper AI</h2>
        <SignOutButton />
      </header>
      <main className="flex-1">
        <Content activeTab={activeTab} setActiveTab={setActiveTab} />
      </main>
      <Toaster />
    </div>
  );
}

function Content({ activeTab, setActiveTab }: { 
  activeTab: 'dashboard' | 'track' | 'profile';
  setActiveTab: (tab: 'dashboard' | 'track' | 'profile') => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[500px] p-8">
          <div className="w-full max-w-md mx-auto text-center">
            <h1 className="text-4xl font-bold text-primary mb-4">🏃‍♂️ FitHelper AI</h1>
            <p className="text-xl text-secondary mb-8">
              Your AI-powered fitness companion. Track your food, get insights, and live healthier!
            </p>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <div className="flex flex-col">
          {/* Navigation */}
          <nav className="bg-white border-b px-4 py-3">
            <div className="flex space-x-1 max-w-4xl mx-auto">
              {[
                { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
                { id: 'track', label: '📸 Track Food', icon: '📸' },
                { id: 'profile', label: '👤 Profile', icon: '👤' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="max-w-4xl mx-auto">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'track' && <FoodTracker />}
              {activeTab === 'profile' && <UserProfile />}
            </div>
          </div>
        </div>
      </Authenticated>
    </div>
  );
}

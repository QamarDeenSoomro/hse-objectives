import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { ObjectivesPage } from "@/components/ObjectivesPage";
import { UpdatesPage } from "@/components/UpdatesPage";
import { DailyWorkPage } from "@/components/DailyWorkPage";
import { ReportsPage } from "@/components/ReportsPage";
import { UsersPage } from "@/components/UsersPage";
import { ProfilePage } from "@/components/ProfilePage";
import { LoginPage } from "@/components/LoginPage";
import { useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleNavigateToObjectives = () => {
    setCurrentPage("objectives");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigateToObjectives={handleNavigateToObjectives} />;
      case "objectives":
        return <ObjectivesPage />;
      case "updates":
        return <UpdatesPage />;
      case "daily-work":
        return <DailyWorkPage />;
      case "reports":
        return <ReportsPage />;
      case "users":
        return <UsersPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return <Dashboard onNavigateToObjectives={handleNavigateToObjectives} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-1 overflow-auto md:ml-0 pt-16 md:pt-0">
        {renderPage()}
      </main>
      <Toaster />
    </div>
  );
};

export default Index;
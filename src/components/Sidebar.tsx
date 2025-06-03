
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Target, 
  CheckSquare, 
  Users, 
  User, 
  LogOut,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Sidebar = ({ currentPage, setCurrentPage }: SidebarProps) => {
  const { user, logout, isAdmin } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "objectives", label: "Objectives", icon: Target },
    { id: "updates", label: "Updates", icon: CheckSquare },
    ...(isAdmin() ? [{ id: "users", label: "Users", icon: Users }] : []),
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              HSE Objectives
            </h1>
            <p className="text-sm text-gray-600">{user?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200",
                isActive 
                  ? "bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-md" 
                  : "hover:bg-gray-100"
              )}
              onClick={() => setCurrentPage(item.id)}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">
            {isAdmin() ? "Admin User" : "Standard User"}
          </span>
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            isAdmin() ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
          )}>
            {user?.role}
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={logout}
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

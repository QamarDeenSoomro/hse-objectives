import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  LayoutDashboard, 
  Target, 
  CheckSquare, 
  Users, 
  User, 
  LogOut,
  Shield,
  Menu,
  Calendar,
  FileText,
  Settings,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Sidebar = ({ currentPage, setCurrentPage }: SidebarProps) => {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "objectives", label: "Objectives", icon: Target },
    { id: "updates", label: "Updates", icon: CheckSquare },
    { id: "action-items", label: "Action Items", icon: ClipboardList },
    { id: "daily-work", label: "Daily Work", icon: Calendar },
    ...(isAdmin() ? [{ id: "reports", label: "Reports", icon: FileText }] : []),
    ...(isAdmin() ? [{ id: "reports-dashboard", label: "Reports Dashboard", icon: LayoutDashboard }] : []),
    ...(isAdmin() ? [{ id: "users", label: "Users", icon: Users }] : []),
    ...(isSuperAdmin() ? [{ id: "superadmin", label: "Super Admin", icon: Settings }] : []),
    { id: "profile", label: "Profile", icon: User },
  ];

  const handleMenuClick = (pageId: string) => {
    if (pageId === "reports-dashboard") {
      setIsOpen(false);
      navigate("/reports-dashboard");
    } else if (pageId === "objectives") {
      setIsOpen(false);
      navigate("/objectives");
    } else {
      setCurrentPage(pageId);
      setIsOpen(false);
      // Navigate to home for other pages
      if (location.pathname !== "/") {
        navigate("/");
      }
    }
  };

  const SidebarContent = () => (
    <div className="h-full bg-white border-r border-gray-200 shadow-lg flex flex-col">
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
          const isActive = currentPage === item.id || (
            item.id === "reports-dashboard" && location.pathname === "/reports-dashboard"
          ) || (
            item.id === "objectives" && location.pathname === "/objectives"
          );

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200",
                isActive 
                  ? "bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-md" 
                  : "hover:bg-gray-100",
                item.id === "superadmin" && "border-2 border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
              )}
              onClick={() => handleMenuClick(item.id)}
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.label}
              {item.id === "superadmin" && (
                <Shield className="ml-auto h-3 w-3" />
              )}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">
            {isSuperAdmin() ? "Super Admin" : isAdmin() ? "Admin User" : "Standard User"}
          </span>
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            isSuperAdmin() ? "bg-red-100 text-red-800" : 
            isAdmin() ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"
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

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 bg-white shadow-md"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};
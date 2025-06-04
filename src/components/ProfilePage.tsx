
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { User, Lock, Shield } from "lucide-react";

export const ProfilePage = () => {
  const { user, updatePassword } = useAuth();
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    const result = await updatePassword(passwordData.newPassword);

    if (result.success) {
      toast({
        title: "Success",
        description: "Password updated successfully.",
      });
      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      toast({
        title: "Error updating password",
        description: result.error?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Profile Information
            </CardTitle>
            <CardDescription>Your account details and role information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">{user?.email}</h3>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={user?.role === "admin" ? "destructive" : "default"}
                    className={user?.role === "admin" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {user?.role?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">User ID</Label>
                <p className="text-gray-600 font-mono text-sm bg-gray-50 p-2 rounded border">
                  {user?.id}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Account Type</Label>
                <p className="text-gray-600">
                  {user?.role === "admin" 
                    ? "Administrator - Full system access" 
                    : "Standard User - Limited access"
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Member Since</Label>
                <p className="text-gray-600">January 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-green-600" />
              Change Password
            </CardTitle>
            <CardDescription>Update your account password for security</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Statistics */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Account Activity</CardTitle>
          <CardDescription>Your activity summary and statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">12</div>
              <p className="text-sm text-gray-600">Updates Submitted</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <p className="text-sm text-gray-600">Average Completion</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <p className="text-sm text-gray-600">Active Objectives</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

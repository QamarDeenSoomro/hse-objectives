import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Shield, User, Key, UserCheck, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "user" | "superadmin";
  created_at: string;
  banned_until?: string | null;
}

export const UsersPage = () => {
  const { isAdmin, isSuperAdmin, session } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "user" as "admin" | "user" | "superadmin",
    password: "",
  });

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error }  = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log("Fetched users:", data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in email and password",
        variant: "destructive",
      });
      return;
    }

    if (!session?.access_token) {
      toast({
        title: "Error",
        description: "No valid session found",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Attempting to create user via Edge Function');
      console.log('Request data:', {
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
        hasPassword: !!formData.password
      });

      // Call the Edge Function instead of admin.createUser
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role
        }
      });

      console.log('Edge Function response:', { data, error });

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to call Edge Function');
      }

      if (data?.error) {
        console.error('Edge Function returned error:', data.error);
        throw new Error(data.error);
      }

      toast({
        title: "Success",
        description: `User ${formData.email} has been created`,
      });

      setIsDialogOpen(false);
      setFormData({ email: "", fullName: "", role: "user", password: "" });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      // Provide more detailed error information
      let errorMessage = "Failed to create user";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Check for specific error types
      if (errorMessage.includes('Failed to send a request')) {
        errorMessage = "Unable to connect to user creation service. Please check your internet connection and try again.";
      } else if (errorMessage.includes('fetch')) {
        errorMessage = "Network error occurred. Please try again.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !newPassword) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch('/functions/v1/admin-update-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPassword: newPassword
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update password');
      }

      toast({
        title: "Success",
        description: `Password updated for ${selectedUser.email}`,
      });

      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    try {
      let newRole: "admin" | "user" | "superadmin";
      
      // Only superadmins can promote to superadmin or demote from superadmin
      if (isSuperAdmin()) {
        // Cycle through all roles for superadmins
        if (currentRole === "user") {
          newRole = "admin";
        } else if (currentRole === "admin") {
          newRole = "superadmin";
        } else {
          newRole = "user";
        }
      } else {
        // Regular admins can only toggle between user and admin
        newRole = currentRole === "admin" ? "user" : "admin";
      }

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const isUserDisabled = (user: UserData) => {
    if (!user.banned_until) return false;
    return new Date(user.banned_until) > new Date();
  };

  const toggleUserStatus = async (userId: string, isCurrentlyDisabled: boolean) => {
    try {
      setLoading(true);
      
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }
      
      // Call the Edge Function to toggle user status
      const { data, error } = await supabase.functions.invoke('toggle-user-status', {
        body: {
          userId,
          disable: !isCurrentlyDisabled
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to toggle user status');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Update local state to reflect the change immediately
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, banned_until: data.banned_until }
            : user
        )
      );

      toast({
        title: "Success",
        description: `User ${isCurrentlyDisabled ? 'enabled' : 'disabled'} successfully`,
      });
      
      // Refresh the user list to get updated data
      fetchUsers();
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    setFormData({ email: "", fullName: "", role: "user", password: "" });
    setIsDialogOpen(true);
  };

  const handleChangePassword = (user: UserData) => {
    setSelectedUser(user);
    setNewPassword("");
    setIsPasswordDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "superadmin":
        return "destructive";
      case "admin":
        return "secondary";
      default:
        return "default";
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-red-100 text-red-800";
      case "admin":
        return "bg-orange-100 text-orange-800";
      default:
        return "";
    }
  };

  const getToggleButtonText = (currentRole: string) => {
    if (isSuperAdmin()) {
      // Superadmins can cycle through all roles
      if (currentRole === "user") return "Promote to Admin";
      if (currentRole === "admin") return "Promote to SuperAdmin";
      return "Demote to User";
    } else {
      // Regular admins can only toggle between user and admin
      return currentRole === "admin" ? "Demote to User" : "Promote to Admin";
    }
  };

  const UserCard = ({ user }: { user: UserData }) => {
    const userIsDisabled = isUserDisabled(user);
    
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {user.full_name || user.email}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={getRoleBadgeVariant(user.role)}
                  className={getRoleBadgeClass(user.role)}
                >
                  {user.role === "superadmin" && <Shield className="h-3 w-3 mr-1" />}
                  {user.role.toUpperCase()}
                </Badge>
                {userIsDisabled && (
                  <Badge variant="destructive">
                    <UserX className="h-3 w-3 mr-1" />
                    DISABLED
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Created: {new Date(user.created_at).toLocaleDateString()}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleUserRole(user.id, user.role)}
                className="flex-1 sm:flex-none"
                disabled={user.role === "superadmin" && !isSuperAdmin()}
              >
                <Edit className="h-4 w-4 mr-1" />
                {getToggleButtonText(user.role)}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChangePassword(user)}
                className="flex-1 sm:flex-none"
              >
                <Key className="h-4 w-4 mr-1" />
                Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleUserStatus(user.id, userIsDisabled)}
                className={`flex-1 sm:flex-none ${
                  userIsDisabled 
                    ? 'text-green-600 hover:text-green-700' 
                    : 'text-orange-600 hover:text-orange-700'
                }`}
                disabled={user.role === "superadmin" && !isSuperAdmin()}
              >
                {userIsDisabled ? (
                  <>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Enable
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4 mr-1" />
                    Disable
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                onClick={() => deleteUser(user.id)}
                disabled={user.role === "superadmin" && !isSuperAdmin()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isAdmin()) {
    return (
      <div className="p-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have permission to view this page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Manage user accounts and permissions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleAddNew}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Add New User
              </DialogTitle>
              <DialogDescription>
                Create a new user account
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: "admin" | "user" | "superadmin") => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {isSuperAdmin() && (
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Update password for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Password</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-gray-600">Registered accounts</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.role === "user").length}
            </div>
            <p className="text-xs text-gray-600">Standard accounts</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.role === "admin").length}
            </div>
            <p className="text-xs text-gray-600">Admin accounts</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(user => user.role === "superadmin").length}
            </div>
            <p className="text-xs text-gray-600">Super admin accounts</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            All Users
          </CardTitle>
          <CardDescription>
            Manage user accounts and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const userIsDisabled = isUserDisabled(user);
                  
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || user.email}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getRoleBadgeVariant(user.role)}
                          className={getRoleBadgeClass(user.role)}
                        >
                          {user.role === "superadmin" && <Shield className="h-3 w-3 mr-1" />}
                          {user.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userIsDisabled ? (
                          <Badge variant="destructive">
                            <UserX className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        ) : (
                          <Badge variant="default">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserRole(user.id, user.role)}
                            disabled={user.role === "superadmin" && !isSuperAdmin()}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {getToggleButtonText(user.role)}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangePassword(user)}
                          >
                            <Key className="h-4 w-4 mr-1" />
                            Password
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id, userIsDisabled)}
                            className={
                              userIsDisabled 
                                ? 'text-green-600 hover:text-green-700' 
                                : 'text-orange-600 hover:text-orange-700'
                            }
                            disabled={user.role === "superadmin" && !isSuperAdmin()}
                          >
                            {userIsDisabled ? (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Enable
                              </>
                            ) : (
                              <>
                                <UserX className="h-4 w-4 mr-1" />
                                Disable
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => deleteUser(user.id)}
                            disabled={user.role === "superadmin" && !isSuperAdmin()}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
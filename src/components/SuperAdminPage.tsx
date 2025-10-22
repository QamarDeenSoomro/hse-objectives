import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { 
  Shield, 
  Settings, 
  Users, 
  Lock, 
  Calendar,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Download,
  Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
  updated_at: string;
}

interface ComponentPermission {
  id: string;
  component_name: string;
  permission_type: string;
  role_required: string;
  is_enabled: boolean;
  valid_until: string | null;
}

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "user" | "superadmin";
  created_at: string;
  banned_until?: string;
}

export const SuperAdminPage = () => {
  const { isSuperAdmin, session, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [componentPermissions, setComponentPermissions] = useState<ComponentPermission[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [newSetting, setNewSetting] = useState({ key: "", value: "", description: "" });
  const [togglingUsers, setTogglingUsers] = useState<Set<string>>(new Set());
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showPlatformDialog, setShowPlatformDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'supabase' | 'firebase'>('supabase');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    // Only load data when auth is complete and user is confirmed superadmin
    if (!authLoading && isSuperAdmin()) {
      loadData();
    } else if (!authLoading && !isSuperAdmin()) {
      // If auth is complete but user is not superadmin, stop loading
      setLoading(false);
    }
  }, [authLoading, isSuperAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSystemSettings(),
        loadUsers()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      
      // Extract specific error message from Edge Function response
      let errorMessage = "Failed to load super admin data";
      
      if (error && typeof error === 'object') {
        // Check for Edge Function specific error details
        if ('details' in error && error.details) {
          errorMessage = `Edge Function Error: ${error.details}`;
        } else if ('message' in error && error.message) {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('superadmin-system-settings', {
        method: 'GET'
      });

      if (error) {
        // Enhance error with more specific details
        const enhancedError = new Error(`System Settings Error: ${error.message || 'Unknown error'}`);
        if (error.details) {
          (enhancedError as any).details = error.details;
        }
        throw enhancedError;
      }

      setSystemSettings(data.settings || []);
      setComponentPermissions(data.permissions || []);
    } catch (error) {
      console.error('Error loading system settings:', error);
      throw error;
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  };

  const updateSystemSetting = async (key: string, value: any, description?: string) => {
    try {
      const { error } = await supabase.functions.invoke('superadmin-system-settings', {
        method: 'POST',
        body: {
          type: 'system_setting',
          data: {
            setting_key: key,
            setting_value: value,
            description
          }
        }
      });

      if (error) {
        const errorMessage = error.details || error.message || 'Unknown error occurred';
        throw new Error(`Failed to update system setting: ${errorMessage}`);
      }

      toast({
        title: "Success",
        description: "System setting updated successfully",
      });

      await loadSystemSettings();
    } catch (error) {
      console.error('Error updating system setting:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update system setting",
        variant: "destructive",
      });
    }
  };

  const updateComponentPermission = async (permission: ComponentPermission) => {
    try {
      const { error } = await supabase.functions.invoke('superadmin-system-settings', {
        method: 'POST',
        body: {
          type: 'component_permission',
          data: permission
        }
      });

      if (error) {
        const errorMessage = error.details || error.message || 'Unknown error occurred';
        throw new Error(`Failed to update component permission: ${errorMessage}`);
      }

      toast({
        title: "Success",
        description: "Component permission updated successfully",
      });

      await loadSystemSettings();
    } catch (error) {
      console.error('Error updating component permission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update component permission",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentlyBanned: boolean) => {
    setTogglingUsers(prev => new Set(prev).add(userId));
    
    try {
      const action = currentlyBanned ? 'enable' : 'disable';
      
      const { data, error } = await supabase.functions.invoke('toggle-user-status', {
        body: {
          userId,
          action
        }
      });

      if (error) {
        const errorMessage = error.details || error.message || 'Unknown error occurred';
        throw new Error(`Failed to ${action} user: ${errorMessage}`);
      }

      toast({
        title: "Success",
        description: `User ${action}d successfully`,
      });

      await loadUsers();
    } catch (error) {
      console.error(`Error toggling user status:`, error);
      
      // Enhanced error handling for network issues
      let errorMessage = `Failed to toggle user status`;
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = "Network connection error. Please check your internet connection and ensure the server is accessible. The Edge Function may not be deployed or there could be a connectivity issue.";
      } else if (error instanceof Error) {
        if (error.message.includes('Failed to send a request')) {
          errorMessage = "Unable to connect to the user management service. Please check your network connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTogglingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const manageUser = async (action: string, userId: string, userData?: any) => {
    try {
      const { error } = await supabase.functions.invoke('superadmin-manage-users', {
        method: 'POST',
        body: {
          action,
          userId,
          userData
        }
      });

      if (error) {
        const errorMessage = error.details || error.message || 'Unknown error occurred';
        throw new Error(`Failed to ${action} user: ${errorMessage}`);
      }

      toast({
        title: "Success",
        description: `User ${action} completed successfully`,
      });

      await loadUsers();
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${action} user`,
        variant: "destructive",
      });
    }
  };

  const addNewSetting = async () => {
    if (!newSetting.key || !newSetting.value) {
      toast({
        title: "Error",
        description: "Please fill in key and value",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsedValue = JSON.parse(newSetting.value);
      await updateSystemSetting(newSetting.key, parsedValue, newSetting.description);
      setNewSetting({ key: "", value: "", description: "" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON value",
        variant: "destructive",
      });
    }
  };

  const handleBackupDatabase = async () => {
    setIsBackingUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('database-backup', {
        method: 'GET'
      });

      if (error) {
        throw new Error(error.message || 'Failed to create backup');
      }

      // Create download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Database backup downloaded successfully",
      });
    } catch (error) {
      console.error('Backup error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create backup",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    setShowPlatformDialog(true);
    event.target.value = '';
  };

  const handleRestoreDatabase = async () => {
    if (!pendingFile) return;

    if (!confirm(`⚠️ WARNING: This will replace ALL data in the ${selectedPlatform === 'firebase' ? 'Firebase' : 'Supabase'} database with the backup data. This action cannot be undone. Are you sure you want to continue?`)) {
      setShowPlatformDialog(false);
      setPendingFile(null);
      return;
    }

    setIsRestoring(true);
    setShowPlatformDialog(false);
    
    try {
      const fileContent = await pendingFile.text();
      const backup = JSON.parse(fileContent);

      const { data, error } = await supabase.functions.invoke('database-restore', {
        method: 'POST',
        body: { 
          backup,
          platform: selectedPlatform
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to restore database');
      }

      toast({
        title: "Success",
        description: data.message || `Database restored successfully to ${selectedPlatform}`,
      });

      // Reload data after restore
      if (selectedPlatform === 'supabase') {
        await loadData();
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore database",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
      setPendingFile(null);
    }
  };

  // Show loading while auth is still loading
  if (authLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return (
      <div className="p-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Super Admin Access Required</h2>
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-red-600" />
            Super Admin Panel
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            System-wide configuration and user management
          </p>
        </div>
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Super Admin Access
        </Badge>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="settings">System Settings</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          <TabsTrigger value="monitoring">System Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure global system behavior and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Setting */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Add New Setting</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="setting-key">Setting Key</Label>
                    <Input
                      id="setting-key"
                      value={newSetting.key}
                      onChange={(e) => setNewSetting(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="e.g., feature_enabled"
                    />
                  </div>
                  <div>
                    <Label htmlFor="setting-value">Value (JSON)</Label>
                    <Input
                      id="setting-value"
                      value={newSetting.value}
                      onChange={(e) => setNewSetting(prev => ({ ...prev, value: e.target.value }))}
                      placeholder='e.g., true or "2025-12-31"'
                    />
                  </div>
                  <div>
                    <Label htmlFor="setting-description">Description</Label>
                    <Input
                      id="setting-description"
                      value={newSetting.description}
                      onChange={(e) => setNewSetting(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Setting description"
                    />
                  </div>
                </div>
                <Button onClick={addNewSetting}>Add Setting</Button>
              </div>

              {/* Existing Settings */}
              <div className="space-y-4">
                {systemSettings.map((setting) => (
                  <div key={setting.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{setting.setting_key}</h3>
                      <Badge variant="outline">
                        {typeof setting.setting_value}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                    
                    {setting.setting_key === 'updates_enabled' && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={setting.setting_value === true}
                          onCheckedChange={(checked) => 
                            updateSystemSetting(setting.setting_key, checked, setting.description)
                          }
                        />
                        <Label>Updates Enabled Globally</Label>
                      </div>
                    )}
                    
                    {setting.setting_key === 'updates_deadline' && (
                      <div className="space-y-2">
                        <Label>Global Updates Deadline</Label>
                        <Input
                          type="date"
                          value={setting.setting_value?.replace(/"/g, '') || ''}
                          onChange={(e) => 
                            updateSystemSetting(setting.setting_key, e.target.value, setting.description)
                          }
                        />
                      </div>
                    )}
                    
                    {setting.setting_key === 'maintenance_mode' && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={setting.setting_value === true}
                          onCheckedChange={(checked) => 
                            updateSystemSetting(setting.setting_key, checked, setting.description)
                          }
                        />
                        <Label>Maintenance Mode</Label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-600" />
                Component Permissions
              </CardTitle>
              <CardDescription>
                Control access to system components by role and time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Permission</TableHead>
                    <TableHead>Role Required</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {componentPermissions.map((permission) => (
                    <TableRow key={permission.id}>
                      <TableCell className="font-medium">{permission.component_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{permission.permission_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={permission.role_required === 'superadmin' ? 'destructive' : 'default'}
                        >
                          {permission.role_required}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={permission.is_enabled}
                          onCheckedChange={(checked) => 
                            updateComponentPermission({ ...permission, is_enabled: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="datetime-local"
                          value={permission.valid_until ? new Date(permission.valid_until).toISOString().slice(0, 16) : ''}
                          onChange={(e) => 
                            updateComponentPermission({ 
                              ...permission, 
                              valid_until: e.target.value ? new Date(e.target.value).toISOString() : null 
                            })
                          }
                          className="w-48"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => updateComponentPermission(permission)}
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Advanced User Management
              </CardTitle>
              <CardDescription>
                Full control over user accounts, roles, and access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => {
                    const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
                    const isToggling = togglingUsers.has(user.id);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.full_name || user.email}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => 
                              manageUser('update', user.id, { role: value })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="superadmin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {isBanned ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Disabled
                            </Badge>
                          ) : (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
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
                              size="sm"
                              variant="outline"
                              onClick={() => toggleUserStatus(user.id, isBanned)}
                              disabled={isToggling}
                              className={isBanned ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
                            >
                              {isToggling ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                              ) : isBanned ? (
                                <UserCheck className="h-4 w-4 mr-1" />
                              ) : (
                                <UserX className="h-4 w-4 mr-1" />
                              )}
                              {isBanned ? 'Enable' : 'Disable'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => manageUser('delete', user.id)}
                              disabled={user.role === "superadmin"}
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Database Backup & Restore
              </CardTitle>
              <CardDescription>
                Create backups and restore complete database snapshots
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Backup Section */}
              <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                <div className="flex items-start gap-4">
                  <Download className="h-8 w-8 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Backup</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Download a complete snapshot of all database tables including profiles, objectives, 
                      updates, daily work, action items, and system settings.
                    </p>
                    <Button 
                      onClick={handleBackupDatabase}
                      disabled={isBackingUp}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isBackingUp ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Creating Backup...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download Backup
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Restore Section */}
              <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                <div className="flex items-start gap-4">
                  <Upload className="h-8 w-8 text-red-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Restore from Backup</h3>
                    <div className="bg-red-100 border border-red-300 rounded-md p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-red-800">
                          <strong>Warning:</strong> Restoring will replace ALL current data with the backup data. 
                          This action cannot be undone. Make sure you have a current backup before proceeding.
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload a previously downloaded backup file to restore the database to that state.
                    </p>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileSelect}
                        disabled={isRestoring}
                        className="hidden"
                        id="restore-file-input"
                      />
                      <label htmlFor="restore-file-input">
                        <Button 
                          variant="destructive"
                          disabled={isRestoring}
                          className="cursor-pointer"
                          asChild
                        >
                          <span>
                            {isRestoring ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Restoring...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Select Backup File
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Information */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-2">Backup Information</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Backups include all user data, objectives, updates, and system settings</li>
                  <li>• Backup files are in JSON format and can be opened with any text editor</li>
                  <li>• Store backups securely as they contain sensitive data</li>
                  <li>• Regular backups are recommended before major system changes</li>
                  <li>• Only super admins can create and restore backups</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <CardTitle className="text-sm font-medium">Active Settings</CardTitle>
                <Settings className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{systemSettings.length}</div>
                <p className="text-xs text-gray-600">System configurations</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Permissions</CardTitle>
                <Lock className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{componentPermissions.length}</div>
                <p className="text-xs text-gray-600">Component permissions</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-gray-600">All systems operational</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Platform Selection Dialog */}
      <Dialog open={showPlatformDialog} onOpenChange={setShowPlatformDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Restore Platform</DialogTitle>
            <DialogDescription>
              Choose the platform where you want to restore this backup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Target Platform</Label>
              <Select value={selectedPlatform} onValueChange={(value: 'supabase' | 'firebase') => setSelectedPlatform(value)}>
                <SelectTrigger id="platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supabase">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Supabase (PostgreSQL)
                    </div>
                  </SelectItem>
                  <SelectItem value="firebase">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Firebase (Firestore)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                {selectedPlatform === 'supabase' 
                  ? 'Backup will be restored to Supabase PostgreSQL database using SQL tables.'
                  : 'Backup will be restored to Firebase Firestore using document collections. Tables will be mapped to appropriate collections.'}
              </p>
            </div>
            {selectedPlatform === 'firebase' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Make sure Firebase Admin credentials (FIREBASE_SERVICE_ACCOUNT) are configured in edge function secrets.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPlatformDialog(false);
              setPendingFile(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleRestoreDatabase} variant="destructive">
              Continue to Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
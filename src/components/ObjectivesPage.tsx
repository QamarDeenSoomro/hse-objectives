
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Objective {
  id: string;
  title: string;
  description: string;
  weightage: number;
  num_activities: number;
  owner_id: string;
  created_by: string;
  created_at: string;
  owner?: {
    full_name: string;
    email: string;
  };
  creator?: {
    full_name: string;
    email: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

export const ObjectivesPage = () => {
  const { isAdmin, profile } = useAuth();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    weightage: "",
    numActivities: "",
    ownerId: "",
  });

  useEffect(() => {
    fetchObjectives();
    if (isAdmin()) {
      fetchUsers();
    }
  }, [isAdmin, profile]);

  const fetchObjectives = async () => {
    try {
      let query = supabase
        .from('objectives')
        .select(`
          *,
          owner:profiles!objectives_owner_id_fkey(full_name, email),
          creator:profiles!objectives_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (!isAdmin()) {
        if (profile && profile.id) {
          query = query.eq('owner_id', profile.id);
        } else {
          // Not an admin and profile or profile.id is not available.
          // This case should ideally be handled based on application logic.
          // For now, log an error and don't fetch objectives or set to empty.
          console.error("Error: Non-admin user profile or profile ID is missing. Cannot fetch objectives.");
          setObjectives([]);
          setLoading(false);
          toast({
            title: "Error",
            description: "User profile not found. Cannot fetch objectives.",
            variant: "destructive",
          });
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setObjectives(data || []);
    } catch (error) {
      console.error('Error fetching objectives:', error);
      toast({
        title: "Error",
        description: "Failed to fetch objectives",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.weightage || !formData.numActivities) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (isAdmin() && !formData.ownerId) {
      toast({
        title: "Error",
        description: "Please select an owner for the objective",
        variant: "destructive",
      });
      return;
    }

    try {
      const objectiveData = {
        title: formData.title,
        description: formData.description,
        weightage: parseFloat(formData.weightage),
        num_activities: parseInt(formData.numActivities),
        owner_id: isAdmin() ? formData.ownerId : profile?.id,
        created_by: profile?.id,
      };

      if (editingObjective) {
        const { error } = await supabase
          .from('objectives')
          .update(objectiveData)
          .eq('id', editingObjective.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Objective updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('objectives')
          .insert([objectiveData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Objective created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingObjective(null);
      setFormData({ title: "", description: "", weightage: "", numActivities: "", ownerId: "" });
      fetchObjectives();
    } catch (error) {
      console.error('Error saving objective:', error);
      toast({
        title: "Error",
        description: "Failed to save objective",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (objective: Objective) => {
    setEditingObjective(objective);
    setFormData({
      title: objective.title,
      description: objective.description,
      weightage: objective.weightage.toString(),
      numActivities: objective.num_activities.toString(),
      ownerId: objective.owner_id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('objectives')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Objective deleted successfully",
      });
      fetchObjectives();
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast({
        title: "Error",
        description: "Failed to delete objective",
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    setEditingObjective(null);
    setFormData({ title: "", description: "", weightage: "", numActivities: "", ownerId: "" });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Objectives Management</h1>
          <p className="text-gray-600 mt-1">Manage HSE objectives and track progress.</p>
          {isAdmin() && objectives.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Total objectives being managed: <Badge variant="secondary">{objectives.length}</Badge>
            </p>
          )}
        </div>
        {isAdmin() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleAddNew}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Objective
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  {editingObjective ? "Edit Objective" : "Add New Objective"}
                </DialogTitle>
                <DialogDescription>
                  {editingObjective ? "Update the objective details" : "Create a new HSE objective"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter objective title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter objective description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weightage">Weightage (%)</Label>
                    <Input
                      id="weightage"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.weightage}
                      onChange={(e) => setFormData(prev => ({ ...prev, weightage: e.target.value }))}
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numActivities">Number of Activities</Label>
                    <Input
                      id="numActivities"
                      type="number"
                      min="1"
                      value={formData.numActivities}
                      onChange={(e) => setFormData(prev => ({ ...prev, numActivities: e.target.value }))}
                      placeholder="8"
                    />
                  </div>
                </div>
                {isAdmin() && (
                  <div className="space-y-2">
                    <Label htmlFor="owner">Objective Owner</Label>
                    <Select 
                      value={formData.ownerId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, ownerId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select objective owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingObjective ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isAdmin() ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(
            objectives.reduce((acc, objective) => {
              const ownerName = objective.owner?.full_name || objective.owner?.email || objective.owner_id || "Unknown Owner";
              if (!acc[ownerName]) {
                acc[ownerName] = [];
              }
              acc[ownerName].push(objective);
              return acc;
            }, {} as Record<string, Objective[]>)
          ).map(([ownerName, ownerObjectives]) => (
            <Card key={ownerName} className="border-0 shadow-lg"> {/* mb-6 removed, gap-6 from grid handles spacing */}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                Objectives for {ownerName}
              </CardTitle>
              <CardDescription>
                {ownerObjectives.length} {ownerObjectives.length === 1 ? "objective" : "objectives"} assigned.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Weightage</TableHead>
                      <TableHead>Activities</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ownerObjectives.map((objective) => (
                      <TableRow key={objective.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{objective.title}</div>
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {objective.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            {objective.weightage}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {objective.num_activities} activities
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {objective.creator?.full_name || objective.creator?.email}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(objective.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(objective)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(objective.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              My Objectives
            </CardTitle>
            <CardDescription>
              {objectives.length} {objectives.length === 1 ? "objective" : "objectives"} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Weightage</TableHead>
                    <TableHead>Activities</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created Date</TableHead>
                    {/* Actions column is not rendered for non-admins here */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {objectives.map((objective) => (
                    <TableRow key={objective.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{objective.title}</div>
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {objective.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{objective.owner?.full_name || objective.owner?.email}</div>
                          <div className="text-gray-600">{objective.owner?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          {objective.weightage}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {objective.num_activities} activities
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {objective.creator?.full_name || objective.creator?.email}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {new Date(objective.created_at).toLocaleDateString()}
                      </TableCell>
                      {/* isAdmin() is false in this branch, so this TableCell for actions won't render */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

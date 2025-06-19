import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Target, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";

// Components
import { UpdateDetailDialog } from "@/components/UpdateDetailDialog";
import { ObjectiveFormDialog } from "@/components/objectives/ObjectiveFormDialog";
import { ObjectiveCard } from "@/components/objectives/ObjectiveCard";
import { ObjectiveTableView } from "@/components/objectives/ObjectiveTableView";

// Types and utilities
import { Objective, UserProfile, ObjectiveFormData } from "@/types/objectives";
import { getQuarterInfo } from "@/utils/objectives";
import { useObjectivesData } from "@/hooks/useObjectivesData";

export const ObjectivesPage = () => {
  const { isAdmin, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedObjectiveUpdates, setSelectedObjectiveUpdates] = useState<any[]>([]);
  const [selectedObjectiveTitle, setSelectedObjectiveTitle] = useState("");
  const [formData, setFormData] = useState<ObjectiveFormData>({
    title: "",
    description: "",
    weightage: "",
    numActivities: "",
    ownerId: "",
    targetQuarter: "Q4",
  });

  // Get userId from URL parameters for filtering
  const userIdFromUrl = searchParams.get('userId');
  const [filteredUser, setFilteredUser] = useState<UserProfile | null>(null);

  // Use custom hook for data management
  const {
    objectives,
    users,
    loading,
    objectiveProgress,
    createObjective,
    updateObjective,
    deleteObjective,
  } = useObjectivesData(userIdFromUrl);

  useEffect(() => {
    // Find the filtered user details when userIdFromUrl changes
    if (userIdFromUrl && users.length > 0) {
      const user = users.find(u => u.id === userIdFromUrl);
      setFilteredUser(user || null);
    } else {
      setFilteredUser(null);
    }
  }, [userIdFromUrl, users]);

  // Event handlers
  const handleViewUpdates = async (objectiveId: string, objectiveTitle: string) => {
    try {
      const { data, error } = await supabase
        .from('objective_updates')
        .select(`
          *,
          user:profiles!user_id(full_name, email)
        `)
        .eq('objective_id', objectiveId)
        .order('update_date', { ascending: false });

      if (error) throw error;

      const transformedUpdates = data.map(update => ({
        ...update,
        user: {
          full_name: update.user?.full_name || '',
          email: update.user?.email || ''
        }
      }));

      setSelectedObjectiveUpdates(transformedUpdates);
      setSelectedObjectiveTitle(objectiveTitle);
      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error('Error fetching objective updates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch objective updates",
        variant: "destructive",
      });
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

    if (editingObjective) {
      await updateObjective(editingObjective.id, formData);
    } else {
      await createObjective(formData);
    }

    setIsDialogOpen(false);
    setEditingObjective(null);
    setFormData({ title: "", description: "", weightage: "", numActivities: "", ownerId: "", targetQuarter: "Q4" });
  };

  const handleEdit = (objective: Objective) => {
    setEditingObjective(objective);
    const quarterInfo = getQuarterInfo(objective.target_completion_date);
    setFormData({
      title: objective.title,
      description: objective.description,
      weightage: objective.weightage.toString(),
      numActivities: objective.num_activities.toString(),
      ownerId: objective.owner_id,
      targetQuarter: quarterInfo.quarter,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteObjective(id);
  };

  const handleAddNew = () => {
    setEditingObjective(null);
    setFormData({ title: "", description: "", weightage: "", numActivities: "", ownerId: "", targetQuarter: "Q4" });
    setIsDialogOpen(true);
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const handleUserSelect = (userId: string) => {
    if (userId === "all-users") {
      setSearchParams({});
    } else {
      setSearchParams({ userId });
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render main component
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {userIdFromUrl && isAdmin() && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 self-start"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {userIdFromUrl && filteredUser 
                  ? `${filteredUser.full_name || filteredUser.email}'s Objectives`
                  : "Objectives Management"
                }
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                {userIdFromUrl && filteredUser
                  ? `Viewing objectives assigned to ${filteredUser.full_name || filteredUser.email}`
                  : "Manage HSE objectives and track progress."
                }
              </p>
            </div>
          </div>
          {isAdmin() && objectives.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Total objectives {userIdFromUrl ? 'for this user' : 'being managed'}: <Badge variant="secondary">{objectives.length}</Badge>
            </p>
          )}
        </div>
        
        {/* Add Objective Button */}
        {isAdmin() && (
          <ObjectiveFormDialog
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            editingObjective={editingObjective}
            users={users}
            isAdmin={isAdmin()}
            onAddNew={handleAddNew}
          />
        )}
      </div>

      {/* User Selector for Admins */}
      {isAdmin() && users.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Quick User Navigation
            </CardTitle>
            <CardDescription>
              Select a user to view their objectives or view all objectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 min-w-0 max-w-md">
                <Select value={userIdFromUrl || "all-users"} onValueChange={handleUserSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user to view their objectives" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-users">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-600">
                {userIdFromUrl 
                  ? `Showing objectives for ${filteredUser?.full_name || filteredUser?.email || 'selected user'}`
                  : `Showing all objectives (${objectives.length} total)`
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objectives Display */}
      {isAdmin() ? (
        <div className="space-y-6">
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
            <Card key={ownerName} className="border-0 shadow-lg">
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
                {/* Desktop Table View */}
                <ObjectiveTableView
                  objectives={ownerObjectives}
                  objectiveProgress={objectiveProgress}
                  isAdmin={isAdmin()}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewUpdates={handleViewUpdates}
                />

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {ownerObjectives.map((objective) => (
                    <ObjectiveCard 
                      key={objective.id} 
                      objective={objective}
                      progress={objectiveProgress[objective.id] || 0}
                      isAdmin={isAdmin()}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onViewUpdates={handleViewUpdates}
                    />
                  ))}
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
            {/* Desktop Table View */}
            <ObjectiveTableView
              objectives={objectives}
              objectiveProgress={objectiveProgress}
              isAdmin={isAdmin()}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewUpdates={handleViewUpdates}
            />

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {objectives.map((objective) => (
                <ObjectiveCard 
                  key={objective.id} 
                  objective={objective}
                  progress={objectiveProgress[objective.id] || 0}
                  isAdmin={isAdmin()}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewUpdates={handleViewUpdates}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Detail Dialog */}
      <UpdateDetailDialog
        isOpen={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        objectiveTitle={selectedObjectiveTitle}
        updates={selectedObjectiveUpdates}
      />
    </div>
  );
};
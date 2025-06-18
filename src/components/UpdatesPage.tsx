import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, CheckSquare } from "lucide-react";
import { useUpdatesData } from "@/hooks/useUpdatesData";
import { UpdateDetailDialog } from "@/components/UpdateDetailDialog";
import { UpdateFormDialog } from "@/components/updates/UpdateFormDialog";
import { EditUpdateDialog } from "@/components/updates/EditUpdateDialog";
import { UpdatesTable } from "@/components/updates/UpdatesTable";
import { TeamUpdatesView } from "@/components/updates/TeamUpdatesView";

export const UpdatesPage = () => {
  const { isAdmin, profile } = useAuth();
  const { userObjectives, updates, isLoading, createUpdate, isCreating, updateUpdate, isUpdating, deleteUpdate, isDeleting } = useUpdatesData();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedObjectiveUpdates, setSelectedObjectiveUpdates] = useState<any[]>([]);
  const [selectedObjectiveTitle, setSelectedObjectiveTitle] = useState("");
  const [editingUpdate, setEditingUpdate] = useState<any>(null);

  // Filter updates based on user role
  const myUpdates = updates.filter(update => update.user_id === profile?.id);
  const allUpdates = updates;

  // Group team updates by user and then by objective
  const groupedTeamUpdates = allUpdates.reduce((acc, update) => {
    const userName = update.user?.full_name || update.user?.email || 'Unknown User';
    const objectiveTitle = update.objective?.title || 'Unknown Objective';
    
    if (!acc[userName]) {
      acc[userName] = {};
    }
    
    if (!acc[userName][objectiveTitle]) {
      acc[userName][objectiveTitle] = [];
    }
    
    acc[userName][objectiveTitle].push(update);
    return acc;
  }, {} as Record<string, Record<string, any[]>>);

  const handleAddNew = () => {
    setIsDialogOpen(true);
  };

  const handleEdit = (update: any) => {
    setEditingUpdate(update);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (updateId: string) => {
    deleteUpdate(updateId);
  };

  const handleViewObjectiveDetails = (objectiveId: string, objectiveTitle: string) => {
    const objectiveUpdates = updates.filter(update => update.objective_id === objectiveId);
    setSelectedObjectiveUpdates(objectiveUpdates);
    setSelectedObjectiveTitle(objectiveTitle);
    setIsDetailDialogOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    createUpdate(data);
    setIsDialogOpen(false);
  };

  const handleEditSubmit = (data: any) => {
    updateUpdate(data);
    setIsEditDialogOpen(false);
    setEditingUpdate(null);
  };

  if (isLoading) {
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Updates</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Track and manage objective progress updates</p>
        </div>
        <Button 
          onClick={handleAddNew}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Update
        </Button>
      </div>

      <UpdateFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        userObjectives={userObjectives}
        onSubmit={handleFormSubmit}
        isCreating={isCreating}
      />

      <EditUpdateDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingUpdate={editingUpdate}
        onSubmit={handleEditSubmit}
        isUpdating={isUpdating}
        isAdmin={isAdmin()}
      />

      <Tabs defaultValue={isAdmin() ? "all" : "my"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my">My Updates</TabsTrigger>
          {isAdmin() && <TabsTrigger value="all">All Updates</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="my">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                My Updates
              </CardTitle>
              <CardDescription>
                {myUpdates.length} updates recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myUpdates.length > 0 ? (
                <UpdatesTable
                  updates={myUpdates}
                  isAdmin={isAdmin()}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewObjectiveDetails={handleViewObjectiveDetails}
                />
              ) : (
                <div className="text-center text-gray-500 py-8 text-sm">
                  No updates found. Add your first update using the button above.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {isAdmin() && (
          <TabsContent value="all">
            <TeamUpdatesView
              groupedTeamUpdates={groupedTeamUpdates}
              isAdmin={isAdmin()}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewObjectiveDetails={handleViewObjectiveDetails}
            />
          </TabsContent>
        )}
      </Tabs>

      <UpdateDetailDialog
        isOpen={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        objectiveTitle={selectedObjectiveTitle}
        updates={selectedObjectiveUpdates}
      />
    </div>
  );
};
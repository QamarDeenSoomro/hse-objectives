
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, CheckSquare, Camera, Eye, Trash2, User, Target } from "lucide-react";
import { useUpdatesData } from "@/hooks/useUpdatesData";
import { UpdateDetailDialog } from "@/components/UpdateDetailDialog";

export const UpdatesPage = () => {
  const { isAdmin } = useAuth();
  const { userObjectives, updates, isLoading, createUpdate, isCreating, updateUpdate, isUpdating, deleteUpdate, isDeleting } = useUpdatesData();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedObjectiveUpdates, setSelectedObjectiveUpdates] = useState<any[]>([]);
  const [selectedObjectiveTitle, setSelectedObjectiveTitle] = useState("");
  const [editingUpdate, setEditingUpdate] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    objectiveId: "",
    achievedCount: "",
    updateDate: new Date().toISOString().split('T')[0],
  });
  const [editFormData, setEditFormData] = useState({
    achievedCount: "",
    updateDate: "",
    efficiency: "",
  });
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [editSelectedPhotos, setEditSelectedPhotos] = useState<File[]>([]);

  // Filter updates based on user role
  const myUpdates = updates.filter(update => update.user_id === useAuth().profile?.id);
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

  const getCompletionPercentage = (achieved: number, total: number, efficiency: number = 100) => {
    const rawProgress = (achieved / total) * 100;
    const effectiveProgress = (rawProgress * efficiency) / 100;
    return Math.round(Math.min(100, effectiveProgress));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.objectiveId || !formData.achievedCount || !formData.updateDate) {
      return;
    }

    createUpdate({
      objectiveId: formData.objectiveId,
      achievedCount: parseInt(formData.achievedCount),
      updateDate: formData.updateDate,
      photos: selectedPhotos,
    });

    setIsDialogOpen(false);
    setFormData({ 
      objectiveId: "", 
      achievedCount: "", 
      updateDate: new Date().toISOString().split('T')[0] 
    });
    setSelectedPhotos([]);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editFormData.achievedCount || !editFormData.updateDate || !editingUpdate) {
      return;
    }

    const updateData: any = {
      id: editingUpdate.id,
      achievedCount: parseInt(editFormData.achievedCount),
      updateDate: editFormData.updateDate,
      photos: editSelectedPhotos,
    };

    // Only include efficiency if admin and value is provided
    if (isAdmin() && editFormData.efficiency) {
      updateData.efficiency = parseFloat(editFormData.efficiency);
    }

    updateUpdate(updateData);

    setIsEditDialogOpen(false);
    setEditingUpdate(null);
    setEditFormData({ achievedCount: "", updateDate: "", efficiency: "" });
    setEditSelectedPhotos([]);
  };

  const handleAddNew = () => {
    setFormData({ 
      objectiveId: "", 
      achievedCount: "", 
      updateDate: new Date().toISOString().split('T')[0] 
    });
    setSelectedPhotos([]);
    setIsDialogOpen(true);
  };

  const handleEdit = (update: any) => {
    setEditingUpdate(update);
    setEditFormData({
      achievedCount: update.achieved_count.toString(),
      updateDate: update.update_date,
      efficiency: update.efficiency?.toString() || "100",
    });
    setEditSelectedPhotos([]);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (updateId: string) => {
    deleteUpdate(updateId);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedPhotos(Array.from(e.target.files));
    }
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditSelectedPhotos(Array.from(e.target.files));
    }
  };

  const handleViewObjectiveDetails = (objectiveId: string, objectiveTitle: string) => {
    const objectiveUpdates = updates.filter(update => update.objective_id === objectiveId);
    setSelectedObjectiveUpdates(objectiveUpdates);
    setSelectedObjectiveTitle(objectiveTitle);
    setIsDetailDialogOpen(true);
  };

  const renderUpdatesTable = (updatesData: any[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Objective</TableHead>
            {isAdmin() && <TableHead>User</TableHead>}
            <TableHead>Raw Progress</TableHead>
            <TableHead>Efficiency</TableHead>
            <TableHead>Effective Progress</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Photos</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {updatesData.map((update) => {
            const rawProgress = getCompletionPercentage(update.achieved_count, update.objective?.num_activities || 1, 100);
            const effectiveProgress = getCompletionPercentage(update.achieved_count, update.objective?.num_activities || 1, update.efficiency || 100);
            
            return (
              <TableRow key={update.id}>
                <TableCell>
                  <div className="font-medium">{update.objective?.title}</div>
                </TableCell>
                {isAdmin() && (
                  <TableCell className="text-sm text-gray-600">
                    {update.user?.full_name || update.user?.email}
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {update.achieved_count}/{update.objective?.num_activities}
                    </span>
                    <Badge variant="outline">
                      {rawProgress}%
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={update.efficiency >= 80 ? "default" : update.efficiency >= 60 ? "secondary" : "destructive"}
                  >
                    {update.efficiency || 100}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={effectiveProgress >= 80 ? "default" : "secondary"}
                    className="font-semibold"
                  >
                    {effectiveProgress}%
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(update.update_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {update.photos && update.photos.length > 0 ? (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Camera className="h-3 w-3" />
                      {update.photos.length}
                    </Badge>
                  ) : (
                    <span className="text-gray-400">No photos</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isAdmin() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewObjectiveDetails(update.objective_id, update.objective?.title || 'Unknown')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {isAdmin() && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(update)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Update</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this update? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(update.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleAddNew}
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Update
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                Add Progress Update
              </DialogTitle>
              <DialogDescription>
                Record progress on your assigned objectives
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="objective">Objective</Label>
                <Select 
                  value={formData.objectiveId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, objectiveId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an objective" />
                  </SelectTrigger>
                  <SelectContent>
                    {userObjectives.map((objective) => (
                      <SelectItem key={objective.id} value={objective.id}>
                        {objective.title} ({objective.num_activities} activities)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="achievedCount">Activities Completed</Label>
                <Input
                  id="achievedCount"
                  type="number"
                  min="0"
                  value={formData.achievedCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, achievedCount: e.target.value }))}
                  placeholder="Enter number of completed activities"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="updateDate">Update Date</Label>
                <Input
                  id="updateDate"
                  type="date"
                  value={formData.updateDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, updateDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photos">Photos (Optional)</Label>
                <Input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedPhotos.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {selectedPhotos.length} photo(s) selected
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Adding..." : "Add Update"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Update Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Update
            </DialogTitle>
            <DialogDescription>
              Modify the progress update details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editAchievedCount">Activities Completed</Label>
              <Input
                id="editAchievedCount"
                type="number"
                min="0"
                value={editFormData.achievedCount}
                onChange={(e) => setEditFormData(prev => ({ ...prev, achievedCount: e.target.value }))}
                placeholder="Enter number of completed activities"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editUpdateDate">Update Date</Label>
              <Input
                id="editUpdateDate"
                type="date"
                value={editFormData.updateDate}
                onChange={(e) => setEditFormData(prev => ({ ...prev, updateDate: e.target.value }))}
              />
            </div>
            {isAdmin() && (
              <div className="space-y-2">
                <Label htmlFor="editEfficiency">Efficiency Rating (%)</Label>
                <Input
                  id="editEfficiency"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={editFormData.efficiency}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, efficiency: e.target.value }))}
                  placeholder="Enter efficiency percentage (0-100)"
                />
                <p className="text-xs text-gray-500">
                  This multiplies the user's progress. E.g., 50% efficiency on 20% progress = 10% effective progress
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="editPhotos">Add New Photos (Optional)</Label>
              <Input
                id="editPhotos"
                type="file"
                accept="image/*"
                multiple
                onChange={handleEditPhotoChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {editSelectedPhotos.length > 0 && (
                <div className="text-sm text-gray-600">
                  {editSelectedPhotos.length} new photo(s) selected
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
                renderUpdatesTable(myUpdates)
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
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-green-600" />
                  Team Updates
                </CardTitle>
                <CardDescription>
                  {allUpdates.length} total updates from all team members
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(groupedTeamUpdates).length > 0 ? (
                  <div className="space-y-8">
                    {Object.entries(groupedTeamUpdates).map(([userName, userObjectives]) => (
                      <div key={userName} className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b">
                          <User className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-800">{userName}</h3>
                        </div>
                        
                        <div className="space-y-6 ml-6">
                          {Object.entries(userObjectives).map(([objectiveTitle, objectiveUpdates]) => (
                            <div key={objectiveTitle} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-green-600" />
                                <h4 className="font-medium text-gray-700">{objectiveTitle}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {objectiveUpdates.length} update{objectiveUpdates.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              
                              <div className="ml-6">
                                {renderUpdatesTable(objectiveUpdates)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8 text-sm">
                    No updates found. Team members can add updates for their objectives.
                  </div>
                )}
              </CardContent>
            </Card>
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

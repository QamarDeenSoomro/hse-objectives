
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Edit, CheckSquare, Camera, Eye } from "lucide-react";
import { useUpdatesData } from "@/hooks/useUpdatesData";
import { UpdateDetailDialog } from "@/components/UpdateDetailDialog";

export const UpdatesPage = () => {
  const { isAdmin } = useAuth();
  const { userObjectives, updates, isLoading, createUpdate, isCreating } = useUpdatesData();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedObjectiveUpdates, setSelectedObjectiveUpdates] = useState<any[]>([]);
  const [selectedObjectiveTitle, setSelectedObjectiveTitle] = useState("");
  
  const [formData, setFormData] = useState({
    objectiveId: "",
    achievedCount: "",
    updateDate: new Date().toISOString().split('T')[0],
  });
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

  // Filter updates based on user role
  const myUpdates = updates.filter(update => update.user_id === useAuth().profile?.id);
  const allUpdates = updates;

  const getCompletionPercentage = (achieved: number, total: number) => {
    return Math.round((achieved / total) * 100);
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

  const handleAddNew = () => {
    setFormData({ 
      objectiveId: "", 
      achievedCount: "", 
      updateDate: new Date().toISOString().split('T')[0] 
    });
    setSelectedPhotos([]);
    setIsDialogOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedPhotos(Array.from(e.target.files));
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
            <TableHead>Progress</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Photos</TableHead>
            {isAdmin() && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {updatesData.map((update) => (
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
                  <Badge 
                    variant={getCompletionPercentage(update.achieved_count, update.objective?.num_activities || 1) >= 80 ? "default" : "secondary"}
                  >
                    {getCompletionPercentage(update.achieved_count, update.objective?.num_activities || 1)}%
                  </Badge>
                </div>
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
              {isAdmin() && (
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewObjectiveDetails(update.objective_id, update.objective?.title || 'Unknown')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
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
                {allUpdates.length > 0 ? (
                  renderUpdatesTable(allUpdates)
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

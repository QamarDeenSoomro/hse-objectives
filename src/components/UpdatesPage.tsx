
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
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, CheckSquare } from "lucide-react";

interface Update {
  id: string;
  objectiveId: string;
  objectiveTitle: string;
  userId: string;
  userEmail: string;
  achievedCount: number;
  totalActivities: number;
  updateDate: string;
}

export const UpdatesPage = () => {
  const { isAdmin, user } = useAuth();
  const [updates, setUpdates] = useState<Update[]>([
    {
      id: "1",
      objectiveId: "1",
      objectiveTitle: "Fire Safety Training",
      userId: "user-1",
      userEmail: "john@company.com",
      achievedCount: 6,
      totalActivities: 8,
      updateDate: "2024-01-15",
    },
    {
      id: "2",
      objectiveId: "2",
      objectiveTitle: "Environmental Compliance",
      userId: "user-2",
      userEmail: "sarah@company.com",
      achievedCount: 9,
      totalActivities: 12,
      updateDate: "2024-01-14",
    },
    {
      id: "3",
      objectiveId: "1",
      objectiveTitle: "Fire Safety Training",
      userId: "user-3",
      userEmail: "mike@company.com",
      achievedCount: 8,
      totalActivities: 8,
      updateDate: "2024-01-16",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);
  const [formData, setFormData] = useState({
    objectiveId: "",
    achievedCount: "",
    updateDate: "",
  });

  // Mock objectives data
  const objectives = [
    { id: "1", title: "Fire Safety Training", totalActivities: 8 },
    { id: "2", title: "Environmental Compliance", totalActivities: 12 },
    { id: "3", title: "Workplace Ergonomics", totalActivities: 6 },
  ];

  const myUpdates = updates.filter(update => update.userEmail === user?.email);
  const allUpdates = updates;

  const getCompletionPercentage = (achieved: number, total: number) => {
    return Math.round((achieved / total) * 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.objectiveId || !formData.achievedCount || !formData.updateDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const selectedObjective = objectives.find(obj => obj.id === formData.objectiveId);
    if (!selectedObjective) return;

    const updateData = {
      id: editingUpdate?.id || Date.now().toString(),
      objectiveId: formData.objectiveId,
      objectiveTitle: selectedObjective.title,
      userId: user?.id || "user-1",
      userEmail: user?.email || "user@company.com",
      achievedCount: parseInt(formData.achievedCount),
      totalActivities: selectedObjective.totalActivities,
      updateDate: formData.updateDate,
    };

    if (editingUpdate) {
      setUpdates(prev => prev.map(update => update.id === editingUpdate.id ? updateData : update));
      toast({
        title: "Success",
        description: "Update modified successfully",
      });
    } else {
      setUpdates(prev => [...prev, updateData]);
      toast({
        title: "Success",
        description: "Update added successfully",
      });
    }

    setIsDialogOpen(false);
    setEditingUpdate(null);
    setFormData({ objectiveId: "", achievedCount: "", updateDate: "" });
  };

  const handleEdit = (update: Update) => {
    setEditingUpdate(update);
    setFormData({
      objectiveId: update.objectiveId,
      achievedCount: update.achievedCount.toString(),
      updateDate: update.updateDate,
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingUpdate(null);
    setFormData({ objectiveId: "", achievedCount: "", updateDate: new Date().toISOString().split('T')[0] });
    setIsDialogOpen(true);
  };

  const renderUpdatesTable = (updatesData: Update[]) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Objective</TableHead>
            {isAdmin() && <TableHead>User</TableHead>}
            <TableHead>Progress</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {updatesData.map((update) => (
            <TableRow key={update.id}>
              <TableCell>
                <div className="font-medium">{update.objectiveTitle}</div>
              </TableCell>
              {isAdmin() && (
                <TableCell className="text-sm text-gray-600">
                  {update.userEmail}
                </TableCell>
              )}
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    {update.achievedCount}/{update.totalActivities}
                  </span>
                  <Badge 
                    variant={getCompletionPercentage(update.achievedCount, update.totalActivities) >= 80 ? "default" : "secondary"}
                  >
                    {getCompletionPercentage(update.achievedCount, update.totalActivities)}%
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {new Date(update.updateDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(update)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Updates</h1>
          <p className="text-gray-600 mt-1">Track and manage objective progress updates</p>
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
                {editingUpdate ? "Edit Update" : "Add New Update"}
              </DialogTitle>
              <DialogDescription>
                {editingUpdate ? "Modify the progress update" : "Record progress on an objective"}
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
                    {objectives.map((objective) => (
                      <SelectItem key={objective.id} value={objective.id}>
                        {objective.title} ({objective.totalActivities} activities)
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
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingUpdate ? "Update" : "Add"}
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
              {renderUpdatesTable(myUpdates)}
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
                {renderUpdatesTable(allUpdates)}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};


import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Target } from "lucide-react";

interface Objective {
  id: string;
  title: string;
  description: string;
  weightage: number;
  numActivities: number;
  createdBy: string;
  createdAt: string;
}

export const ObjectivesPage = () => {
  const { isAdmin } = useAuth();
  const [objectives, setObjectives] = useState<Objective[]>([
    {
      id: "1",
      title: "Fire Safety Training",
      description: "Complete comprehensive fire safety training for all team members",
      weightage: 25,
      numActivities: 8,
      createdBy: "admin@yourdomain.com",
      createdAt: "2024-01-01",
    },
    {
      id: "2",
      title: "Environmental Compliance",
      description: "Ensure all activities meet environmental regulations",
      weightage: 30,
      numActivities: 12,
      createdBy: "admin@yourdomain.com",
      createdAt: "2024-01-02",
    },
    {
      id: "3",
      title: "Workplace Ergonomics",
      description: "Implement ergonomic improvements across workstations",
      weightage: 20,
      numActivities: 6,
      createdBy: "admin@yourdomain.com",
      createdAt: "2024-01-03",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    weightage: "",
    numActivities: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.weightage || !formData.numActivities) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const objectiveData = {
      id: editingObjective?.id || Date.now().toString(),
      title: formData.title,
      description: formData.description,
      weightage: parseInt(formData.weightage),
      numActivities: parseInt(formData.numActivities),
      createdBy: "admin@yourdomain.com",
      createdAt: editingObjective?.createdAt || new Date().toISOString().split('T')[0],
    };

    if (editingObjective) {
      setObjectives(prev => prev.map(obj => obj.id === editingObjective.id ? objectiveData : obj));
      toast({
        title: "Success",
        description: "Objective updated successfully",
      });
    } else {
      setObjectives(prev => [...prev, objectiveData]);
      toast({
        title: "Success",
        description: "Objective created successfully",
      });
    }

    setIsDialogOpen(false);
    setEditingObjective(null);
    setFormData({ title: "", description: "", weightage: "", numActivities: "" });
  };

  const handleEdit = (objective: Objective) => {
    setEditingObjective(objective);
    setFormData({
      title: objective.title,
      description: objective.description,
      weightage: objective.weightage.toString(),
      numActivities: objective.numActivities.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setObjectives(prev => prev.filter(obj => obj.id !== id));
    toast({
      title: "Success",
      description: "Objective deleted successfully",
    });
  };

  const handleAddNew = () => {
    setEditingObjective(null);
    setFormData({ title: "", description: "", weightage: "", numActivities: "" });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Objectives Management</h1>
          <p className="text-gray-600 mt-1">Manage HSE objectives and track progress</p>
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

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            All Objectives
          </CardTitle>
          <CardDescription>
            {objectives.length} objectives configured
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
                  {isAdmin() && <TableHead>Actions</TableHead>}
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
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        {objective.weightage}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {objective.numActivities} activities
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {objective.createdBy}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(objective.createdAt).toLocaleDateString()}
                    </TableCell>
                    {isAdmin() && (
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
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

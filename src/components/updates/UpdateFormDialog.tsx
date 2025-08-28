import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Activity, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/integrations/firebase/client";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

interface UpdateFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userObjectives: any[];
  onSubmit: (data: {
    objectiveId: string;
    achievedCount: number;
    updateDate: string;
    photos: File[];
    comments?: string;
  }) => void;
  isCreating: boolean;
}

export const UpdateFormDialog = ({
  isOpen,
  onOpenChange,
  userObjectives,
  onSubmit,
  isCreating
}: UpdateFormDialogProps) => {
  const [formData, setFormData] = useState({
    objectiveId: "",
    achievedCount: "",
    updateDate: new Date().toISOString().split('T')[0],
    comments: "",
  });
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [currentProgress, setCurrentProgress] = useState<{
    completed: number;
    total: number;
    percentage: number;
  } | null>(null);

  // Fetch current progress when objective is selected
  useEffect(() => {
    if (formData.objectiveId) {
      fetchCurrentProgress(formData.objectiveId);
    } else {
      setCurrentProgress(null);
    }
  }, [formData.objectiveId]);

  const fetchCurrentProgress = async (objectiveId: string) => {
    try {
      // Get the objective details
      const objective = userObjectives.find(obj => obj.id === objectiveId);
      if (!objective) return;

      // Get all updates for this objective
      const updatesQuery = query(
          collection(db, "objective_updates"),
          where("objective_id", "==", objectiveId),
          orderBy("update_date", "asc")
      );
      const updatesSnapshot = await getDocs(updatesQuery);
      const updates = updatesSnapshot.docs.map(doc => doc.data());

      // Calculate cumulative progress
      let totalAchievedCount = 0;
      if (updates && updates.length > 0) {
        totalAchievedCount = updates.reduce((total, update) => total + (update.achieved_count || 0), 0);
      }

      // Calculate effective progress with efficiency
      const latestUpdate = updates && updates.length > 0 ? updates[updates.length - 1] : null;
      const efficiency = latestUpdate?.efficiency || 100;
      const rawProgress = (totalAchievedCount / objective.num_activities) * 100;
      const effectiveProgress = (rawProgress * efficiency) / 100;

      setCurrentProgress({
        completed: totalAchievedCount,
        total: objective.num_activities,
        percentage: Math.round(Math.min(100, effectiveProgress))
      });
    } catch (error) {
      console.error('Error calculating progress:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.objectiveId || !formData.achievedCount || !formData.updateDate) {
      return;
    }

    onSubmit({
      objectiveId: formData.objectiveId,
      achievedCount: parseInt(formData.achievedCount),
      updateDate: formData.updateDate,
      photos: selectedPhotos,
      comments: formData.comments.trim() || undefined,
    });

    setFormData({ 
      objectiveId: "", 
      achievedCount: "", 
      updateDate: new Date().toISOString().split('T')[0],
      comments: "",
    });
    setSelectedPhotos([]);
    setCurrentProgress(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedPhotos(Array.from(e.target.files));
    }
  };

  const selectedObjective = userObjectives.find(obj => obj.id === formData.objectiveId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            Add Progress Update
          </DialogTitle>
          <DialogDescription>
            Record additional progress on your assigned objectives. Each update adds to your cumulative progress.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {/* Current Progress Display */}
          {currentProgress && selectedObjective && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Current Progress</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {currentProgress.completed}
                      </div>
                      <div className="text-sm text-blue-700">Activities Completed</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {currentProgress.total}
                      </div>
                      <div className="text-sm text-blue-700">Total Activities</div>
                    </div>
                    
                    <div className="text-center">
                      <Badge className="text-lg px-3 py-1 bg-blue-600">
                        {currentProgress.percentage}%
                      </Badge>
                      <div className="text-sm text-blue-700 mt-1">Effective Progress</div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-green-600 transition-all duration-500"
                      style={{ width: `${currentProgress.percentage}%` }}
                    />
                  </div>
                  
                  <div className="text-sm text-blue-800 text-center">
                    {currentProgress.completed} out of {currentProgress.total} activities completed 
                    ({currentProgress.percentage}% effective progress)
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="achievedCount">Additional Activities Completed</Label>
            <Input
              id="achievedCount"
              type="number"
              min="1"
              value={formData.achievedCount}
              onChange={(e) => setFormData(prev => ({ ...prev, achievedCount: e.target.value }))}
              placeholder="Enter number of additional activities completed"
            />
            <p className="text-xs text-gray-500">
              This will be added to your existing progress. For example, if you previously completed {currentProgress?.completed || 0} activities and now complete 3 more, enter 3.
            </p>
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
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Add any comments about this update, challenges faced, achievements, or additional context..."
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Share details about your progress, any challenges overcome, or additional context for this update.
            </p>
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
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {selectedPhotos.length} photo(s) selected
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
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
  );
};
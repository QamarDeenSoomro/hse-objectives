
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare } from "lucide-react";

interface UpdateFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userObjectives: any[];
  onSubmit: (data: {
    objectiveId: string;
    achievedCount: number;
    updateDate: string;
    photos: File[];
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
  });
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);

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
    });

    setFormData({ 
      objectiveId: "", 
      achievedCount: "", 
      updateDate: new Date().toISOString().split('T')[0] 
    });
    setSelectedPhotos([]);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedPhotos(Array.from(e.target.files));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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

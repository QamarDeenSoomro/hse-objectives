import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";

interface EditUpdateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingUpdate: any;
  onSubmit: (data: {
    id: string;
    achievedCount: number;
    updateDate: string;
    photos: File[];
    efficiency?: number;
  }) => void;
  isUpdating: boolean;
  isAdmin: boolean;
}

export const EditUpdateDialog = ({
  isOpen,
  onOpenChange,
  editingUpdate,
  onSubmit,
  isUpdating,
  isAdmin
}: EditUpdateDialogProps) => {
  const [editFormData, setEditFormData] = useState({
    achievedCount: "",
    updateDate: "",
    efficiency: "",
  });
  const [editSelectedPhotos, setEditSelectedPhotos] = useState<File[]>([]);

  useEffect(() => {
    if (editingUpdate) {
      setEditFormData({
        achievedCount: editingUpdate.achieved_count.toString(),
        updateDate: editingUpdate.update_date,
        efficiency: editingUpdate.efficiency?.toString() || "100",
      });
      setEditSelectedPhotos([]);
    }
  }, [editingUpdate]);

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

    if (isAdmin && editFormData.efficiency) {
      updateData.efficiency = parseFloat(editFormData.efficiency);
    }

    onSubmit(updateData);

    setEditFormData({ achievedCount: "", updateDate: "", efficiency: "" });
    setEditSelectedPhotos([]);
  };

  const handleEditPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditSelectedPhotos(Array.from(e.target.files));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-600" />
            Edit Update
          </DialogTitle>
          <DialogDescription>
            Modify the progress update details. This represents the incremental activities completed in this specific update.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editAchievedCount">Activities Completed (This Update)</Label>
            <Input
              id="editAchievedCount"
              type="number"
              min="0"
              value={editFormData.achievedCount}
              onChange={(e) => setEditFormData(prev => ({ ...prev, achievedCount: e.target.value }))}
              placeholder="Enter number of activities completed in this update"
            />
            <p className="text-xs text-gray-500">
              This is the number of activities completed specifically in this update, not the total cumulative count.
            </p>
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
          {isAdmin && (
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
              onClick={() => onOpenChange(false)}
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
  );
};
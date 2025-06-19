import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target } from "lucide-react";
import { ObjectiveFormData, UserProfile } from "@/types/objectives";
import { QUARTERS } from "@/utils/objectives";

interface ObjectiveFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ObjectiveFormData;
  setFormData: React.Dispatch<React.SetStateAction<ObjectiveFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  editingObjective: any;
  users: UserProfile[];
  isAdmin: boolean;
  onAddNew: () => void;
}

export const ObjectiveFormDialog = ({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  editingObjective,
  users,
  isAdmin,
  onAddNew
}: ObjectiveFormDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          onClick={onAddNew}
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
            {editingObjective ? "Update the objective details" : "Create a new OHIH objective"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="targetQuarter">Target Completion Quarter</Label>
            <Select 
              value={formData.targetQuarter} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, targetQuarter: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target quarter" />
              </SelectTrigger>
              <SelectContent>
                {QUARTERS.map((quarter) => (
                  <SelectItem key={quarter.value} value={quarter.value}>
                    {quarter.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isAdmin && (
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
              onClick={() => onOpenChange(false)}
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
  );
};
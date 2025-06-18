import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target } from "lucide-react";
import { ActionItem, ActionItemFormData, PRIORITY_OPTIONS } from "@/types/actionItems";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ActionItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingActionItem?: ActionItem | null;
}

export const ActionItemFormDialog = ({
  isOpen,
  onOpenChange,
  editingActionItem
}: ActionItemFormDialogProps) => {
  const [formData, setFormData] = React.useState<ActionItemFormData>({
    title: "",
    description: "",
    target_date: "",
    priority: "medium",
    assigned_to: "",
    verifier_id: "",
  });

  // Fetch users for assignment
  const { data: users = [] } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });

  React.useEffect(() => {
    if (editingActionItem) {
      setFormData({
        title: editingActionItem.title,
        description: editingActionItem.description || "",
        target_date: editingActionItem.target_date,
        priority: editingActionItem.priority || "medium",
        assigned_to: editingActionItem.assigned_to,
        verifier_id: editingActionItem.verifier_id || "",
      });
    } else {
      setFormData({
        title: "",
        description: "",
        target_date: "",
        priority: "medium",
        assigned_to: "",
        verifier_id: "",
      });
    }
  }, [editingActionItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This would be handled by the parent component
    onOpenChange(false);
  };

  const handleVerifierChange = (value: string) => {
    // Map the placeholder value back to empty string
    const verifierId = value === "no-verifier-selected" ? "" : value;
    setFormData(prev => ({ ...prev, verifier_id: verifierId }));
  };

  // Get the display value for the verifier select
  const getVerifierDisplayValue = () => {
    return formData.verifier_id === "" ? "no-verifier-selected" : formData.verifier_id;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            {editingActionItem ? "Edit Action Item" : "Create New Action Item"}
          </DialogTitle>
          <DialogDescription>
            {editingActionItem 
              ? "Update the action item details" 
              : "Create a new action item with assignment and verification workflow"
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter action item title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter detailed description of the action item"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_date">Target Date *</Label>
              <Input
                id="target_date"
                type="date"
                value={formData.target_date}
                onChange={(e) => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_to">Assign To *</Label>
            <Select 
              value={formData.assigned_to} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select person responsible" />
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

          <div className="space-y-2">
            <Label htmlFor="verifier_id">Verifier (Optional)</Label>
            <Select 
              value={getVerifierDisplayValue()} 
              onValueChange={handleVerifierChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select person responsible for verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-verifier-selected">No verifier required</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingActionItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
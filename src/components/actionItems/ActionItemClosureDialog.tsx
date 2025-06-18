import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CheckSquare, Upload } from "lucide-react";
import { useActionItems } from "@/hooks/useActionItems";
import { ActionItem, ActionItemClosureFormData } from "@/types/actionItems";

interface ActionItemClosureDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  actionItem: ActionItem | null;
}

export const ActionItemClosureDialog = ({
  isOpen,
  onOpenChange,
  actionItem
}: ActionItemClosureDialogProps) => {
  const { closeActionItem, isClosing } = useActionItems();
  
  const [formData, setFormData] = useState<ActionItemClosureFormData>({
    closure_text: "",
    media_files: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!actionItem || !formData.closure_text.trim()) return;

    closeActionItem({ 
      actionItemId: actionItem.id, 
      formData 
    });
    
    setFormData({
      closure_text: "",
      media_files: [],
    });
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({ 
        ...prev, 
        media_files: Array.from(e.target.files || []) 
      }));
    }
  };

  const handleClose = () => {
    setFormData({
      closure_text: "",
      media_files: [],
    });
    onOpenChange(false);
  };

  if (!actionItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-green-600" />
            Close Action Item
          </DialogTitle>
          <DialogDescription>
            Provide closure details for: <strong>{actionItem.title}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="closure_text">Closure Description *</Label>
            <Textarea
              id="closure_text"
              value={formData.closure_text}
              onChange={(e) => setFormData(prev => ({ ...prev, closure_text: e.target.value }))}
              placeholder="Describe how this action item was completed, what was done, and any relevant details..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media_files">Supporting Media (Optional)</Label>
            <Input
              id="media_files"
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx"
              multiple
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
            />
            {formData.media_files.length > 0 && (
              <div className="text-sm text-gray-600">
                <Upload className="h-4 w-4 inline mr-1" />
                {formData.media_files.length} file(s) selected
              </div>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">Action Item Details</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Title:</strong> {actionItem.title}</p>
              <p><strong>Target Date:</strong> {new Date(actionItem.target_date).toLocaleDateString()}</p>
              <p><strong>Priority:</strong> {actionItem.priority.toUpperCase()}</p>
              {actionItem.description && (
                <p><strong>Description:</strong> {actionItem.description}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isClosing || !formData.closure_text.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isClosing ? 'Closing...' : 'Close Action Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useDailyWorkData, DailyWorkEntry } from "@/hooks/useDailyWorkData";
import { MessageSquare, Save } from "lucide-react";

interface AdminCommentDialogProps {
  entry: DailyWorkEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AdminCommentDialog = ({ entry, isOpen, onClose }: AdminCommentDialogProps) => {
  const [comment, setComment] = useState(entry?.admin_comments || '');
  const { addAdminComment, isAddingComment } = useDailyWorkData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entry) return;

    addAdminComment({
      id: entry.id,
      admin_comments: comment.trim(),
    });
    
    onClose();
  };

  const handleClose = () => {
    setComment(entry?.admin_comments || '');
    onClose();
  };

  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Admin Comment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">User:</Label>
            <p className="text-sm">{entry.user?.full_name || entry.user?.email}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">Date:</Label>
            <p className="text-sm">{new Date(entry.work_date).toLocaleDateString()}</p>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-600">Work Description:</Label>
            <div className="bg-gray-50 p-3 rounded-md text-sm max-h-32 overflow-y-auto">
              {entry.work_description}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin_comment">Admin Comment</Label>
              <Textarea
                id="admin_comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your comment here..."
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isAddingComment}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isAddingComment ? 'Saving...' : 'Save Comment'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

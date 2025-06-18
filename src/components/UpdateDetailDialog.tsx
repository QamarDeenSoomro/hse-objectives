import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, Camera, User } from "lucide-react";

interface UpdateDetail {
  id: string;
  achieved_count: number;
  update_date: string;
  photos?: string[];
  user: {
    full_name: string;
    email: string;
  };
}

interface UpdateDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  objectiveTitle: string;
  updates: UpdateDetail[];
}

export const UpdateDetailDialog = ({ isOpen, onOpenChange, objectiveTitle, updates }: UpdateDetailDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Updates for: {objectiveTitle}
          </DialogTitle>
          <DialogDescription>
            View all progress updates and photos for this objective.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {updates.length > 0 ? (
            updates.map((update) => (
              <div key={update.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{update.user.full_name || update.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {new Date(update.update_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {update.achieved_count} activities completed
                  </Badge>
                </div>

                {update.photos && update.photos.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Photos ({update.photos.length})</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {update.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Update photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md border"
                          onClick={() => window.open(photo, '_blank')}
                          style={{ cursor: 'pointer' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No updates found for this objective.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
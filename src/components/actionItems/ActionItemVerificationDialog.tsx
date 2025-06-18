import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, CheckCircle, XCircle, Image } from "lucide-react";
import { useActionItems } from "@/hooks/useActionItems";
import { ActionItem, ActionItemVerificationFormData } from "@/types/actionItems";

interface ActionItemVerificationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  actionItem: ActionItem | null;
}

export const ActionItemVerificationDialog = ({
  isOpen,
  onOpenChange,
  actionItem
}: ActionItemVerificationDialogProps) => {
  const { verifyActionItem, isVerifying } = useActionItems();
  
  const [formData, setFormData] = useState<ActionItemVerificationFormData>({
    verification_status: "approved",
    verification_comments: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!actionItem) return;

    verifyActionItem({ 
      actionItemId: actionItem.id, 
      formData 
    });
    
    setFormData({
      verification_status: "approved",
      verification_comments: "",
    });
    onOpenChange(false);
  };

  const handleClose = () => {
    setFormData({
      verification_status: "approved",
      verification_comments: "",
    });
    onOpenChange(false);
  };

  if (!actionItem) return null;

  // Provide fallback values to prevent undefined errors
  const priority = actionItem.priority || 'medium';
  const status = actionItem.status || 'open';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Verify Action Item
          </DialogTitle>
          <DialogDescription>
            Review and verify the completion of: <strong>{actionItem.title}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Action Item Details */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-900 mb-3">Action Item Details</h4>
            <div className="text-sm text-gray-700 space-y-2">
              <p><strong>Title:</strong> {actionItem.title}</p>
              <p><strong>Target Date:</strong> {new Date(actionItem.target_date).toLocaleDateString()}</p>
              <p><strong>Priority:</strong> {priority.toUpperCase()}</p>
              <p><strong>Assigned To:</strong> {actionItem.assigned_user?.full_name || actionItem.assigned_user?.email}</p>
              {actionItem.description && (
                <p><strong>Description:</strong> {actionItem.description}</p>
              )}
            </div>
          </div>

          {/* Closure Details */}
          {actionItem.closure && (
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 mb-3">Closure Details</h4>
              <div className="text-sm text-blue-800 space-y-3">
                <p><strong>Closure Description:</strong></p>
                <div className="bg-white p-3 rounded border">
                  {actionItem.closure.closure_text}
                </div>
                
                <p><strong>Closed By:</strong> {actionItem.closure.closer?.full_name || actionItem.closure.closer?.email}</p>
                <p><strong>Closed On:</strong> {new Date(actionItem.closure.created_at).toLocaleDateString()}</p>
                
                {actionItem.closure.media_urls && actionItem.closure.media_urls.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="h-4 w-4" />
                      <strong>Supporting Media ({actionItem.closure.media_urls.length}):</strong>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {actionItem.closure.media_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Closure media ${index + 1}`}
                          className="w-full h-24 object-cover rounded border cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.open(url, '_blank')}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Label>Verification Decision *</Label>
              <RadioGroup
                value={formData.verification_status}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, verification_status: value }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="approved" id="approved" />
                  <Label htmlFor="approved" className="flex items-center gap-2 cursor-pointer">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Approve
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="rejected" id="rejected" />
                  <Label htmlFor="rejected" className="flex items-center gap-2 cursor-pointer">
                    <XCircle className="h-4 w-4 text-red-600" />
                    Reject
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification_comments">
                Verification Comments {formData.verification_status === 'rejected' && '*'}
              </Label>
              <Textarea
                id="verification_comments"
                value={formData.verification_comments}
                onChange={(e) => setFormData(prev => ({ ...prev, verification_comments: e.target.value }))}
                placeholder={
                  formData.verification_status === 'approved'
                    ? "Optional: Add any comments about the verification..."
                    : "Required: Explain why this action item is being rejected and what needs to be corrected..."
                }
                rows={4}
                required={formData.verification_status === 'rejected'}
              />
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
                disabled={
                  isVerifying || 
                  (formData.verification_status === 'rejected' && !formData.verification_comments.trim())
                }
                className={
                  formData.verification_status === 'approved'
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {isVerifying 
                  ? 'Processing...' 
                  : formData.verification_status === 'approved' 
                    ? 'Approve' 
                    : 'Reject'
                }
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface WhatsAppShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
}

export const WhatsAppShareDialog = ({ isOpen, onOpenChange, message }: WhatsAppShareDialogProps) => {
  const [editedMessage, setEditedMessage] = useState(message);

  const handleSendToWhatsApp = () => {
    const encodedMessage = encodeURIComponent(editedMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    onOpenChange(false);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(editedMessage);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Share Update on WhatsApp
          </DialogTitle>
          <DialogDescription>
            Your update has been saved successfully. You can now share it on WhatsApp.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            rows={8}
            className="resize-none"
          />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyMessage}
            className="w-full sm:w-auto"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Message
          </Button>
          <Button
            type="button"
            onClick={handleSendToWhatsApp}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Send to WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

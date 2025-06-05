
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useDailyWorkData, DailyWorkEntry } from "@/hooks/useDailyWorkData";
import { Calendar, Save, X } from "lucide-react";

interface DailyWorkFormProps {
  editEntry?: DailyWorkEntry | null;
  onCancel?: () => void;
}

export const DailyWorkForm = ({ editEntry, onCancel }: DailyWorkFormProps) => {
  const [workDate, setWorkDate] = useState(
    editEntry?.work_date || new Date().toISOString().split('T')[0]
  );
  const [workDescription, setWorkDescription] = useState(
    editEntry?.work_description || ''
  );

  const { createDailyWork, updateDailyWork, isCreating, isUpdating } = useDailyWorkData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workDescription.trim()) {
      return;
    }

    const formData = {
      work_date: workDate,
      work_description: workDescription.trim(),
    };

    if (editEntry) {
      updateDailyWork({ ...formData, id: editEntry.id });
      onCancel?.();
    } else {
      createDailyWork(formData);
      setWorkDescription('');
      setWorkDate(new Date().toISOString().split('T')[0]);
    }
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-blue-600" />
          {editEntry ? 'Edit Daily Work' : 'Add Daily Work'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="work_date">Date</Label>
            <Input
              id="work_date"
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="work_description">Work Description</Label>
            <Textarea
              id="work_description"
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder="Describe your work activities for the day..."
              className="min-h-[120px] resize-none"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              type="submit" 
              disabled={isSubmitting || !workDescription.trim()}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting 
                ? (editEntry ? 'Updating...' : 'Saving...') 
                : (editEntry ? 'Update' : 'Save')
              }
            </Button>
            
            {editEntry && onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

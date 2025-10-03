import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Papa from "papaparse";
import { ActionItemFormData } from "@/types/actionItems";
import { useToast } from "@/hooks/use-toast";

interface BulkUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (items: ActionItemFormData[]) => void;
  isUploading: boolean;
  users: Array<{ id: string; full_name: string; email: string }>;
}

export const BulkUploadDialog = ({ 
  isOpen, 
  onOpenChange, 
  onUpload, 
  isUploading,
  users 
}: BulkUploadDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const handleDownloadTemplate = () => {
    const template = [
      {
        title: "Example Action Item",
        description: "This is a sample description",
        target_date: "2025-12-31",
        priority: "high",
        assigned_to_email: "user@example.com",
        verifier_email: "verifier@example.com"
      }
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'action_items_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Use this template to format your action items.",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
    }
  };

  const validateAndParseCSV = (results: Papa.ParseResult<any>): ActionItemFormData[] | null => {
    const validationErrors: string[] = [];
    const parsedItems: ActionItemFormData[] = [];

    if (!results.data || results.data.length === 0) {
      validationErrors.push("CSV file is empty");
      setErrors(validationErrors);
      return null;
    }

    results.data.forEach((row: any, index: number) => {
      // Skip empty rows
      if (!row.title && !row.description) return;

      const rowNumber = index + 2; // +2 because index is 0-based and we have a header row

      // Validate required fields
      if (!row.title?.trim()) {
        validationErrors.push(`Row ${rowNumber}: Title is required`);
      }
      if (!row.target_date?.trim()) {
        validationErrors.push(`Row ${rowNumber}: Target date is required`);
      }
      if (!row.assigned_to_email?.trim()) {
        validationErrors.push(`Row ${rowNumber}: Assigned to email is required`);
      }

      // Validate priority
      const priority = row.priority?.toLowerCase();
      if (priority && !['low', 'medium', 'high', 'critical'].includes(priority)) {
        validationErrors.push(`Row ${rowNumber}: Invalid priority. Must be: low, medium, high, or critical`);
      }

      // Find user IDs by email
      const assignedUser = users.find(u => u.email.toLowerCase() === row.assigned_to_email?.toLowerCase().trim());
      const verifierUser = row.verifier_email?.trim() 
        ? users.find(u => u.email.toLowerCase() === row.verifier_email?.toLowerCase().trim())
        : null;

      if (!assignedUser) {
        validationErrors.push(`Row ${rowNumber}: User with email "${row.assigned_to_email}" not found`);
      }

      if (row.verifier_email?.trim() && !verifierUser) {
        validationErrors.push(`Row ${rowNumber}: Verifier with email "${row.verifier_email}" not found`);
      }

      // If no validation errors for this row, add to parsed items
      if (validationErrors.length === 0 || !validationErrors.some(e => e.includes(`Row ${rowNumber}`))) {
        parsedItems.push({
          title: row.title.trim(),
          description: row.description?.trim() || "",
          target_date: row.target_date.trim(),
          priority: (priority || 'medium') as 'low' | 'medium' | 'high' | 'critical',
          assigned_to: assignedUser!.id,
          verifier_id: verifierUser?.id || "",
        });
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return null;
    }

    return parsedItems;
  };

  const handleUpload = () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a CSV file to upload.",
        variant: "destructive",
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedItems = validateAndParseCSV(results);
        if (parsedItems && parsedItems.length > 0) {
          onUpload(parsedItems);
          setFile(null);
          setErrors([]);
        }
      },
      error: (error) => {
        toast({
          title: "Parse Error",
          description: `Failed to parse CSV: ${error.message}`,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Action Items</DialogTitle>
          <DialogDescription>
            Upload multiple action items at once using a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template Button */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Need a template?
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Download the sample CSV file to get started
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="ml-4"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file && (
              <p className="text-sm text-green-600">
                Selected: {file.name}
              </p>
            )}
          </div>

          {/* CSV Format Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>CSV Format Requirements:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>title (required): Action item title</li>
                <li>description: Detailed description</li>
                <li>target_date (required): Format YYYY-MM-DD</li>
                <li>priority: low, medium, high, or critical</li>
                <li>assigned_to_email (required): Email of assigned user</li>
                <li>verifier_email: Email of verifier (optional)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Errors Display */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Please fix the following errors:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 max-h-40 overflow-y-auto">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setFile(null);
              setErrors([]);
            }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DailyWorkForm } from "@/components/DailyWorkForm";
import { AdminCommentDialog } from "@/components/AdminCommentDialog";
import { useDailyWorkData, DailyWorkEntry } from "@/hooks/useDailyWorkData";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Calendar, 
  User, 
  MessageSquare, 
  Edit, 
  Trash2, 
  Clock,
  FileText 
} from "lucide-react";

export const DailyWorkPage = () => {
  const { isAdmin } = useAuth();
  const { dailyWorkEntries, isLoading, deleteDailyWork } = useDailyWorkData();
  const [editingEntry, setEditingEntry] = useState<DailyWorkEntry | null>(null);
  const [commentDialogEntry, setCommentDialogEntry] = useState<DailyWorkEntry | null>(null);

  // Group entries by user for admin view
  const groupedEntries = isAdmin() 
    ? dailyWorkEntries.reduce((acc, entry) => {
        const userName = entry.user?.full_name || entry.user?.email || 'Unknown User';
        if (!acc[userName]) {
          acc[userName] = [];
        }
        acc[userName].push(entry);
        return acc;
      }, {} as Record<string, DailyWorkEntry[]>)
    : { 'My Work': dailyWorkEntries };

  const handleEdit = (entry: DailyWorkEntry) => {
    setEditingEntry(entry);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const handleDelete = (entryId: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteDailyWork(entryId);
    }
  };

  const handleAddComment = (entry: DailyWorkEntry) => {
    setCommentDialogEntry(entry);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {isAdmin() ? "Daily Work Management" : "My Daily Work"}
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            {isAdmin() 
              ? "Review and comment on team daily work entries" 
              : "Track your daily work activities"
            }
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600 text-xs md:text-sm">
          {dailyWorkEntries.length} Entries
        </Badge>
      </div>

      {/* Add/Edit Form - Only show for regular users or when editing */}
      {(!isAdmin() || editingEntry) && (
        <DailyWorkForm 
          editEntry={editingEntry} 
          onCancel={editingEntry ? handleCancelEdit : undefined}
        />
      )}

      {/* Work Entries */}
      <div className="space-y-6">
        {Object.keys(groupedEntries).length > 0 ? (
          Object.entries(groupedEntries).map(([userName, entries]) => (
            <div key={userName} className="space-y-4">
              {isAdmin() && (
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  {userName}
                </h2>
              )}
              
              <div className="grid gap-4">
                {entries.map((entry) => (
                  <Card key={entry.id} className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Calendar className="h-5 w-5 text-green-600" />
                          {new Date(entry.work_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {!isAdmin() && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(entry)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(entry.id)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </Button>
                            </>
                          )}
                          {isAdmin() && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddComment(entry)}
                              className="flex items-center gap-1"
                            >
                              <MessageSquare className="h-3 w-3" />
                              {entry.admin_comments ? 'Edit Comment' : 'Add Comment'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          Work Description
                        </div>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <p className="text-gray-900 whitespace-pre-wrap">{entry.work_description}</p>
                        </div>
                      </div>

                      {entry.admin_comments && (
                        <div className="space-y-2 border-t pt-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MessageSquare className="h-4 w-4" />
                            Admin Comments
                          </div>
                          <div className="bg-blue-50 p-4 rounded-md border-l-4 border-blue-500">
                            <p className="text-gray-900 whitespace-pre-wrap">{entry.admin_comments}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Created: {new Date(entry.created_at).toLocaleString()}
                        </div>
                        {entry.updated_at !== entry.created_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Updated: {new Date(entry.updated_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No daily work entries</h3>
              <p className="text-gray-600">
                {isAdmin() 
                  ? "No team members have added daily work entries yet." 
                  : "Start by adding your first daily work entry above."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Admin Comment Dialog */}
      <AdminCommentDialog
        entry={commentDialogEntry}
        isOpen={!!commentDialogEntry}
        onClose={() => setCommentDialogEntry(null)}
      />
    </div>
  );
};

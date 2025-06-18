import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, CheckSquare, Camera, Eye, Trash2 } from "lucide-react";

interface UpdatesTableProps {
  updates: any[];
  isAdmin: boolean;
  onEdit: (update: any) => void;
  onDelete: (updateId: string) => void;
  onViewObjectiveDetails: (objectiveId: string, objectiveTitle: string) => void;
}

export const UpdatesTable = ({
  updates,
  isAdmin,
  onEdit,
  onDelete,
  onViewObjectiveDetails
}: UpdatesTableProps) => {
  // Helper function to calculate cumulative progress up to a specific update
  const calculateCumulativeProgress = (currentUpdate: any, allUpdates: any[]) => {
    // Get all updates for the same objective up to and including the current update
    const objectiveUpdates = allUpdates
      .filter(update => update.objective_id === currentUpdate.objective_id)
      .sort((a, b) => new Date(a.update_date).getTime() - new Date(b.update_date).getTime());
    
    // Find the index of the current update
    const currentIndex = objectiveUpdates.findIndex(update => update.id === currentUpdate.id);
    
    // Sum all achieved counts up to and including the current update
    const cumulativeCount = objectiveUpdates
      .slice(0, currentIndex + 1)
      .reduce((total, update) => total + (update.achieved_count || 0), 0);
    
    // Calculate cumulative percentage
    const totalActivities = currentUpdate.objective?.num_activities || 1;
    const rawProgress = (cumulativeCount / totalActivities) * 100;
    
    // Apply efficiency from the current update
    const efficiency = currentUpdate.efficiency || 100;
    const effectiveProgress = (rawProgress * efficiency) / 100;
    
    return {
      cumulativeCount,
      rawProgress: Math.round(rawProgress),
      effectiveProgress: Math.round(Math.min(100, effectiveProgress))
    };
  };

  const UpdateCard = ({ update }: { update: any }) => {
    const { cumulativeCount, rawProgress, effectiveProgress } = calculateCumulativeProgress(update, updates);
    
    return (
      <Card className="border border-gray-200">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{update.objective?.title}</h3>
                {isAdmin && (
                  <p className="text-sm text-gray-600">{update.user?.full_name || update.user?.email}</p>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewObjectiveDetails(update.objective_id, update.objective?.title || 'Unknown')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(update)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Update</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this update? This action cannot be undone and will affect the cumulative progress calculation.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDelete(update.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">This Update:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span>{update.achieved_count} activities</span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Cumulative:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span>{cumulativeCount}/{update.objective?.num_activities}</span>
                  <Badge variant="outline">{rawProgress}%</Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Efficiency:</span>
                <div className="mt-1">
                  <Badge 
                    variant={update.efficiency >= 80 ? "default" : update.efficiency >= 60 ? "secondary" : "destructive"}
                  >
                    {update.efficiency || 100}%
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Effective Progress:</span>
                <div className="mt-1">
                  <Badge 
                    variant={effectiveProgress >= 80 ? "default" : "secondary"}
                    className="font-semibold"
                  >
                    {effectiveProgress}%
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Date:</span>
                <span className="text-sm">{new Date(update.update_date).toLocaleDateString()}</span>
              </div>
              {update.photos && update.photos.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  {update.photos.length}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Objective</TableHead>
              {isAdmin && <TableHead>User</TableHead>}
              <TableHead>This Update</TableHead>
              <TableHead>Cumulative</TableHead>
              <TableHead>Efficiency</TableHead>
              <TableHead>Effective Progress</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Photos</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {updates.map((update) => {
              const { cumulativeCount, rawProgress, effectiveProgress } = calculateCumulativeProgress(update, updates);
              
              return (
                <TableRow key={update.id}>
                  <TableCell>
                    <div className="font-medium">{update.objective?.title}</div>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-sm text-gray-600">
                      {update.user?.full_name || update.user?.email}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        +{update.achieved_count} activities
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {cumulativeCount}/{update.objective?.num_activities}
                      </span>
                      <Badge variant="outline">
                        {rawProgress}%
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={update.efficiency >= 80 ? "default" : update.efficiency >= 60 ? "secondary" : "destructive"}
                    >
                      {update.efficiency || 100}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={effectiveProgress >= 80 ? "default" : "secondary"}
                      className="font-semibold"
                    >
                      {effectiveProgress}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(update.update_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {update.photos && update.photos.length > 0 ? (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        {update.photos.length}
                      </Badge>
                    ) : (
                      <span className="text-gray-400">No photos</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewObjectiveDetails(update.objective_id, update.objective?.title || 'Unknown')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(update)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Update</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this update? This action cannot be undone and will affect the cumulative progress calculation.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => onDelete(update.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {updates.map((update) => (
          <UpdateCard key={update.id} update={update} />
        ))}
      </div>
    </>
  );
};
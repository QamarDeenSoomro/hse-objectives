import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, CheckSquare, Camera, Eye, Trash2, ExternalLink } from "lucide-react";

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
      <Card className="border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg mb-1 line-clamp-2">
                  {update.objective?.title}
                </h3>
                {isAdmin && (
                  <p className="text-sm text-gray-600 mb-2">
                    {update.user?.full_name || update.user?.email}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{new Date(update.update_date).toLocaleDateString()}</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 flex-shrink-0">
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewObjectiveDetails(update.objective_id, update.objective?.title || 'Unknown')}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1">View</span>
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(update)}
                      className="text-xs"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline ml-1">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 text-xs"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline ml-1">Delete</span>
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
            
            {/* Progress Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <span className="text-xs font-medium text-blue-700 block mb-1">This Update</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-900">+{update.achieved_count}</span>
                  <span className="text-xs text-blue-600">activities</span>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg">
                <span className="text-xs font-medium text-green-700 block mb-1">Cumulative</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-green-900">
                    {cumulativeCount}/{update.objective?.num_activities}
                  </span>
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                    {rawProgress}%
                  </Badge>
                </div>
              </div>
              
              <div className="bg-orange-50 p-3 rounded-lg">
                <span className="text-xs font-medium text-orange-700 block mb-1">Efficiency</span>
                <div className="mt-1">
                  <Badge 
                    variant={update.efficiency >= 80 ? "default" : update.efficiency >= 60 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {update.efficiency || 100}%
                  </Badge>
                </div>
              </div>
              
              <div className="bg-purple-50 p-3 rounded-lg">
                <span className="text-xs font-medium text-purple-700 block mb-1">Effective Progress</span>
                <div className="mt-1">
                  <Badge 
                    variant={effectiveProgress >= 80 ? "default" : "secondary"}
                    className="font-semibold text-xs bg-purple-600 text-white"
                  >
                    {effectiveProgress}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Photos Section - Inline Display */}
            {update.photos && update.photos.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Photos ({update.photos.length})
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {update.photos.map((photo: string, index: number) => (
                    <div key={index} className="relative group">
                      <img
                        src={photo}
                        alt={`Update photo ${index + 1}`}
                        className="w-full h-24 sm:h-28 object-cover rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => window.open(photo, '_blank')}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <ExternalLink className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          {update.photos.length}
                        </Badge>
                        <div className="flex gap-1">
                          {update.photos.slice(0, 2).map((photo: string, index: number) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              className="w-8 h-8 object-cover rounded border cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => window.open(photo, '_blank')}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ))}
                          {update.photos.length > 2 && (
                            <div className="w-8 h-8 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-600">
                              +{update.photos.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
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
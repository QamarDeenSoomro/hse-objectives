
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Target } from "lucide-react";
import { UpdatesTable } from "./UpdatesTable";

interface TeamUpdatesViewProps {
  groupedTeamUpdates: Record<string, Record<string, any[]>>;
  isAdmin: boolean;
  onEdit: (update: any) => void;
  onDelete: (updateId: string) => void;
  onViewObjectiveDetails: (objectiveId: string, objectiveTitle: string) => void;
}

export const TeamUpdatesView = ({
  groupedTeamUpdates,
  isAdmin,
  onEdit,
  onDelete,
  onViewObjectiveDetails
}: TeamUpdatesViewProps) => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-green-600" />
          Team Updates
        </CardTitle>
        <CardDescription>
          Updates from all team members organized by user and objective
        </CardDescription>
      </CardHeader>
      <CardContent>
        {Object.keys(groupedTeamUpdates).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(groupedTeamUpdates).map(([userName, userObjectives]) => (
              <div key={userName} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">{userName}</h3>
                </div>
                
                <div className="space-y-6 ml-6">
                  {Object.entries(userObjectives).map(([objectiveTitle, objectiveUpdates]) => (
                    <div key={objectiveTitle} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-600" />
                        <h4 className="font-medium text-gray-700">{objectiveTitle}</h4>
                        <Badge variant="outline" className="text-xs">
                          {objectiveUpdates.length} update{objectiveUpdates.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      
                      <div className="ml-6">
                        <UpdatesTable
                          updates={objectiveUpdates}
                          isAdmin={isAdmin}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onViewObjectiveDetails={onViewObjectiveDetails}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8 text-sm">
            No updates found. Team members can add updates for their objectives.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

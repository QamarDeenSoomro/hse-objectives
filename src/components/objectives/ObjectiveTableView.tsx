import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Eye, Edit, Trash2 } from "lucide-react";
import { Objective } from "@/types/objectives";
import { calculatePlannedProgress, getQuarterInfo } from "@/utils/objectives";

interface ObjectiveTableViewProps {
  objectives: Objective[];
  objectiveProgress: Record<string, number>;
  isAdmin: boolean;
  onEdit: (objective: Objective) => void;
  onDelete: (id: string) => void;
  onViewUpdates: (objectiveId: string, objectiveTitle: string) => void;
}

export const ObjectiveTableView = ({
  objectives,
  objectiveProgress,
  isAdmin,
  onEdit,
  onDelete,
  onViewUpdates
}: ObjectiveTableViewProps) => {
  return (
    <div className="hidden lg:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            {isAdmin && <TableHead>Owner</TableHead>}
            <TableHead>Weightage</TableHead>
            <TableHead>Activities</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Planned</TableHead>
            <TableHead>Target Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objectives.map((objective) => {
            const progress = objectiveProgress[objective.id] || 0;
            const plannedProgress = calculatePlannedProgress(objective.target_completion_date);
            const quarterInfo = getQuarterInfo(objective.target_completion_date);
            return (
              <TableRow key={objective.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{objective.title}</div>
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {objective.description}
                    </div>
                  </div>
                </TableCell>
                {isAdmin && (
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{objective.owner?.full_name || objective.owner?.email}</div>
                      <div className="text-gray-600">{objective.owner?.email}</div>
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    {objective.weightage}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {objective.num_activities} activities
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={progress >= 80 ? "default" : "secondary"}
                    className={progress >= 80 ? "bg-green-100 text-green-800" : progress >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}
                  >
                    {progress}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={plannedProgress > progress ? "text-red-600 border-red-600" : "text-green-600 border-green-600"}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {plannedProgress}%
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-purple-600 border-purple-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    {quarterInfo.quarter} {quarterInfo.year}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewUpdates(objective.id, objective.title)}
                      title="View updates for this objective"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(objective)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => onDelete(objective.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
  );
};
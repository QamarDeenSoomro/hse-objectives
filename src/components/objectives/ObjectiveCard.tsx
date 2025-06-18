import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Eye, Edit, Trash2 } from "lucide-react";
import { Objective } from "@/types/objectives";
import { ProfessionalProgressBar } from "./ProfessionalProgressBar";
import { calculatePlannedProgress, getQuarterInfo } from "@/utils/objectives";

interface ObjectiveCardProps {
  objective: Objective;
  progress: number;
  isAdmin: boolean;
  onEdit: (objective: Objective) => void;
  onDelete: (id: string) => void;
  onViewUpdates: (objectiveId: string, objectiveTitle: string) => void;
}

export const ObjectiveCard = ({ 
  objective, 
  progress, 
  isAdmin, 
  onEdit, 
  onDelete, 
  onViewUpdates 
}: ObjectiveCardProps) => {
  const plannedProgress = calculatePlannedProgress(objective.target_completion_date);
  const quarterInfo = getQuarterInfo(objective.target_completion_date);
  
  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{objective.title}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{objective.description}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
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
          </div>
          
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              {objective.weightage}% Weight
            </Badge>
            <Badge variant="secondary">
              {objective.num_activities} activities
            </Badge>
            <Badge 
              variant={progress >= 80 ? "default" : progress >= 50 ? "secondary" : "outline"}
              className={progress >= 80 ? "bg-green-100 text-green-800" : progress >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}
            >
              {progress}% Achieved
            </Badge>
            <Badge variant="outline" className="text-purple-600 border-purple-600">
              <Calendar className="h-3 w-3 mr-1" />
              {quarterInfo.quarter} {quarterInfo.year}
            </Badge>
          </div>

          <div className="space-y-3">
            <ProfessionalProgressBar 
              planned={plannedProgress} 
              actual={progress} 
              showLabels={true}
            />
            
            {plannedProgress !== progress && (
              <div className="text-xs text-center">
                {progress > plannedProgress ? (
                  <span className="text-emerald-600 font-medium">✓ Ahead of schedule</span>
                ) : (
                  <span className="text-red-600 font-medium">⚠ Behind schedule</span>
                )}
              </div>
            )}
          </div>
          
          {isAdmin && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>{objective.owner?.full_name || objective.owner?.email}</div>
              <div>{objective.creator?.full_name || objective.creator?.email}</div>
              <div>{new Date(objective.created_at).toLocaleDateString()}</div>
            </div>
          )}
          
          {!isAdmin && (
            <div className="text-xs text-gray-500 space-y-1">
              <div>{objective.creator?.full_name || objective.creator?.email}</div>
              <div>{new Date(objective.created_at).toLocaleDateString()}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
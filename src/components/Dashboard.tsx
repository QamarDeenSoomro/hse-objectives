import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Users, CheckSquare, TrendingUp, User } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useNavigate } from "react-router-dom";

interface DashboardProps {
  onNavigateToObjectives?: () => void;
}

// Custom Progress Bar Component with Website Gradient Colors
const CustomProgressBar = ({ planned, actual, className = "" }: { planned: number, actual: number, className?: string }) => {
  return (
    <div className={`relative w-full h-2 bg-gray-200 rounded-full overflow-hidden ${className}`}>
      {/* Planned Progress (Blue-Green Gradient) */}
      <div 
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-green-600 transition-all duration-300"
        style={{ width: `${Math.min(planned, 100)}%` }}
      />
      {/* Actual Progress (Amber/Yellow) */}
      <div 
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-300"
        style={{ width: `${Math.min(actual, 100)}%` }}
      />
    </div>
  );
};

export const Dashboard = ({ onNavigateToObjectives }: DashboardProps) => {
  const { stats, teamData, groupedObjectiveStatuses, isLoading, isAdmin } = useDashboardData();
  const navigate = useNavigate();

  const handleTeamMemberClick = (memberId: string) => {
    navigate(`/objectives?userId=${memberId}`);
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
            {isAdmin ? "Admin Dashboard" : "My Dashboard"}
          </h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            {isAdmin 
              ? "Overview of HSE objectives and team performance" 
              : "Your HSE objectives and progress"
            }
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600 text-xs md:text-sm">
          System Active
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card 
          className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-xl transition-shadow"
          onClick={onNavigateToObjectives}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? "Total Objectives" : "My Objectives"}
            </CardTitle>
            <Target className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalObjectives}</div>
            <p className="text-xs text-blue-100">Active objectives</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.averageCompletion}%</div>
            <p className="text-xs text-green-100">
              {isAdmin ? "Team average (effective)" : "My average (effective)"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities Done</CardTitle>
            <CheckSquare className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalActivities}</div>
            <p className="text-xs text-purple-100">of {stats.plannedActivities} planned</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isAdmin ? "Avg Planned" : "My Planned"}
            </CardTitle>
            {isAdmin ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.averagePlannedProgress}%</div>
            <p className="text-xs text-orange-100">
              {isAdmin ? "Team planned progress" : "My planned progress"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Team Performance / User Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              {isAdmin ? <Users className="h-5 w-5 text-blue-600" /> : <User className="h-5 w-5 text-blue-600" />}
              {isAdmin ? "Team Performance" : "My Performance"}
            </CardTitle>
            <CardDescription className="text-sm">
              {isAdmin 
                ? "Individual objectives average completion rates (click to view details)" 
                : "Your objectives average completion rates"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamData.length > 0 ? (
                teamData.map((member, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span 
                        className={`font-medium text-gray-900 text-sm md:text-base truncate ${
                          isAdmin ? 'cursor-pointer hover:text-blue-600 hover:underline' : ''
                        }`}
                        onClick={isAdmin ? () => handleTeamMemberClick(member.id) : undefined}
                        title={isAdmin ? `Click to view ${member.name}'s objectives` : undefined}
                      >
                        {member.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs md:text-sm text-gray-600">
                          {member.activities} effective activities
                        </span>
                        <Badge variant={member.completion >= 80 ? "default" : "secondary"} className="text-xs">
                          {member.completion}%
                        </Badge>
                      </div>
                    </div>
                    <CustomProgressBar planned={member.plannedProgress} actual={member.completion} />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Last update: {new Date(member.lastUpdate).toLocaleDateString()}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-sm"></div>
                          <span>Planned ({member.plannedProgress}%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-2 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-sm"></div>
                          <span>Achieved ({member.completion}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4 text-sm">
                  {isAdmin 
                    ? "No team members found. Create users in the admin panel." 
                    : "No performance data available yet."
                  }
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Objectives Status */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Target className="h-5 w-5 text-green-600" />
              {isAdmin ? "All Objectives Status" : "My Objectives Status"}
            </CardTitle>
            <CardDescription className="text-sm">
              Current effective progress on {isAdmin ? "all" : "your"} objectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.keys(groupedObjectiveStatuses).length > 0 ? (
                Object.entries(groupedObjectiveStatuses).map(([ownerName, objectives]) => (
                  <div key={ownerName} className="space-y-3">
                    <h3 className="text-md font-semibold text-gray-800">{ownerName}</h3>
                    {objectives.map((objective) => (
                      <div key={objective.id} className="space-y-2 pl-2 border-l-2 border-gray-200">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-900 text-sm md:text-base block truncate">
                                {objective.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs md:text-sm text-gray-600">
                                Weight: {objective.weightage}%
                              </span>
                              <Badge variant={objective.completion >= 80 ? "default" : "secondary"} className="text-xs">
                                {objective.completion}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <CustomProgressBar planned={objective.plannedProgress} actual={objective.completion} />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-sm"></div>
                              <span>Planned ({objective.plannedProgress}%)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-2 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-sm"></div>
                              <span>Achieved ({objective.completion}%)</span>
                            </div>
                          </div>
                          {objective.plannedProgress !== objective.completion && (
                            <span className={`font-medium ${objective.completion > objective.plannedProgress ? 'text-emerald-600' : 'text-red-600'}`}>
                              {objective.completion > objective.plannedProgress ? `+${objective.completion - objective.plannedProgress}%` : `${objective.completion - objective.plannedProgress}%`}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4 text-sm">
                  {isAdmin 
                    ? "No objectives found. Create objectives in the admin panel." 
                    : "No objectives assigned to you yet."
                  }
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
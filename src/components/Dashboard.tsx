
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Users, CheckSquare, TrendingUp, User } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

export const Dashboard = () => {
  const { stats, teamData, groupedObjectiveStatuses, isLoading, isAdmin } = useDashboardData();

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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
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
              {isAdmin ? "Team average" : "My average"}
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
              {isAdmin ? "Team Members" : "My Progress"}
            </CardTitle>
            {isAdmin ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {isAdmin ? teamData.length : `${stats.averageCompletion}%`}
            </div>
            <p className="text-xs text-orange-100">
              {isAdmin ? "Active users" : "Overall progress"}
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
                ? "Individual completion rates and activity counts" 
                : "Your completion rates and activity counts"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamData.length > 0 ? (
                teamData.map((member, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-medium text-gray-900 text-sm md:text-base truncate">
                        {member.name}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs md:text-sm text-gray-600">
                          {member.activities} activities
                        </span>
                        <Badge variant={member.completion >= 80 ? "default" : "secondary"} className="text-xs">
                          {member.completion}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={member.completion} className="h-2" />
                    <div className="text-xs text-gray-500">
                      Last update: {new Date(member.lastUpdate).toLocaleDateString()}
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
              Current progress on {isAdmin ? "all" : "your"} objectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6"> {/* Increased spacing for groups */}
              {Object.keys(groupedObjectiveStatuses).length > 0 ? (
                Object.entries(groupedObjectiveStatuses).map(([ownerName, objectives]) => (
                  <div key={ownerName} className="space-y-3">
                    <h3 className="text-md font-semibold text-gray-800">{ownerName}</h3> {/* Owner heading */}
                    {objectives.map((objective) => (
                      <div key={objective.id} className="space-y-2 pl-2 border-l-2 border-gray-200"> {/* Indent objectives under owner, use objective.id */}
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-gray-900 text-sm md:text-base block truncate">
                                {objective.title}
                              </span>
                              {/* Owner name is now a group heading, no need to repeat if isAdmin */}
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
                        <Progress value={objective.completion} className="h-2" />
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

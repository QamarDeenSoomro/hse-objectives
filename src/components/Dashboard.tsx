
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Users, CheckSquare, TrendingUp } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";

export const Dashboard = () => {
  const { stats, teamData, objectiveStatuses, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of HSE objectives and team performance</p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          System Active
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Objectives</CardTitle>
            <Target className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalObjectives}</div>
            <p className="text-xs text-blue-100">Active objectives</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageCompletion}%</div>
            <p className="text-xs text-green-100">Team average</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities Done</CardTitle>
            <CheckSquare className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
            <p className="text-xs text-purple-100">of {stats.plannedActivities} planned</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.length}</div>
            <p className="text-xs text-orange-100">Active users</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Team Performance
            </CardTitle>
            <CardDescription>Individual completion rates and activity counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamData.length > 0 ? (
                teamData.map((member, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{member.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{member.activities} activities</span>
                        <Badge variant={member.completion >= 80 ? "default" : "secondary"}>
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
                <div className="text-center text-gray-500 py-4">
                  No team members found. Create users in the admin panel.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Objectives */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Objectives Status
            </CardTitle>
            <CardDescription>Current progress on key objectives</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {objectiveStatuses.length > 0 ? (
                objectiveStatuses.map((objective, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{objective.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Weight: {objective.weightage}%</span>
                        <Badge variant={objective.completion >= 80 ? "default" : "secondary"}>
                          {objective.completion}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={objective.completion} className="h-2" />
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No objectives found. Create objectives in the admin panel.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

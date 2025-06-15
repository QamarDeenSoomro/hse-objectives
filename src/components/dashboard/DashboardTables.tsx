
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Activity, BarChart3 } from "lucide-react";

interface DashboardTablesProps {
  data: {
    objectives: any[];
    progress: any[];
    teamPerformance: any[];
    dailyWork: any[];
    activities: any[];
  };
}

export const DashboardTables = ({ data }: DashboardTablesProps) => {
  const getCompletionBadge = (completion: number) => {
    if (completion >= 80) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (completion >= 50) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (efficiency >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (efficiency >= 40) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Objectives Summary Table */}
      {data.objectives.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Objectives Summary
            </CardTitle>
            <CardDescription>
              Overview of all objectives and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Objective</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Weightage</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.objectives.slice(0, 10).map((obj, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {obj.title || 'Untitled Objective'}
                    </TableCell>
                    <TableCell>{obj.ownerName || 'Unassigned'}</TableCell>
                    <TableCell>{obj.completion || 0}%</TableCell>
                    <TableCell>{obj.weightage || 0}%</TableCell>
                    <TableCell>{getCompletionBadge(obj.completion || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Team Performance Table */}
      {data.teamPerformance.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Team Performance
            </CardTitle>
            <CardDescription>
              Individual team member performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Member</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.teamPerformance.map((member, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {member.teamMember || 'Unknown'}
                    </TableCell>
                    <TableCell>{member.completedObjectives || 0}</TableCell>
                    <TableCell>{member.pendingObjectives || 0}</TableCell>
                    <TableCell>{member.efficiency || 0}%</TableCell>
                    <TableCell>
                      {member.lastActivity 
                        ? new Date(member.lastActivity).toLocaleDateString()
                        : 'No activity'
                      }
                    </TableCell>
                    <TableCell>{getEfficiencyBadge(member.efficiency || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Progress Updates */}
      {data.progress.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Recent Progress Updates
            </CardTitle>
            <CardDescription>
              Latest activity and progress updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.progress.slice(0, 15).map((update, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {update.date 
                        ? new Date(update.date).toLocaleDateString()
                        : 'No date'
                      }
                    </TableCell>
                    <TableCell>{update.user || 'Unknown'}</TableCell>
                    <TableCell className="font-medium">
                      {update.activity || 'No activity'}
                    </TableCell>
                    <TableCell>{update.completion || 0}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {update.notes || 'No notes'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Daily Work Summary */}
      {data.dailyWork.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Daily Work Summary
            </CardTitle>
            <CardDescription>
              Recent daily work log entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Work Description</TableHead>
                  <TableHead>Admin Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.dailyWork.slice(0, 10).map((work, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {work.date 
                        ? new Date(work.date).toLocaleDateString()
                        : 'No date'
                      }
                    </TableCell>
                    <TableCell>{work.user || 'Unknown'}</TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={work.work_description}>
                        {work.work_description || 'No description'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {work.admin_comments || 'No comments'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

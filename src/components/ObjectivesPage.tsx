import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UpdateDetailDialog } from "@/components/UpdateDetailDialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Target, Eye, ArrowLeft, Calendar, Clock, ChevronDown, ChevronRight, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";

interface Objective {
  id: string;
  title: string;
  description: string;
  weightage: number;
  num_activities: number;
  owner_id: string;
  created_by: string;
  created_at: string;
  target_completion_date: string;
  owner?: {
    full_name: string;
    email: string;
  };
  creator?: {
    full_name: string;
    email: string;
  };
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
}

interface ObjectiveUpdate {
  id: string;
  objective_id: string;
  user_id: string;
  achieved_count: number;
  update_date: string;
  efficiency: number;
  photos: string[] | null;
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

// Helper function to get quarter info from date
const getQuarterInfo = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const year = date.getFullYear();
  
  if (month <= 3) return { quarter: 'Q1', year };
  if (month <= 6) return { quarter: 'Q2', year };
  if (month <= 9) return { quarter: 'Q3', year };
  return { quarter: 'Q4', year };
};

// Helper function to get date from quarter
const getDateFromQuarter = (quarter: string, year: number = 2025) => {
  switch (quarter) {
    case 'Q1': return `${year}-03-31`;
    case 'Q2': return `${year}-06-30`;
    case 'Q3': return `${year}-09-30`;
    case 'Q4': return `${year}-12-31`;
    default: return `${year}-12-31`;
  }
};

// Helper function to calculate planned progress based on time elapsed
const calculatePlannedProgress = (targetDate: string) => {
  const startDate = new Date('2025-01-01');
  const endDate = new Date(targetDate);
  const currentDate = new Date();
  
  // If current date is before start date, planned progress is 0
  if (currentDate < startDate) return 0;
  
  // If current date is after end date, planned progress is 100
  if (currentDate > endDate) return 100;
  
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsedDuration = currentDate.getTime() - startDate.getTime();
  
  const plannedProgress = (elapsedDuration / totalDuration) * 100;
  return Math.round(Math.max(0, Math.min(100, plannedProgress)));
};

// Helper function to calculate cumulative progress for an objective
const calculateCumulativeProgress = async (objectiveId: string, numActivities: number) => {
  try {
    const { data: updates, error } = await supabase
      .from('objective_updates')
      .select('achieved_count, efficiency, update_date')
      .eq('objective_id', objectiveId)
      .order('update_date', { ascending: true });

    if (error) throw error;

    if (!updates || updates.length === 0) return 0;
    
    // Sum all achieved counts to get total cumulative count
    const totalAchievedCount = updates.reduce((total, update) => total + (update.achieved_count || 0), 0);
    
    // Calculate raw progress percentage
    const rawProgress = (totalAchievedCount / numActivities) * 100;
    
    // Apply efficiency from the latest update (or 100% if no efficiency set)
    const latestUpdate = updates[updates.length - 1];
    const efficiency = latestUpdate?.efficiency || 100;
    const effectiveProgress = (rawProgress * efficiency) / 100;
    
    return Math.round(Math.min(100, effectiveProgress));
  } catch (error) {
    console.error('Error calculating cumulative progress:', error);
    return 0;
  }
};

// Professional Progress Bar Component with Swapped Colors
const ProfessionalProgressBar = ({ 
  planned, 
  actual, 
  className = "",
  showLabels = false 
}: { 
  planned: number; 
  actual: number; 
  className?: string;
  showLabels?: boolean;
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
        {/* Planned Progress (Amber/Yellow Gradient) - Now for planned */}
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-500"
          style={{ width: `${Math.min(planned, 100)}%` }}
        />
        {/* Actual Progress (Blue-Green Gradient) - Now for actual */}
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-green-600 transition-all duration-500"
          style={{ width: `${Math.min(actual, 100)}%` }}
        />
      </div>
      
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-sm border border-amber-500"></div>
              <span className="text-gray-600">Planned ({planned}%)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 bg-gradient-to-r from-blue-600 to-green-600 rounded-sm border border-blue-700"></div>
              <span className="text-gray-600">Achieved ({actual}%)</span>
            </div>
          </div>
          {planned !== actual && (
            <span className={`font-medium ${actual > planned ? 'text-emerald-600' : 'text-red-600'}`}>
              {actual > planned ? `+${actual - planned}%` : `${actual - planned}%`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export const ObjectivesPage = () => {
  const { isAdmin, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedObjectiveUpdates, setSelectedObjectiveUpdates] = useState<any[]>([]);
  const [selectedObjectiveTitle, setSelectedObjectiveTitle] = useState("");
  const [objectiveProgress, setObjectiveProgress] = useState<Record<string, number>>({});
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());
  const [objectiveUpdates, setObjectiveUpdates] = useState<Record<string, ObjectiveUpdate[]>>({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    weightage: "",
    numActivities: "",
    ownerId: "",
    targetQuarter: "Q4",
  });

  // Get userId from URL parameters for filtering
  const userIdFromUrl = searchParams.get('userId');
  const [filteredUser, setFilteredUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Only fetch objectives if:
    // 1. User is admin (can fetch all objectives), OR
    // 2. User is not admin AND profile is loaded (needed for filtering by profile.id)
    if (isAdmin() || (!isAdmin() && profile?.id)) {
      fetchObjectives();
    }
    
    if (isAdmin()) {
      fetchUsers();
    }
  }, [isAdmin, profile, userIdFromUrl]);

  useEffect(() => {
    // Find the filtered user details when userIdFromUrl changes
    if (userIdFromUrl && users.length > 0) {
      const user = users.find(u => u.id === userIdFromUrl);
      setFilteredUser(user || null);
    } else {
      setFilteredUser(null);
    }
  }, [userIdFromUrl, users]);

  const fetchObjectives = async () => {
    try {
      let query = supabase
        .from('objectives')
        .select(`
          *,
          owner:profiles!objectives_owner_id_fkey(full_name, email),
          creator:profiles!objectives_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      // Apply filtering based on user role and URL parameters
      if (isAdmin()) {
        // Admin can view all objectives or filter by specific user
        if (userIdFromUrl) {
          query = query.eq('owner_id', userIdFromUrl);
        }
      } else {
        // Non-admin users can only see their own objectives
        if (profile && profile.id) {
          query = query.eq('owner_id', profile.id);
        } else {
          console.error("Error: Non-admin user profile or profile ID is missing. Cannot fetch objectives.");
          setObjectives([]);
          setLoading(false);
          toast({
            title: "Error",
            description: "User profile not found. Cannot fetch objectives.",
            variant: "destructive",
          });
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setObjectives(data || []);
      
      // Fetch progress for each objective using cumulative calculation
      if (data) {
        await fetchObjectiveProgress(data);
      }
    } catch (error) {
      console.error('Error fetching objectives:', error);
      toast({
        title: "Error",
        description: "Failed to fetch objectives",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchObjectiveProgress = async (objectives: Objective[]) => {
    const progressMap: Record<string, number> = {};
    
    for (const objective of objectives) {
      try {
        const progress = await calculateCumulativeProgress(objective.id, objective.num_activities);
        progressMap[objective.id] = progress;
      } catch (error) {
        console.error(`Error fetching progress for objective ${objective.id}:`, error);
        progressMap[objective.id] = 0;
      }
    }
    
    setObjectiveProgress(progressMap);
  };

  const fetchObjectiveUpdates = async (objectiveId: string) => {
    try {
      const { data, error } = await supabase
        .from('objective_updates')
        .select(`
          *,
          user:profiles!user_id(full_name, email)
        `)
        .eq('objective_id', objectiveId)
        .order('update_date', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedUpdates = data.map(update => ({
        ...update,
        user: {
          full_name: update.user?.full_name || '',
          email: update.user?.email || ''
        }
      })) as ObjectiveUpdate[];

      setObjectiveUpdates(prev => ({
        ...prev,
        [objectiveId]: transformedUpdates
      }));
    } catch (error) {
      console.error('Error fetching objective updates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch objective updates",
        variant: "destructive",
      });
    }
  };

  const toggleObjectiveExpansion = async (objectiveId: string) => {
    const newExpanded = new Set(expandedObjectives);
    
    if (newExpanded.has(objectiveId)) {
      newExpanded.delete(objectiveId);
    } else {
      newExpanded.add(objectiveId);
      // Fetch updates if not already loaded
      if (!objectiveUpdates[objectiveId]) {
        await fetchObjectiveUpdates(objectiveId);
      }
    }
    
    setExpandedObjectives(newExpanded);
  };

  const calculateCumulativeProgressForUpdate = (updates: ObjectiveUpdate[], currentUpdateIndex: number, numActivities: number) => {
    // Sort updates by date to ensure proper cumulative calculation
    const sortedUpdates = [...updates].sort((a, b) => new Date(a.update_date).getTime() - new Date(b.update_date).getTime());
    
    // Find the current update in the sorted array
    const currentUpdate = updates[currentUpdateIndex];
    const sortedIndex = sortedUpdates.findIndex(u => u.id === currentUpdate.id);
    
    // Sum all achieved counts up to and including the current update
    const cumulativeCount = sortedUpdates
      .slice(0, sortedIndex + 1)
      .reduce((total, update) => total + (update.achieved_count || 0), 0);
    
    // Calculate cumulative percentage
    const rawProgress = (cumulativeCount / numActivities) * 100;
    
    // Apply efficiency from the current update
    const efficiency = currentUpdate.efficiency || 100;
    const effectiveProgress = (rawProgress * efficiency) / 100;
    
    return {
      cumulativeCount,
      rawProgress: Math.round(rawProgress),
      effectiveProgress: Math.round(Math.min(100, effectiveProgress))
    };
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleViewUpdates = async (objectiveId: string, objectiveTitle: string) => {
    try {
      const { data, error } = await supabase
        .from('objective_updates')
        .select(`
          *,
          user:profiles!user_id(full_name, email)
        `)
        .eq('objective_id', objectiveId)
        .order('update_date', { ascending: false });

      if (error) throw error;

      // Transform the data to match UpdateDetailDialog expectations
      const transformedUpdates = data.map(update => ({
        ...update,
        user: {
          full_name: update.user?.full_name || '',
          email: update.user?.email || ''
        }
      }));

      setSelectedObjectiveUpdates(transformedUpdates);
      setSelectedObjectiveTitle(objectiveTitle);
      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error('Error fetching objective updates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch objective updates",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.weightage || !formData.numActivities) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (isAdmin() && !formData.ownerId) {
      toast({
        title: "Error",
        description: "Please select an owner for the objective",
        variant: "destructive",
      });
      return;
    }

    try {
      const targetDate = getDateFromQuarter(formData.targetQuarter, 2025);
      
      const objectiveData = {
        title: formData.title,
        description: formData.description,
        weightage: parseFloat(formData.weightage),
        num_activities: parseInt(formData.numActivities),
        owner_id: isAdmin() ? formData.ownerId : profile?.id,
        created_by: profile?.id,
        target_completion_date: targetDate,
      };

      if (editingObjective) {
        const { error } = await supabase
          .from('objectives')
          .update(objectiveData)
          .eq('id', editingObjective.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Objective updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('objectives')
          .insert([objectiveData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Objective created successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingObjective(null);
      setFormData({ title: "", description: "", weightage: "", numActivities: "", ownerId: "", targetQuarter: "Q4" });
      fetchObjectives();
    } catch (error) {
      console.error('Error saving objective:', error);
      toast({
        title: "Error",
        description: "Failed to save objective",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (objective: Objective) => {
    setEditingObjective(objective);
    const quarterInfo = getQuarterInfo(objective.target_completion_date);
    setFormData({
      title: objective.title,
      description: objective.description,
      weightage: objective.weightage.toString(),
      numActivities: objective.num_activities.toString(),
      ownerId: objective.owner_id,
      targetQuarter: quarterInfo.quarter,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('objectives')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Objective deleted successfully",
      });
      fetchObjectives();
    } catch (error) {
      console.error('Error deleting objective:', error);
      toast({
        title: "Error",
        description: "Failed to delete objective",
        variant: "destructive",
      });
    }
  };

  const handleAddNew = () => {
    setEditingObjective(null);
    setFormData({ title: "", description: "", weightage: "", numActivities: "", ownerId: "", targetQuarter: "Q4" });
    setIsDialogOpen(true);
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  const ObjectiveCard = ({ objective }: { objective: Objective }) => {
    const progress = objectiveProgress[objective.id] || 0;
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
                  onClick={() => handleViewUpdates(objective.id, objective.title)}
                  title="View updates for this objective"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {isAdmin() && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(objective)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(objective.id)}
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

            {/* Professional Progress Bar */}
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
            
            {isAdmin() && (
              <div className="text-xs text-gray-500 space-y-1">
                <div>{objective.owner?.full_name || objective.owner?.email}</div>
                <div>{objective.creator?.full_name || objective.creator?.email}</div>
                <div>{new Date(objective.created_at).toLocaleDateString()}</div>
              </div>
            )}
            
            {!isAdmin() && (
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {userIdFromUrl && isAdmin() && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 self-start"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {userIdFromUrl && filteredUser 
                  ? `${filteredUser.full_name || filteredUser.email}'s Objectives`
                  : "Objectives Management"
                }
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                {userIdFromUrl && filteredUser
                  ? `Viewing objectives assigned to ${filteredUser.full_name || filteredUser.email}`
                  : "Manage HSE objectives and track cumulative progress."
                }
              </p>
            </div>
          </div>
          {isAdmin() && objectives.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Total objectives {userIdFromUrl ? 'for this user' : 'being managed'}: <Badge variant="secondary">{objectives.length}</Badge>
            </p>
          )}
        </div>
        {isAdmin() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleAddNew}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Objective
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  {editingObjective ? "Edit Objective" : "Add New Objective"}
                </DialogTitle>
                <DialogDescription>
                  {editingObjective ? "Update the objective details" : "Create a new HSE objective"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter objective title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter objective description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weightage">Weightage (%)</Label>
                    <Input
                      id="weightage"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.weightage}
                      onChange={(e) => setFormData(prev => ({ ...prev, weightage: e.target.value }))}
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numActivities">Number of Activities</Label>
                    <Input
                      id="numActivities"
                      type="number"
                      min="1"
                      value={formData.numActivities}
                      onChange={(e) => setFormData(prev => ({ ...prev, numActivities: e.target.value }))}
                      placeholder="8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetQuarter">Target Completion Quarter</Label>
                  <Select 
                    value={formData.targetQuarter} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, targetQuarter: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target quarter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Q1">Q1 2025 (March 31, 2025)</SelectItem>
                      <SelectItem value="Q2">Q2 2025 (June 30, 2025)</SelectItem>
                      <SelectItem value="Q3">Q3 2025 (September 30, 2025)</SelectItem>
                      <SelectItem value="Q4">Q4 2025 (December 31, 2025)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isAdmin() && (
                  <div className="space-y-2">
                    <Label htmlFor="owner">Objective Owner</Label>
                    <Select 
                      value={formData.ownerId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, ownerId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select objective owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.full_name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingObjective ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isAdmin() ? (
        <div className="space-y-6">
          {Object.entries(
            objectives.reduce((acc, objective) => {
              const ownerName = objective.owner?.full_name || objective.owner?.email || objective.owner_id || "Unknown Owner";
              if (!acc[ownerName]) {
                acc[ownerName] = [];
              }
              acc[ownerName].push(objective);
              return acc;
            }, {} as Record<string, Objective[]>)
          ).map(([ownerName, ownerObjectives]) => (
            <Card key={ownerName} className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Objectives for {ownerName}
                </CardTitle>
                <CardDescription>
                  {ownerObjectives.length} {ownerObjectives.length === 1 ? "objective" : "objectives"} assigned. Click on any row to view updates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Weightage</TableHead>
                        <TableHead>Activities</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Planned</TableHead>
                        <TableHead>Target Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ownerObjectives.map((objective) => {
                        const progress = objectiveProgress[objective.id] || 0;
                        const plannedProgress = calculatePlannedProgress(objective.target_completion_date);
                        const quarterInfo = getQuarterInfo(objective.target_completion_date);
                        const isExpanded = expandedObjectives.has(objective.id);
                        const updates = objectiveUpdates[objective.id] || [];
                        
                        return (
                          <Collapsible key={objective.id} open={isExpanded} onOpenChange={() => toggleObjectiveExpansion(objective.id)}>
                            <CollapsibleTrigger asChild>
                              <TableRow className="cursor-pointer hover:bg-gray-50">
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-500" />
                                    )}
                                    <div>
                                      <div className="font-medium">{objective.title}</div>
                                      <div className="text-sm text-gray-600 max-w-xs truncate">
                                        {objective.description}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
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
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleViewUpdates(objective.id, objective.title)}
                                      title="View updates for this objective"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(objective)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => handleDelete(objective.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            </CollapsibleTrigger>
                            <CollapsibleContent asChild>
                              <TableRow>
                                <TableCell colSpan={7} className="bg-gray-50 p-4">
                                  <div className="space-y-4">
                                    <h4 className="font-medium text-gray-900">Updates for {objective.title}</h4>
                                    {updates.length > 0 ? (
                                      <div className="space-y-3">
                                        {updates.map((update, index) => {
                                          const { cumulativeCount, rawProgress, effectiveProgress } = calculateCumulativeProgressForUpdate(updates, index, objective.num_activities);
                                          
                                          return (
                                            <div key={update.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-medium text-gray-900">
                                                    {update.user?.full_name || update.user?.email}
                                                  </span>
                                                  <Badge variant="outline">
                                                    {new Date(update.update_date).toLocaleDateString()}
                                                  </Badge>
                                                </div>
                                                {update.photos && update.photos.length > 0 && (
                                                  <Badge variant="outline" className="flex items-center gap-1">
                                                    <Camera className="h-3 w-3" />
                                                    {update.photos.length} photo{update.photos.length !== 1 ? 's' : ''}
                                                  </Badge>
                                                )}
                                              </div>
                                              
                                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                  <span className="text-gray-500">This Update:</span>
                                                  <div className="font-medium">+{update.achieved_count} activities</div>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500">Cumulative:</span>
                                                  <div className="font-medium">{cumulativeCount}/{objective.num_activities} ({rawProgress}%)</div>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500">Efficiency:</span>
                                                  <div className="font-medium">{update.efficiency || 100}%</div>
                                                </div>
                                                <div>
                                                  <span className="text-gray-500">Effective Progress:</span>
                                                  <div className="font-medium text-green-600">{effectiveProgress}%</div>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="text-center text-gray-500 py-4">
                                        No updates found for this objective.
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {ownerObjectives.map((objective) => (
                    <ObjectiveCard key={objective.id} objective={objective} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              My Objectives
            </CardTitle>
            <CardDescription>
              {objectives.length} {objectives.length === 1 ? "objective" : "objectives"} configured. Click on any row to view updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Owner</TableHead>
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
                    const isExpanded = expandedObjectives.has(objective.id);
                    const updates = objectiveUpdates[objective.id] || [];
                    
                    return (
                      <Collapsible key={objective.id} open={isExpanded} onOpenChange={() => toggleObjectiveExpansion(objective.id)}>
                        <CollapsibleTrigger asChild>
                          <TableRow className="cursor-pointer hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                                <div>
                                  <div className="font-medium">{objective.title}</div>
                                  <div className="text-sm text-gray-600 max-w-xs truncate">
                                    {objective.description}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div className="font-medium">{objective.owner?.full_name || objective.owner?.email}</div>
                                <div className="text-gray-600">{objective.owner?.email}</div>
                              </div>
                            </TableCell>
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
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewUpdates(objective.id, objective.title)}
                                title="View updates for this objective"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <TableRow>
                            <TableCell colSpan={8} className="bg-gray-50 p-4">
                              <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Updates for {objective.title}</h4>
                                {updates.length > 0 ? (
                                  <div className="space-y-3">
                                    {updates.map((update, index) => {
                                      const { cumulativeCount, rawProgress, effectiveProgress } = calculateCumulativeProgressForUpdate(updates, index, objective.num_activities);
                                      
                                      return (
                                        <div key={update.id} className="bg-white p-4 rounded-lg border border-gray-200">
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-gray-900">
                                                {update.user?.full_name || update.user?.email}
                                              </span>
                                              <Badge variant="outline">
                                                {new Date(update.update_date).toLocaleDateString()}
                                              </Badge>
                                            </div>
                                            {update.photos && update.photos.length > 0 && (
                                              <Badge variant="outline" className="flex items-center gap-1">
                                                <Camera className="h-3 w-3" />
                                                {update.photos.length} photo{update.photos.length !== 1 ? 's' : ''}
                                              </Badge>
                                            )}
                                          </div>
                                          
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                              <span className="text-gray-500">This Update:</span>
                                              <div className="font-medium">+{update.achieved_count} activities</div>
                                            </div>
                                            <div>
                                              <span className="text-gray-500">Cumulative:</span>
                                              <div className="font-medium">{cumulativeCount}/{objective.num_activities} ({rawProgress}%)</div>
                                            </div>
                                            <div>
                                              <span className="text-gray-500">Efficiency:</span>
                                              <div className="font-medium">{update.efficiency || 100}%</div>
                                            </div>
                                            <div>
                                              <span className="text-gray-500">Effective Progress:</span>
                                              <div className="font-medium text-green-600">{effectiveProgress}%</div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center text-gray-500 py-4">
                                    No updates found for this objective.
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {objectives.map((objective) => (
                <ObjectiveCard key={objective.id} objective={objective} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Detail Dialog */}
      <UpdateDetailDialog
        isOpen={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        objectiveTitle={selectedObjectiveTitle}
        updates={selectedObjectiveUpdates}
      />
    </div>
  );
};
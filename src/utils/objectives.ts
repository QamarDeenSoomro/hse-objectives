// Constants
export const QUARTERS = [
  { value: 'Q1', label: 'Q1 2025 (March 31, 2025)' },
  { value: 'Q2', label: 'Q2 2025 (June 30, 2025)' },
  { value: 'Q3', label: 'Q3 2025 (September 30, 2025)' },
  { value: 'Q4', label: 'Q4 2025 (December 31, 2025)' },
];

// Utility functions
export const getQuarterInfo = (dateString: string) => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  if (month <= 3) return { quarter: 'Q1', year };
  if (month <= 6) return { quarter: 'Q2', year };
  if (month <= 9) return { quarter: 'Q3', year };
  return { quarter: 'Q4', year };
};

export const getDateFromQuarter = (quarter: string, year: number = 2025) => {
  const quarterDates = {
    'Q1': `${year}-03-31`,
    'Q2': `${year}-06-30`,
    'Q3': `${year}-09-30`,
    'Q4': `${year}-12-31`,
  };
  return quarterDates[quarter as keyof typeof quarterDates] || `${year}-12-31`;
};

export const calculatePlannedProgress = (targetDate: string) => {
  const startDate = new Date('2025-01-01');
  const endDate = new Date(targetDate);
  const currentDate = new Date();
  
  if (currentDate < startDate) return 0;
  if (currentDate > endDate) return 100;
  
  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsedDuration = currentDate.getTime() - startDate.getTime();
  
  const plannedProgress = (elapsedDuration / totalDuration) * 100;
  return Math.round(Math.max(0, Math.min(100, plannedProgress)));
};

// Helper function to calculate cumulative progress for an objective
export const calculateCumulativeProgress = (updates: any[], numActivities: number) => {
  if (!updates || updates.length === 0) return 0;
  
  // Sort updates by date to ensure proper cumulative calculation
  const sortedUpdates = updates.sort((a, b) => new Date(a.update_date).getTime() - new Date(b.update_date).getTime());
  
  // Sum all achieved counts to get total cumulative count
  const totalAchievedCount = sortedUpdates.reduce((total, update) => total + (update.achieved_count || 0), 0);
  
  // Calculate raw progress percentage
  const rawProgress = (totalAchievedCount / numActivities) * 100;
  
  // Apply efficiency from the latest update (or 100% if no efficiency set)
  const latestUpdate = sortedUpdates[sortedUpdates.length - 1];
  const efficiency = latestUpdate?.efficiency || 100;
  const effectiveProgress = (rawProgress * efficiency) / 100;
  
  return Math.round(Math.min(100, effectiveProgress));
};
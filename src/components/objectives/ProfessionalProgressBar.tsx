import React from "react";

interface ProfessionalProgressBarProps {
  planned: number;
  actual: number;
  className?: string;
  showLabels?: boolean;
}

export const ProfessionalProgressBar = ({ 
  planned, 
  actual, 
  className = "",
  showLabels = false 
}: ProfessionalProgressBarProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-yellow-400 transition-all duration-500"
          style={{ width: `${Math.min(planned, 100)}%` }}
        />
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
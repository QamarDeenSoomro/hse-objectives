import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Shield, Edit, CheckSquare, Clock, AlertTriangle, FileText, Image } from "lucide-react";
import { ActionItem, PRIORITY_COLORS, STATUS_COLORS } from "@/types/actionItems";

interface ActionItemCardProps {
  actionItem: ActionItem;
  onEdit?: (actionItem: ActionItem) => void;
  onClose?: (actionItem: ActionItem) => void;
  onVerify?: (actionItem: ActionItem) => void;
  showActions: boolean;
}

export const ActionItemCard = ({ 
  actionItem, 
  onEdit, 
  onClose, 
  onVerify, 
  showActions 
}: ActionItemCardProps) => {
  const isOverdue = new Date(actionItem.target_date) < new Date() && actionItem.status === 'open';
  const canClose = actionItem.status === 'open' && onClose;
  const canVerify = actionItem.status === 'pending_verification' && onVerify;

  return (
    <Card className={`border hover:shadow-md transition-shadow ${isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg line-clamp-2">
                  {actionItem.title}
                </h3>
                {isOverdue && (
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
              </div>
              {actionItem.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {actionItem.description}
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            {showActions && (
              <div className="flex gap-2 flex-shrink-0">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(actionItem)}
                    className="text-xs"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1">Edit</span>
                  </Button>
                )}
                {canClose && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onClose(actionItem)}
                    className="text-xs text-green-600 hover:text-green-700"
                  >
                    <CheckSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1">Close</span>
                  </Button>
                )}
                {canVerify && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onVerify(actionItem)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1">Verify</span>
                  </Button>
                )}
              </div>
            )}
          </div>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={PRIORITY_COLORS[actionItem.priority]}>
              {actionItem.priority.toUpperCase()}
            </Badge>
            <Badge className={STATUS_COLORS[actionItem.status]}>
              {actionItem.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {isOverdue && (
              <Badge className="bg-red-100 text-red-800">
                OVERDUE
              </Badge>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Due:</span>
              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}>
                {new Date(actionItem.target_date).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Assigned:</span>
              <span className="text-gray-900 truncate">
                {actionItem.assigned_user?.full_name || actionItem.assigned_user?.email}
              </span>
            </div>
            
            {actionItem.verifier && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Verifier:</span>
                <span className="text-gray-900 truncate">
                  {actionItem.verifier.full_name || actionItem.verifier.email}
                </span>
              </div>
            )}
          </div>

          {/* Closure Information */}
          {actionItem.closure && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <span className="font-medium text-gray-900">Closure Details</span>
              </div>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-gray-900 mb-2">{actionItem.closure.closure_text}</p>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Closed by: {actionItem.closure.closer?.full_name || actionItem.closure.closer?.email}</span>
                  <span>•</span>
                  <span>{new Date(actionItem.closure.created_at).toLocaleDateString()}</span>
                </div>
                {actionItem.closure.media_urls && actionItem.closure.media_urls.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Attachments ({actionItem.closure.media_urls.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {actionItem.closure.media_urls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Closure attachment ${index + 1}`}
                          className="w-full h-20 object-cover rounded border cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => window.open(url, '_blank')}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Information */}
          {actionItem.verification && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="font-medium text-gray-900">Verification</span>
              </div>
              <div className={`p-3 rounded-md ${
                actionItem.verification.verification_status === 'approved' 
                  ? 'bg-green-50' 
                  : 'bg-red-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={
                    actionItem.verification.verification_status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }>
                    {actionItem.verification.verification_status.toUpperCase()}
                  </Badge>
                </div>
                {actionItem.verification.verification_comments && (
                  <p className="text-sm text-gray-900 mb-2">
                    {actionItem.verification.verification_comments}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>Verified by: {actionItem.verification.verifier?.full_name || actionItem.verification.verifier?.email}</span>
                  <span>•</span>
                  <span>{new Date(actionItem.verification.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-4">
              <span>Created: {new Date(actionItem.created_at).toLocaleDateString()}</span>
              {actionItem.closed_at && (
                <span>Closed: {new Date(actionItem.closed_at).toLocaleDateString()}</span>
              )}
              {actionItem.verified_at && (
                <span>Verified: {new Date(actionItem.verified_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, CheckSquare, Clock, Shield, AlertTriangle } from "lucide-react";
import { useActionItems } from "@/hooks/useActionItems";
import { ActionItemFormDialog } from "./ActionItemFormDialog";
import { ActionItemCard } from "./ActionItemCard";
import { ActionItemClosureDialog } from "./ActionItemClosureDialog";
import { ActionItemVerificationDialog } from "./ActionItemVerificationDialog";
import { ActionItem } from "@/types/actionItems";

export const ActionItemsPage = () => {
  const { isAdmin, profile } = useAuth();
  const { actionItems, isLoading } = useActionItems();
  
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isClosureDialogOpen, setIsClosureDialogOpen] = useState(false);
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false);
  const [editingActionItem, setEditingActionItem] = useState<ActionItem | null>(null);
  const [selectedActionItem, setSelectedActionItem] = useState<ActionItem | null>(null);

  // Filter action items based on user role and status
  const myActionItems = actionItems.filter(item => item.assigned_to === profile?.id);
  const myVerificationItems = actionItems.filter(item => item.verifier_id === profile?.id);
  
  const openItems = actionItems.filter(item => item.status === 'open');
  const closedItems = actionItems.filter(item => item.status === 'closed');
  const pendingVerificationItems = actionItems.filter(item => item.status === 'pending_verification');
  const verifiedItems = actionItems.filter(item => item.status === 'verified');

  const handleAddNew = () => {
    setEditingActionItem(null);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (actionItem: ActionItem) => {
    setEditingActionItem(actionItem);
    setIsFormDialogOpen(true);
  };

  const handleClose = (actionItem: ActionItem) => {
    setSelectedActionItem(actionItem);
    setIsClosureDialogOpen(true);
  };

  const handleVerify = (actionItem: ActionItem) => {
    setSelectedActionItem(actionItem);
    setIsVerificationDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Action Items</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">
            Manage and track action items with verification workflow
          </p>
        </div>
        {isAdmin() && (
          <Button 
            onClick={handleAddNew}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Action Item
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openItems.length}</div>
            <p className="text-xs text-gray-600">Awaiting action</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVerificationItems.length}</div>
            <p className="text-xs text-gray-600">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedItems.length}</div>
            <p className="text-xs text-gray-600">Completed items</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Items</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myActionItems.length}</div>
            <p className="text-xs text-gray-600">Assigned to me</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue={isAdmin() ? "all" : "my"} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="my">My Items</TabsTrigger>
          <TabsTrigger value="verification">For Verification</TabsTrigger>
          {isAdmin() && <TabsTrigger value="all">All Items</TabsTrigger>}
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                My Action Items
              </CardTitle>
              <CardDescription>
                Action items assigned to you ({myActionItems.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myActionItems.length > 0 ? (
                <div className="space-y-4">
                  {myActionItems.map((item) => (
                    <ActionItemCard
                      key={item.id}
                      actionItem={item}
                      onEdit={isAdmin() ? handleEdit : undefined}
                      onClose={handleClose}
                      onVerify={undefined}
                      showActions={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No action items assigned to you.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Items for Verification
              </CardTitle>
              <CardDescription>
                Action items awaiting your verification ({myVerificationItems.filter(item => item.status === 'pending_verification').length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myVerificationItems.filter(item => item.status === 'pending_verification').length > 0 ? (
                <div className="space-y-4">
                  {myVerificationItems
                    .filter(item => item.status === 'pending_verification')
                    .map((item) => (
                      <ActionItemCard
                        key={item.id}
                        actionItem={item}
                        onEdit={undefined}
                        onClose={undefined}
                        onVerify={handleVerify}
                        showActions={true}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No action items awaiting your verification.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin() && (
          <TabsContent value="all" className="space-y-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-green-600" />
                  All Action Items
                </CardTitle>
                <CardDescription>
                  All action items in the system ({actionItems.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {actionItems.length > 0 ? (
                  <div className="space-y-4">
                    {actionItems.map((item) => (
                      <ActionItemCard
                        key={item.id}
                        actionItem={item}
                        onEdit={handleEdit}
                        onClose={undefined}
                        onVerify={undefined}
                        showActions={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    No action items found.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="completed" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-green-600" />
                Completed Action Items
              </CardTitle>
              <CardDescription>
                Verified and completed action items ({verifiedItems.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verifiedItems.length > 0 ? (
                <div className="space-y-4">
                  {verifiedItems.map((item) => (
                    <ActionItemCard
                      key={item.id}
                      actionItem={item}
                      onEdit={undefined}
                      onClose={undefined}
                      onVerify={undefined}
                      showActions={false}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No completed action items yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ActionItemFormDialog
        isOpen={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        editingActionItem={editingActionItem}
      />

      <ActionItemClosureDialog
        isOpen={isClosureDialogOpen}
        onOpenChange={setIsClosureDialogOpen}
        actionItem={selectedActionItem}
      />

      <ActionItemVerificationDialog
        isOpen={isVerificationDialogOpen}
        onOpenChange={setIsVerificationDialogOpen}
        actionItem={selectedActionItem}
      />
    </div>
  );
};
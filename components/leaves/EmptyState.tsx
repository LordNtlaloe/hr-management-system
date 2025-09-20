import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface EmptyStateProps {
  hasFilters: boolean;
  showOnlyPending: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({ hasFilters, showOnlyPending }) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <FileText className="w-12 h-12 mb-4 text-gray-400" />
        <h3 className="mb-2 text-lg font-medium text-gray-500">
          No leave requests found
        </h3>
        <p className="text-gray-400">
          {hasFilters
            ? "Try adjusting your filters"
            : showOnlyPending
              ? "No pending requests at this time"
              : "No leave requests have been submitted yet"}
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
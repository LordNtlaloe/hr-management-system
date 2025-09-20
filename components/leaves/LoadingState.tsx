import React from "react";
import { Loader2 } from "lucide-react";

const LoadingState: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" />
      <span className="ml-2 text-gray-600">Loading leave requests...</span>
    </div>
  );
};

export default LoadingState;

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";

interface LeaveFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  leaveTypeFilter: string;
  setLeaveTypeFilter: (value: string) => void;
}

const LeaveFilters: React.FC<LeaveFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  leaveTypeFilter,
  setLeaveTypeFilter,
}) => {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-lg">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Leave Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leave Types</SelectItem>
              <SelectItem value="Annual">Annual Leave</SelectItem>
              <SelectItem value="Sick">Sick Leave</SelectItem>
              <SelectItem value="Personal">Personal Leave</SelectItem>
              <SelectItem value="Emergency">Emergency Leave</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setLeaveTypeFilter("all");
            }}
            className="w-full"
          >
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveFilters;

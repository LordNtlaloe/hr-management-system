"use client";

import { useState, useEffect } from "react";
import {
  getAllConcurrencyForms,
  getConcurrencyFormsByEmployee,
} from "@/actions/concurrency.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search, FileText, Plus, Filter } from "lucide-react";
import Link from "next/link";

interface ConcurrencyListProps {
  employeeId?: string;
  showFilters?: boolean;
}

export default function ConcurrencyList({
  employeeId,
  showFilters = true,
}: ConcurrencyListProps) {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadForms = async () => {
    try {
      setLoading(true);
      const result = employeeId
        ? await getConcurrencyFormsByEmployee(employeeId)
        : await getAllConcurrencyForms();

      if (result.success && result.forms) {
        setForms(result.forms);
      } else {
        setError(result.error || "Failed to load forms");
      }
    } catch (err) {
      setError("An error occurred while loading forms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, [employeeId]);

  const filteredForms = forms.filter((form) => {
    const matchesStatus =
      statusFilter === "all" || form.status === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      form.personal_info?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      form.personal_info?.department
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "submitted":
        return "secondary";
      case "requires_revision":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Concurrency Forms
          </h2>
          <p className="text-muted-foreground">
            Manage and review conflict of interest declarations
          </p>
        </div>
        <Button asChild>
          <Link href="/concurrency/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Declaration
          </Link>
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="requires_revision">
                      Requires Revision
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              <p>{error}</p>
              <Button variant="outline" onClick={loadForms} className="mt-2">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Declarations</CardTitle>
          <CardDescription>
            {filteredForms.length} form(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Outside Employment</TableHead>
                <TableHead>Conflicts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredForms.map((form) => (
                <TableRow key={form._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {form.personal_info?.full_name}
                    </div>
                  </TableCell>
                  <TableCell>{form.personal_info?.department}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        form.outside_employment?.has_outside_employment
                          ? "default"
                          : "outline"
                      }
                    >
                      {form.outside_employment?.has_outside_employment
                        ? "Yes"
                        : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        form.conflict_of_interest?.has_conflict
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {form.conflict_of_interest?.has_conflict ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(form.status)}>
                      {form.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(
                      form.submission_date || form.created_at
                    ).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/concurrency/${form._id}`}>View</Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/concurrency/${form._id}/edit`}>Edit</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredForms.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No forms found</h3>
              <p className="text-muted-foreground mt-2">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search filters"
                  : "Get started by creating your first declaration"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button asChild className="mt-4">
                  <Link href="/concurrency/new">
                    <Plus className="h-4 w-4 mr-2" />
                    New Declaration
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

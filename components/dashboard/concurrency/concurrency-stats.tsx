"use client";

import { useState, useEffect } from "react";
import { getConcurrencyFormStats } from "@/actions/concurrency.actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface ConcurrencyStatsProps {
  employeeId?: string;
}

export default function ConcurrencyStats({
  employeeId,
}: ConcurrencyStatsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await getConcurrencyFormStats(employeeId);
        if (result.success) {
          setStats(result.stats);
        }
      } catch (error) {
        console.error("Failed to load stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Forms",
      value: stats?.total || 0,
      icon: FileText,
      description: "All declarations",
    },
    {
      title: "Pending",
      value: stats?.pending || 0,
      icon: Clock,
      description: "Draft forms",
    },
    {
      title: "Submitted",
      value: stats?.submitted || 0,
      icon: FileText,
      description: "Under review",
    },
    {
      title: "Approved",
      value: stats?.approved || 0,
      icon: CheckCircle,
      description: "Approved forms",
    },
    {
      title: "Rejected",
      value: stats?.rejected || 0,
      icon: XCircle,
      description: "Rejected forms",
    },
    {
      title: "Needs Revision",
      value: stats?.requires_revision || 0,
      icon: AlertCircle,
      description: "Requires changes",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

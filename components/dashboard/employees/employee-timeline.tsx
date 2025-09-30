"use client";

import { useEffect, useState } from "react";
import {
  addEmployeeActivity,
  getEmployeeActivities,
  deleteEmployeeActivity,
} from "@/actions/employee.activities.actions";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Activity {
  _id: string;
  type: string;
  description: string;
  date: string;
}

export default function EmployeeTimeline({
  employeeId,
}: {
  employeeId: string;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [type, setType] = useState("leave");
  const [description, setDescription] = useState("");

  async function loadActivities() {
    const data = await getEmployeeActivities(employeeId);
    if (!("error" in data)) setActivities(data as Activity[]);
  }

  useEffect(() => {
    loadActivities();
  }, [employeeId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description) return;

    const result = await addEmployeeActivity({
      employeeId,
      type: type as any,
      description,
    });

    if ("success" in result) {
      setDescription("");
      await loadActivities();
    }
  }

  async function handleDelete(id: string) {
    await deleteEmployeeActivity(id);
    await loadActivities();
  }

  return (
    <div className="space-y-6">
      {/* Activities List */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Employee Timeline</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Activity</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select onValueChange={(val) => setType(val)} value={type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="suspension">Suspension</SelectItem>
                  <SelectItem value="disciplinary">Disciplinary</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="award">Award</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <DialogFooter>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {activities.map((act) => (
          <Card key={act._id}>
            <CardContent className="flex justify-between items-center py-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {new Date(act.date).toLocaleDateString()}
                </p>
                <p className="font-semibold capitalize">{act.type}</p>
                <p>{act.description}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(act._id)}
              >
                Delete
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// FILE: app/(protected)/users/page.tsx
"use client";

import { useMemo, useState, useTransition } from "react";
import { getAllUsers, createUser, updateUser, deleteUser } from "@/actions/user.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MoreHorizontal, Plus, Search, UserRound } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

// ---- Types
export type User = {
  _id?: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
};

const UserSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Invalid email"),
  role: z.string().optional(),
  phone: z.string().optional(),
});

export default function UsersPage() {
  const [initialUsers, setInitialUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load initial data
  useEffect(() => {
    (async () => {
      const users = (await getAllUsers()) as User[];
      setInitialUsers(users);
    })();
  }, []);

  const users = useMemo(() => {
    let data = [...initialUsers];
    if (query.trim()) {
      const q = query.toLowerCase();
      data = data.filter((u) =>
        [u.name, u.email, u.role, u.phone].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    if (roleFilter) data = data.filter((u) => (u.role || "").toLowerCase() === roleFilter.toLowerCase());
    return data;
  }, [initialUsers, query, roleFilter]);

  async function createUserAction(formData: FormData) {
    const payload = Object.fromEntries(formData) as any;
    if (payload._id) delete payload._id;
    await createUser(payload);
  }

  async function updateUserAction(formData: FormData) {
    const payload = Object.fromEntries(formData) as any;
    const id = String(payload._id);
    if (!id) return;
    delete payload._id;
    await updateUser(id, payload);
  }

  async function deleteUserAction(formData: FormData) {
    const id = String(formData.get("_id") || "");
    if (!id) return;
    await deleteUser(id);
  }

  function onOpenCreate() {
    setEditing(null);
    setOpen(true);
  }

  function onOpenEdit(user: User) {
    setEditing(user);
    setOpen(true);
  }

  function onDelete(id?: string) {
    if (!id) return;
    const fd = new FormData();
    fd.set("_id", id);
    startTransition(async () => {
      try {
        await deleteUserAction(fd);
        toast.success("User deleted");
      } catch (e: any) {
        toast.error(e?.message || "Failed to delete user");
      }
    });
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <UserRound className="h-5 w-5" />
            <CardTitle className="text-xl">Users</CardTitle>
            <Badge variant="secondary">{initialUsers.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4" />
              <Input
                placeholder="Search name, email, phone…"
                className="pl-8 w-64"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Select onValueChange={(v) => setRoleFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={onOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" /> Add User
                </Button>
              </DialogTrigger>
              <UserDialog
                key={editing?._id || "create"}
                editing={editing}
                onClose={() => setOpen(false)}
                createUserAction={createUserAction}
                updateUserAction={updateUserAction}
              />
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <UsersTable users={users} onEdit={onOpenEdit} onDelete={onDelete} loading={isPending} />
        </CardContent>
      </Card>
    </div>
  );
}

function UsersTable({
  users,
  onEdit,
  onDelete,
  loading,
}: {
  users: User[];
  onEdit: (u: User) => void;
  onDelete: (id?: string) => void;
  loading?: boolean;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u._id} className={loading ? "opacity-60" : ""}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                {u.role ? <Badge variant="outline">{u.role}</Badge> : <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell>{u.phone || <span className="text-muted-foreground">—</span>}</TableCell>
              <TableCell className="text-right">
                <RowActions user={u} onEdit={onEdit} onDelete={onDelete} />
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function RowActions({ user, onEdit, onDelete }: { user: User; onEdit: (u: User) => void; onDelete: (id?: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onEdit(user)}>Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(user._id)}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserDialog({
  editing,
  onClose,
  createUserAction,
  updateUserAction,
}: {
  editing: User | null;
  onClose: () => void;
  createUserAction: (formData: FormData) => Promise<void>;
  updateUserAction: (formData: FormData) => Promise<void>;
}) {
  const isEdit = Boolean(editing?._id);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof UserSchema>>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      _id: editing?._id,
      name: editing?.name || "",
      email: editing?.email || "",
      role: editing?.role || "",
      phone: editing?.phone || "",
    },
  });

  function onSubmit(values: z.infer<typeof UserSchema>) {
    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.set(k, String(v));
    });

    startTransition(async () => {
      try {
        if (isEdit) await updateUserAction(fd);
        else await createUserAction(fd);
        toast.success(isEdit ? "User updated" : "User created");
        onClose();
      } catch (e: any) {
        toast.error(e?.message || "Something went wrong");
      }
    });
  }

  return (
    <DialogContent className="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>
      </DialogHeader>
      <form action="#" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Jane Doe" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="jane@company.com" {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" placeholder="admin / manager / staff" {...form.register("role")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" placeholder="(+266) 5555-5555" {...form.register("phone")} />
          </div>
        </div>
        {/* Hidden id field for edits */}
        <input type="hidden" {...form.register("_id")} />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create user"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

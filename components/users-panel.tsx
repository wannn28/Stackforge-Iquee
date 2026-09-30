"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { ForbiddenState } from "@/components/resource-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateMemberRole } from "@/lib/actions";
import type { Member, MemberRole, MemberStatus } from "@/lib/types";

const roles: Array<{ id: MemberRole; title: string; detail: string }> = [
  { id: "admin", title: "Admin", detail: "Manage people, settings, and every record." },
  { id: "member", title: "Member", detail: "Create and edit records shared with the workspace." },
  { id: "viewer", title: "Viewer", detail: "Read records the row policy allows. No writes." },
];

const statusTone: Record<MemberStatus, "success" | "warning" | "danger"> = {
  active: "success",
  invited: "warning",
  suspended: "danger",
};

function UsersPanel({ members }: { members: Member[] }) {
  const confirm = useConfirm();
  const [rows, setRows] = useState(members);
  const [forbiddenMessage, setForbiddenMessage] = useState<string | null>(null);

  async function onRoleChange(member: Member, role: MemberRole) {
    if (role === member.role) return;

    const accepted = await confirm({
      title: "Change role?",
      description: `${member.name} will become ${role}.`,
      confirmLabel: "Update role",
      tone: "primary",
    });

    if (!accepted) return;

    const result = await updateMemberRole(member.id, role);
    if (!result.ok) {
      if (result.reason === "forbidden") {
        setForbiddenMessage(result.message);
        return;
      }
      toast.error(result.message);
      return;
    }

    setRows((current) => current.map((row) => (row.id === member.id ? { ...row, role } : row)));
    toast.success("Role updated");
  }

  if (forbiddenMessage) {
    return <ForbiddenState message={forbiddenMessage} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="p-4">
            <h2 className="text-h2 text-foreground">{role.title}</h2>
            <p className="mt-2 text-body text-muted">{role.detail}</p>
          </Card>
        ))}
      </div>
      <Card className="overflow-hidden">
        <div className="max-h-[640px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="h-auto">
                  <TableCell colSpan={4} className="px-4 py-12 text-center">
                    <p className="text-h2 text-foreground">No people yet</p>
                    <p className="mt-1 text-body text-muted">
                      Profiles appear here after the first sign-in.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((member) => (
                  <TableRow key={member.id} className="hover:bg-foreground/[0.03]">
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted">{member.email}</TableCell>
                    <TableCell>
                      <Badge tone={statusTone[member.status]}>{member.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <select
                        aria-label={`Role for ${member.name}`}
                        value={member.role}
                        onChange={(event) => onRoleChange(member, event.target.value as MemberRole)}
                        className="h-9 rounded-md border border-border bg-surface px-2 text-body text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.title}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export { UsersPanel };

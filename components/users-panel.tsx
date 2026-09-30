"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { ForbiddenState } from "@/components/resource-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { updateMemberRole } from "@/lib/actions";
import { memberRoleLabel, memberStatusLabel, type Member, type MemberRole, type MemberStatus } from "@/lib/types";

const roles: Array<{ id: MemberRole; title: string; detail: string }> = [
  { id: "owner", title: "Owner", detail: "Full access, including people and every record." },
  { id: "admin", title: "Admin", detail: "Manage people, settings, and every record." },
  { id: "member", title: "Member", detail: "Create and edit records the policy allows." },
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
      description: `${member.fullName} will become ${memberRoleLabel[role].toLowerCase()}.`,
      confirmLabel: "Update role",
      tone: "primary",
    });

    if (!accepted) return;

    const result = await updateMemberRole(member.id, role);
    if (!result.ok) {
      if (result.reason === "forbidden") {
        setForbiddenMessage(result.error);
        return;
      }
      toast.error(result.error);
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
        {rows.length === 0 ? (
          <>
            <div className="px-4 py-12 text-center md:hidden">
              <p className="text-h2 text-foreground">No people yet</p>
              <p className="mt-1 text-body text-muted">Profiles appear here after the first sign-in.</p>
            </div>
            <div className="hidden overflow-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="h-auto">
                    <TableCell colSpan={4} className="p-0">
                      <div className="px-4 py-12 text-center">
                        <p className="text-h2 text-foreground">No people yet</p>
                        <p className="mt-1 text-body text-muted">Profiles appear here after the first sign-in.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <>
            <ul className="divide-y divide-border md:hidden">
              {rows.map((member) => (
                <li key={member.id} className="flex flex-col gap-3 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-body font-medium break-words text-foreground">{member.fullName}</p>
                      <p className="truncate text-caption text-muted">{member.email || "—"}</p>
                    </div>
                    <Badge className="shrink-0" tone={statusTone[member.status]}>
                      {memberStatusLabel[member.status]}
                    </Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-caption text-muted">Role</span>
                    <Select
                      value={member.role}
                      onValueChange={(value) => onRoleChange(member, value as MemberRole)}
                    >
                      <SelectTrigger aria-label={`Role for ${member.fullName}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden max-h-[640px] overflow-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((member) => (
                    <TableRow key={member.id} className="hover:bg-foreground/[0.03]">
                      <TableCell className="font-medium">{member.fullName}</TableCell>
                      <TableCell className="text-muted">{member.email || "—"}</TableCell>
                      <TableCell>
                        <Badge tone={statusTone[member.status]}>{memberStatusLabel[member.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          onValueChange={(value) => onRoleChange(member, value as MemberRole)}
                        >
                          <SelectTrigger aria-label={`Role for ${member.fullName}`} className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export { UsersPanel };

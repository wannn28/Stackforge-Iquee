"use client";

import { useState, type FormEvent } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useConfirm } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileName } from "@/lib/actions";
import type { SessionUser } from "@/lib/types";
import { cn } from "@/lib/utils";

const themes = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
] as const;

function SettingsPanel({ user }: { user: SessionUser }) {
  const confirm = useConfirm();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const result = await updateProfileName(name);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success("Profile saved");
  }

  async function onDeleteWorkspace() {
    const accepted = await confirm({
      title: "Delete this workspace?",
      description: "This action is not available yet. Nothing will be deleted.",
      confirmLabel: "Delete workspace",
      tone: "danger",
    });
    if (!accepted) return;
    toast.error("Workspace deletion is not available yet.");
  }

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <Card className="p-6">
        <h2 className="text-h2 text-foreground">Profile</h2>
        <p className="mt-1 text-body text-muted">Name shown in the workspace.</p>
        <form className="mt-4 flex flex-col gap-4" onSubmit={onSave}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled readOnly />
          </div>
          <div>
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-h2 text-foreground">Appearance</h2>
        <p className="mt-1 text-body text-muted">Theme applies on this device.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {themes.map((option) => {
            const selected = (theme ?? "system") === option.id;
            return (
              <Button
                key={option.id}
                type="button"
                variant={selected ? "default" : "outline"}
                onClick={() => setTheme(option.id)}
                className={cn(selected && "pointer-events-none")}
              >
                {option.label}
              </Button>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-h2 text-foreground">Workspace</h2>
        <p className="mt-1 text-body text-muted">Production host for this console.</p>
        <p className="mt-4 text-body font-medium text-foreground">stackforge.iquee.tech</p>
      </Card>

      <Card className="border-danger/30 p-6">
        <h2 className="text-h2 text-danger">Danger zone</h2>
        <p className="mt-1 text-body text-muted">
          Deleting the workspace removes records for every role. This control is a scaffold.
        </p>
        <Button className="mt-4" type="button" variant="danger" onClick={onDeleteWorkspace}>
          Delete workspace
        </Button>
      </Card>
    </div>
  );
}

export { SettingsPanel };

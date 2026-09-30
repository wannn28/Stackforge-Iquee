"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNextPath } from "@/lib/utils";

type AuthMode = "sign-in" | "sign-up";

const errorCopy: Record<string, string> = {
  oauth: "Google sign-in did not finish. Try again.",
  config: "Supabase is not configured for this environment.",
};

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.1l.1.1 6.3 5.3C36.9 41.3 44 36 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

function AuthForm({
  mode,
  nextPath,
  initialError,
}: {
  mode: AuthMode;
  nextPath?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const destination = safeNextPath(nextPath);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"password" | "google" | null>(null);
  const [formError, setFormError] = useState(initialError ? errorCopy[initialError] ?? initialError : "");
  const configured = isSupabaseConfigured();

  async function onPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!configured) {
      toast.error("Add Supabase URL and anon key in .env.local to sign in.");
      return;
    }
    if (!email.includes("@")) {
      setFormError("Enter a valid email.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (mode === "sign-up" && name.trim().length < 2) {
      setFormError("Full name must be at least 2 characters.");
      return;
    }

    setPending("password");
    const supabase = createClient();
    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(destination)}`;

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setPending(null);
      if (error) {
        setFormError(
          error.message.toLowerCase().includes("invalid login")
            ? "Email or password is incorrect."
            : error.message,
        );
        return;
      }
      toast.success("Signed in");
      router.push(destination);
      router.refresh();
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: { full_name: name.trim() },
      },
    });
    setPending(null);
    if (error) {
      setFormError(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created");
      router.push(destination);
      router.refresh();
      return;
    }
    toast.success("Check your email to confirm the account.");
    setFormError("");
  }

  async function onGoogle() {
    setFormError("");
    if (!configured) {
      toast.error("Add Supabase URL and anon key in .env.local to sign in.");
      return;
    }
    setPending("google");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(destination)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setPending(null);
      setFormError(error.message);
    }
  }

  const title = mode === "sign-in" ? "Sign in" : "Create account";
  const submitLabel = mode === "sign-in" ? "Sign in" : "Create account";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px]">
        <Logo />
        <Card className="mt-6 p-6">
          <h1 className="text-display text-foreground">{title}</h1>
          <p className="mt-1 text-body text-muted">Stackforge at stackforge.iquee.tech</p>

          {!configured ? (
            <p className="mt-4 rounded-md border border-border bg-background px-3 py-2 text-caption text-muted">
              Supabase keys are not set. Add them to <span className="font-medium">.env.local</span>{" "}
              before signing in.
            </p>
          ) : null}

          <form className="mt-6 flex flex-col gap-4" onSubmit={onPassword}>
            {mode === "sign-up" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                minLength={8}
                required
              />
            </div>
            {formError ? <p className="text-caption text-danger">{formError}</p> : null}
            <Button type="submit" size="lg" className="w-full" disabled={pending !== null}>
              {pending === "password" ? "Please wait…" : submitLabel}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-caption text-muted">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={onGoogle}
            disabled={pending !== null}
          >
            <GoogleMark />
            {pending === "google" ? "Redirecting…" : "Continue with Google"}
          </Button>
        </Card>
        <p className="mt-4 text-center text-body text-muted">
          {mode === "sign-in" ? "No account yet?" : "Already have an account?"}{" "}
          <Link
            href={mode === "sign-in" ? `/sign-up?next=${encodeURIComponent(destination)}` : `/sign-in?next=${encodeURIComponent(destination)}`}
            className="font-medium text-primary hover:text-primary-hover"
          >
            {mode === "sign-in" ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </div>
    </div>
  );
}

export { AuthForm };

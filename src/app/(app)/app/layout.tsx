import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { ensureUserSeeded } from "@/features/onboarding/actions";
import { getProfile } from "@/features/workouts/queries";
import { requireUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  await ensureUserSeeded();
  const profile = await getProfile();

  return (
    <AppShell fullName={profile?.full_name} email={user.email}>
      {children}
    </AppShell>
  );
}

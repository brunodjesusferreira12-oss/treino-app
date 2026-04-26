import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { ensureUserSeeded } from "@/features/onboarding/actions";
import { getCurrentSportContext, getProfile } from "@/features/workouts/queries";
import { requireUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();
  await ensureUserSeeded();
  const [profile, sportContext] = await Promise.all([
    getProfile(),
    getCurrentSportContext(),
  ]);

  return (
    <AppShell
      fullName={profile?.full_name}
      email={user.email}
      activeSportName={sportContext.activeSportName}
    >
      {children}
    </AppShell>
  );
}

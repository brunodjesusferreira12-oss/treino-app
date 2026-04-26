import { NextResponse } from "next/server";
import { z } from "zod";

import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

const reportSchema = z.object({
  level: z.enum(["info", "warning", "error"]).default("error"),
  source: z.string().trim().min(2).max(120),
  route: z.string().trim().max(240).nullable().optional(),
  message: z.string().trim().min(2).max(1000),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
  userAgent: z.string().trim().max(400).nullable().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const details = (parsed.data.details ?? null) as Json | null;

  const { error } = await supabase.from("app_error_events").insert({
    user_id: user?.id ?? null,
    level: parsed.data.level,
    source: parsed.data.source,
    route: parsed.data.route ?? null,
    message: parsed.data.message,
    details,
    user_agent: parsed.data.userAgent ?? request.headers.get("user-agent"),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

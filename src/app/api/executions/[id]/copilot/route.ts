import { NextResponse } from "next/server";

import { getExecutionCopilotInsights } from "@/features/workouts/queries";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const insights = await getExecutionCopilotInsights(id);
    return NextResponse.json({ insights });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o copiloto.",
      },
      { status: 500 },
    );
  }
}

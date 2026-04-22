"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { startExecutionAction } from "@/features/workouts/actions";

type StartWorkoutButtonProps = {
  workoutId: string;
};

export function StartWorkoutButton({ workoutId }: StartWorkoutButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Button
        onClick={() =>
          startTransition(async () => {
            setMessage(null);
            const result = await startExecutionAction(workoutId);

            if (!result.ok || !result.id) {
              setMessage(result.error ?? "Não foi possível iniciar a execução.");
              return;
            }

            router.push(`/app/executions/${result.id}`);
            router.refresh();
          })
        }
        disabled={isPending}
      >
        <Play className="h-4 w-4" />
        {isPending ? "Abrindo..." : "Executar treino"}
      </Button>
      {message ? <p className="text-sm text-red-400">{message}</p> : null}
    </div>
  );
}

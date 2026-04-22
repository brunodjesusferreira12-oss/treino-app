"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteWorkoutAction } from "@/features/workouts/actions";

type DeleteWorkoutButtonProps = {
  workoutId: string;
};

export function DeleteWorkoutButton({ workoutId }: DeleteWorkoutButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-3">
      <Button
        variant="danger"
        onClick={() => {
          const confirmed = window.confirm(
            "Deseja realmente excluir este treino? O histórico já executado será preservado.",
          );

          if (!confirmed) {
            return;
          }

          startTransition(async () => {
            const result = await deleteWorkoutAction(workoutId);

            if (!result.ok) {
              setMessage(result.error ?? "Não foi possível excluir.");
              return;
            }

            router.push("/app/workouts");
            router.refresh();
          });
        }}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4" />
        {isPending ? "Excluindo..." : "Excluir treino"}
      </Button>
      {message ? <p className="text-sm text-red-400">{message}</p> : null}
    </div>
  );
}

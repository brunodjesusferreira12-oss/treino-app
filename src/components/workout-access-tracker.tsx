"use client";

import { useEffect } from "react";

import { touchWorkoutAction } from "@/features/workouts/actions";

type WorkoutAccessTrackerProps = {
  workoutId: string;
};

export function WorkoutAccessTracker({ workoutId }: WorkoutAccessTrackerProps) {
  useEffect(() => {
    const run = () => {
      void touchWorkoutAction(workoutId);
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(run, { timeout: 1500 });

      return () => {
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(run, 800);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [workoutId]);

  return null;
}

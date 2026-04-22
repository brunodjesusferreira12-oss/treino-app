"use client";

import { useEffect } from "react";

import { touchWorkoutAction } from "@/features/workouts/actions";

type WorkoutAccessTrackerProps = {
  workoutId: string;
};

export function WorkoutAccessTracker({ workoutId }: WorkoutAccessTrackerProps) {
  useEffect(() => {
    void touchWorkoutAction(workoutId);
  }, [workoutId]);

  return null;
}

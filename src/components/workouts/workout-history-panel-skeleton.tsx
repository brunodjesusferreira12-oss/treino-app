import { Card } from "@/components/ui/card";

export function WorkoutHistoryPanelSkeleton() {
  return (
    <Card className="space-y-4">
      <div>
        <div className="h-4 w-32 rounded-full bg-white/5" />
        <div className="mt-3 h-8 w-72 rounded-full bg-white/6" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[24px] border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded-full bg-white/6" />
                <div className="h-3 w-40 rounded-full bg-white/5" />
              </div>
              <div className="h-8 w-24 rounded-full bg-white/6" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

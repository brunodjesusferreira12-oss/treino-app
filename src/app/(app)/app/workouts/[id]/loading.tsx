import { Card } from "@/components/ui/card";

export default function WorkoutDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded-full bg-white/5" />
        <div className="h-10 w-72 rounded-full bg-white/6" />
        <div className="h-5 w-[32rem] max-w-full rounded-full bg-white/5" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="space-y-3">
            <div className="h-4 w-20 rounded-full bg-white/5" />
            <div className="h-7 w-24 rounded-full bg-white/6" />
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="space-y-4">
            <div className="h-8 w-40 rounded-full bg-white/6" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((__, itemIndex) => (
                <div
                  key={itemIndex}
                  className="rounded-[24px] border border-white/10 bg-white/5 p-4"
                >
                  <div className="h-5 w-48 rounded-full bg-white/6" />
                  <div className="mt-3 h-4 w-28 rounded-full bg-white/5" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Card } from "@/components/ui/card";

export default function ExecutionLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-24 rounded-full bg-white/5" />
        <div className="h-10 w-64 rounded-full bg-white/6" />
        <div className="h-5 w-[34rem] max-w-full rounded-full bg-white/5" />
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded-full bg-white/5" />
            <div className="h-8 w-44 rounded-full bg-white/6" />
          </div>
          <div className="h-10 w-24 rounded-full bg-white/6" />
        </div>
        <div className="h-3 rounded-full bg-white/5" />
      </Card>

      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index} className="space-y-4">
          <div className="h-8 w-36 rounded-full bg-white/6" />
          {Array.from({ length: 2 }).map((__, itemIndex) => (
            <div
              key={itemIndex}
              className="rounded-[24px] border border-white/10 bg-white/5 p-4"
            >
              <div className="h-5 w-56 rounded-full bg-white/6" />
              <div className="mt-3 h-4 w-40 rounded-full bg-white/5" />
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                {Array.from({ length: 4 }).map((___, inputIndex) => (
                  <div key={inputIndex} className="h-11 rounded-2xl bg-white/6" />
                ))}
              </div>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

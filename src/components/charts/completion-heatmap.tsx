import { cn } from "@/lib/utils";

type CompletionHeatmapProps = {
  data: Array<{
    date: string;
    count: number;
  }>;
};

export function CompletionHeatmap({ data }: CompletionHeatmapProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {data.map((item) => (
        <div
          key={item.date}
          className={cn(
            "flex aspect-square items-end rounded-2xl border border-white/8 p-2 text-[10px] text-zinc-500",
            item.count >= 2
              ? "bg-lime-300/35 text-zinc-950"
              : item.count === 1
                ? "bg-lime-300/18 text-zinc-200"
                : "bg-white/4",
          )}
          title={`${item.date}: ${item.count} treino(s)`}
        >
          {new Date(item.date).getDate()}
        </div>
      ))}
    </div>
  );
}

import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: string | number;
  description: string;
};

export function StatCard({ label, value, description }: StatCardProps) {
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-[color:var(--muted)]">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
          {value}
        </p>
      </div>
      <p className="text-sm leading-6 text-[color:var(--muted)]">{description}</p>
    </Card>
  );
}

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type WeeklyFrequencyChartProps = {
  data: Array<{
    week: string;
    count: number;
  }>;
};

export function WeeklyFrequencyChart({ data }: WeeklyFrequencyChartProps) {
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="week"
            stroke="#71717a"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            stroke="#71717a"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#09090b",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              color: "#f4f4f5",
            }}
          />
          <Bar dataKey="count" fill="#bef264" radius={[12, 12, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

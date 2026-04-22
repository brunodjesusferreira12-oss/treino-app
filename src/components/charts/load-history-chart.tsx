"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type LoadHistoryChartProps = {
  data: Array<{
    date: string;
    load: number;
  }>;
};

export function LoadHistoryChart({ data }: LoadHistoryChartProps) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
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
          />
          <Tooltip
            contentStyle={{
              background: "#09090b",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              color: "#f4f4f5",
            }}
          />
          <Line
            type="monotone"
            dataKey="load"
            stroke="#38bdf8"
            strokeWidth={3}
            dot={{ r: 4, fill: "#38bdf8" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

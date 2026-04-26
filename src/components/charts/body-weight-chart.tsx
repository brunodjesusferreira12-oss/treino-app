"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type BodyWeightChartProps = {
  data: Array<{
    date: string;
    weight: number;
  }>;
};

export function BodyWeightChart({ data }: BodyWeightChartProps) {
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
            domain={["dataMin - 1", "dataMax + 1"]}
          />
          <Tooltip
            formatter={(value) => {
              const numericValue =
                typeof value === "number" ? value : Number(value ?? 0);

              return [`${numericValue.toLocaleString("pt-BR")} kg`, "Peso"];
            }}
            contentStyle={{
              background: "#09090b",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16,
              color: "#f4f4f5",
            }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#bef264"
            strokeWidth={3}
            dot={{ r: 4, fill: "#bef264" }}
            activeDot={{ r: 6, fill: "#d9f99d" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

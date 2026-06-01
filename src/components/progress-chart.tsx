'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

interface ScorePoint {
  label: string
  score: number
}

interface ProgressChartProps {
  data: ScorePoint[]
  type?: 'bar' | 'line'
  height?: number
}

export default function ProgressChart({ data, type = 'bar', height = 280 }: ProgressChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
        No data yet — take some tests to see your progress.
      </div>
    )
  }

  const common = {
    data,
    margin: { top: 4, right: 8, left: -20, bottom: 4 },
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'line' ? (
        <LineChart {...common}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v) => [`${v as number}%`, 'Score']}
            contentStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="score"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            stroke="hsl(var(--primary))"
          />
        </LineChart>
      ) : (
        <BarChart {...common}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v) => [`${v as number}%`, 'Score']}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={56} />
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}

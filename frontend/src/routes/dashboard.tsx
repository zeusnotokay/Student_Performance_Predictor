import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { PageHeader, MetricCard, ChartCard, riskTone } from "@/components/site/shared";
import { getDashboard, loadLastPrediction, type DashboardData, type PredictionResult } from "@/lib/predict";
import { trend, factors } from "@/lib/sample-data";
import { useRequireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Performance Dashboard — Student Performance Predictor" },
      { name: "description", content: "Academic performance overview with semester trends, subject scores and performance factors." },
      { property: "og:title", content: "Performance Dashboard — Student Performance Predictor" },
      { property: "og:description", content: "Academic performance analysis and prediction dashboard." },
    ],
  }),
  component: Dashboard,
});

const axis = { fontSize: 12, fill: "var(--color-muted-foreground)" };
const tooltip = {
  contentStyle: { borderRadius: 6, border: "1px solid var(--color-border)", fontSize: 12, boxShadow: "none" },
  cursor: { fill: "var(--color-muted)" },
};

const DIST_COLORS: Record<string, string> = {
  "Excellent Performance": "#22c55e",
  "Good Performance": "#6366f1",
  "Average Performance": "#f59e0b",
  "Needs Improvement": "#f97316",
  "Poor Performance": "#ef4444",
};

function Dashboard() {
  const allowed = useRequireAuth();
  const [last, setLast] = useState<PredictionResult | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  useEffect(() => {
    setLast(loadLastPrediction());
    getDashboard().then(setDashboard).catch(() => { /* backend may not be running yet */ });
  }, []);

  if (!allowed) return null;

  const score = last?.score ?? 78;
  const risk = last?.risk ?? "Low";
  const average = dashboard?.average ?? score;
  const latestTrend = [...trend.slice(0, -1), { ...trend[trend.length - 1], score }];
  const distData = dashboard?.distribution ?? [];

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageHeader title="Performance Overview" subtitle="Academic performance analysis and prediction." />
        <p className="mb-8 text-sm text-muted-foreground">
          {last ? `Student ${last.studentId}` : "Sample student · STU-2024-0418"} · B.Tech CSE, Year 3
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Predicted Score" value={`${score}%`} hint="Semester 6 estimate" />
        <MetricCard label="Attendance" value={`${last?.attendance ?? 86}%`} hint="Required: 75%" />
        <MetricCard label="Academic Risk" value={risk} tone={riskTone(risk)} />
        <MetricCard label="Total Predictions" value={dashboard ? String(dashboard.total) : "—"} hint={dashboard ? `Avg: ${average}%` : "Connect backend"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <ChartCard title="Performance Trend" subtitle="Semester scores, latest is predicted" className="lg:col-span-3">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latestTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="sem" tick={axis} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 100]} tick={axis} axisLine={false} tickLine={false} />
                <Tooltip {...tooltip} cursor={{ stroke: "var(--color-border)" }} />
                <Line type="monotone" dataKey="score" name="Score" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-primary)" }} animationDuration={700} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Feature Influence" subtitle="Approximate factor impact on score" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={factors} layout="vertical" margin={{ top: 0, right: 8, left: 20, bottom: 0 }}>
                <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={axis} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={axis} axisLine={false} tickLine={false} width={110} />
                <Tooltip {...tooltip} />
                <Bar dataKey="value" name="Influence" fill="var(--color-highlight)" radius={[0, 3, 3, 0]} barSize={14} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Real Performance Distribution */}
      {distData.length > 0 && (
        <div className="mt-4">
          <ChartCard title="📊 Performance Distribution" subtitle="Real breakdown of all saved predictions from the database">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distData} margin={{ top: 4, right: 8, left: -10, bottom: 40 }}>
                  <CartesianGrid stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="performance" tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }} angle={-20} textAnchor="end" axisLine={false} tickLine={false} />
                  <YAxis tick={axis} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltip} formatter={(v) => [v, "Students"]} />
                  <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]} barSize={40} animationDuration={700}>
                    {distData.map((entry) => (
                      <Cell key={entry.performance} fill={DIST_COLORS[entry.performance] ?? "var(--color-primary)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <section className="panel flex flex-col p-5 lg:col-span-2">
          <p className="eyebrow">Academic Recommendation</p>
          <h2 className="mt-2 text-base font-semibold">Focus on Computer Networks and assignment quality</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Computer Networks is currently the lowest-scoring subject at 64%. Attendance is strong, so the
            largest gain is likely to come from adding 45–60 minutes of focused study per day and
            submitting assignments ahead of deadlines.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Target score</span><span className="font-medium">82%</span></li>
            <li className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Weekly study goal</span><span className="font-medium">25 hrs</span></li>
            <li className="flex justify-between border-t pt-2"><span className="text-muted-foreground">Next review</span><span className="font-medium">Before mid-semester exams</span></li>
          </ul>
          <div className="mt-auto flex gap-2 pt-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/predict">Run a new prediction</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/goals">Set a Goal</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

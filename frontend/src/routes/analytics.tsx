import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { PageHeader, ChartCard } from "@/components/site/shared";
import { getFeatureImportance, getModelInfo, getDashboard, type FeatureImportanceItem, type ModelInfo, type DashboardData } from "@/lib/predict";
import { useRequireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Feature Importance — Student Performance Predictor" },
      { name: "description", content: "Real ML model feature importance, grade distribution and academic analytics." },
    ],
  }),
  component: AnalyticsPage,
});

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#818cf8", "#4f46e5", "#7c3aed", "#5b21b6"];
const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

const axisStyle = { fontSize: 11, fill: "var(--color-muted-foreground)" };
const tooltipStyle = {
  contentStyle: { borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
};

function StatCard({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`panel p-5 transition-all hover:shadow-lg ${accent ? "border-primary/40 bg-primary/5" : ""}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${accent ? "text-primary" : ""}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const allowed = useRequireAuth();
  const [importance, setImportance] = useState<FeatureImportanceItem[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!allowed) return;
    Promise.allSettled([
      getFeatureImportance().then(setImportance),
      getModelInfo().then(setModelInfo),
      getDashboard().then(setDashboard),
    ]).finally(() => setLoading(false));
  }, [allowed]);

  if (!allowed) return null;

  const distData = dashboard?.distribution ?? [];
  const accuracy = modelInfo ? Math.round(modelInfo.r2 * 100) : 0;

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        title="ML Analytics & Feature Importance"
        subtitle="Real insights from the trained model — which factors matter most for predicting student performance."
      />

      {/* Model Info Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-6">
        <StatCard label="ML Model" value={modelInfo?.model_name?.split(" ")[0] ?? "—"} sub={modelInfo?.model_name} accent />
        <StatCard label="Model Accuracy (R²)" value={loading ? "…" : `${accuracy}%`} sub="Coefficient of Determination" />
        <StatCard label="Features Used" value={modelInfo ? String(modelInfo.feature_count) : "—"} sub="Input variables" />
        <StatCard label="Predictions Saved" value={dashboard ? String(dashboard.total) : "—"} sub={`Avg score: ${dashboard?.average ?? "—"}%`} />
      </div>

      {/* Feature Importance Bar Chart */}
      <ChartCard
        title="📊 Feature Importance"
        subtitle="Percentage influence of each factor on the predicted final score (from trained ML model)"
        className="mb-6"
      >
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading model data…</div>
        ) : importance.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Backend not connected — start the Flask server.</div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={importance} layout="vertical" margin={{ top: 4, right: 40, left: 10, bottom: 4 }}>
                <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} unit="%" />
                <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={140} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v}%`, "Influence"]} />
                <Bar dataKey="value" name="Influence %" radius={[0, 6, 6, 0]} barSize={18} animationDuration={800}>
                  {importance.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grade / Performance Distribution Pie */}
        <ChartCard title="🎯 Performance Distribution" subtitle="Breakdown of all saved predictions by performance category">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : distData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No predictions saved yet. Run a prediction first.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distData}
                    dataKey="count"
                    nameKey="performance"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    animationDuration={800}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {distData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [v, "Predictions"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* Top Insights Panel */}
        <ChartCard title="🧠 Model Insights" subtitle="Key takeaways from the trained ML model">
          <ul className="space-y-3 mt-2">
            {[
              { icon: "📌", text: importance[0] ? `"${importance[0].name}" is the most influential factor (${importance[0].value}% impact)` : "Loading top factor…" },
              { icon: "📈", text: `The model explains ${accuracy}% of variation in student scores (R² = ${modelInfo?.r2 ?? "—"})` },
              { icon: "🎯", text: `${modelInfo?.feature_count ?? 10} features are used: attendance, marks, study habits and more` },
              { icon: "⚠️", text: importance[importance.length - 1] ? `"${importance[importance.length - 1].name}" has the least impact on score` : "Calculating…" },
              { icon: "✅", text: "Random Forest selects the best split at every node — robust to outliers and noise" },
            ].map((item, i) => (
              <li key={i} className="flex gap-3 rounded-md border bg-muted/30 px-4 py-3 text-sm">
                <span>{item.icon}</span>
                <span className="text-muted-foreground">{item.text}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}

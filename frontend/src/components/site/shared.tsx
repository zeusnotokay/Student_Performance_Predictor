import type { ReactNode } from "react";
import type { RiskLevel } from "@/lib/predict";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, eyebrow }: { title: string; subtitle?: string | undefined; eyebrow?: string | undefined }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function MetricCard({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string | undefined; tone?: "success" | "warning" | "danger" | undefined }) {
  return (
    <div className="panel p-4 transition-shadow hover:shadow-md">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-2xl font-semibold tracking-tight",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function riskTone(r: RiskLevel) {
  return r === "Low" ? "success" : r === "Moderate" ? "warning" : "danger";
}

export function ChartCard({ title, subtitle, children, className }: { title: string; subtitle?: string | undefined; children: ReactNode; className?: string | undefined }) {
  return (
    <section className={cn("panel p-5", className)}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function RecommendationCard({ index, title, detail }: { index: number; title: string; detail: string }) {
  return (
    <div className="flex gap-4 rounded-md border bg-card p-4">
      <span className="text-xs font-semibold tabular-nums text-highlight">{String(index).padStart(2, "0")}</span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Score ${score} out of 100`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (score / 100) * c}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
      />
      <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground" fontSize={size / 4.2} fontWeight={600}>
        {score}
      </text>
      <text x="50%" y="66%" textAnchor="middle" className="fill-muted-foreground" fontSize={12}>
        / 100
      </text>
    </svg>
  );
}

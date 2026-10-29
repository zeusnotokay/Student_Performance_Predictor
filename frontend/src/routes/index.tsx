import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, LineChart, ShieldAlert, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Student Performance Predictor — Academic Analytics" },
      { name: "description", content: "Estimate student performance from academic and behavioral data and identify areas that need improvement." },
      { property: "og:title", content: "Student Performance Predictor — Academic Analytics" },
      { property: "og:description", content: "Estimate student performance from academic and behavioral data." },
    ],
  }),
  component: Home,
});

const features = [
  { icon: LineChart, title: "Performance Prediction", text: "Estimate expected academic performance." },
  { icon: ShieldAlert, title: "Risk Identification", text: "Identify students who may need additional support." },
  { icon: Lightbulb, title: "Academic Insights", text: "Understand which factors influence performance." },
];

function PreviewCard() {
  const rows = [
    { label: "Attendance", value: "86%", bar: 86 },
    { label: "Internal Assessment", value: "74%", bar: 74 },
    { label: "Assignments", value: "81%", bar: 81 },
  ];
  return (
    <div className="panel overflow-hidden shadow-lg">
      <div className="flex items-center justify-between border-b bg-muted/60 px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">Prediction · STU-2024-0418</span>
        <span className="text-xs text-muted-foreground">B.Tech CSE · Year 3</span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-border">
        <div className="bg-card p-4">
          <p className="text-xs text-muted-foreground">Predicted Score</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">78%</p>
        </div>
        <div className="bg-card p-4">
          <p className="text-xs text-muted-foreground">Performance</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-success">Good</p>
        </div>
        <div className="bg-card p-4">
          <p className="text-xs text-muted-foreground">Attendance</p>
          <p className="mt-1 text-xl font-semibold">86%</p>
        </div>
        <div className="bg-card p-4">
          <p className="text-xs text-muted-foreground">Academic Risk</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xl font-semibold">
            <span className="h-2 w-2 rounded-full bg-success" /> Low
          </p>
        </div>
      </div>
      <div className="space-y-3 border-t p-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-medium tabular-nums">{r.value}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${r.bar}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  useEffect(() => { void navigate({ to: "/login", replace: true }); }, [navigate]);
  return (
    <div className="page-enter mx-auto max-w-6xl px-4 sm:px-6">
      <section className="grid items-center gap-12 py-14 md:grid-cols-2 md:py-20">
        <div>
          <p className="eyebrow">Academic Analytics</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Understand your academic performance before the results arrive.
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
            The system uses academic records, attendance and study habits to estimate a student's
            expected score and point out the areas that need the most attention.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/predict">Predict Performance <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard">View Dashboard</Link>
            </Button>
          </div>
        </div>
        <PreviewCard />
      </section>

      <section className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="bg-card p-6">
            <f.icon className="h-5 w-5 text-highlight" aria-hidden />
            <h2 className="mt-4 text-sm font-semibold">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

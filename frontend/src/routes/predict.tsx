import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2, RotateCcw, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, MetricCard, RecommendationCard, ScoreRing, riskTone } from "@/components/site/shared";
import { predictPerformance, saveLastPrediction, type PredictionResult, type StudentFormData } from "@/lib/predict";
import { useRequireAuth } from "@/lib/require-auth";

export const Route = createFileRoute("/predict")({
  head: () => ({
    meta: [
      { title: "Predict Performance — Student Performance Predictor" },
      { name: "description", content: "Enter academic, attendance and study information to generate a student performance prediction." },
      { property: "og:title", content: "Predict Performance — Student Performance Predictor" },
      { property: "og:description", content: "Generate a performance prediction from academic information." },
    ],
  }),
  component: PredictPage,
});

const initial: StudentFormData = {
  studentId: "STU-2024-0418",
  age: 20,
  gender: "",
  department: "",
  year: "",
  previousMarks: 76,
  internalMarks: 72,
  assignmentScore: 80,
  attendance: 86,
  backlogs: 0,
  studyHours: 3.5,
  sleepHours: 7,
  previousExamScore: 74,
  extracurricular: true,
  resources: "good",
};

type Errors = Partial<Record<keyof StudentFormData, string>>;

function validate(d: StudentFormData): Errors {
  const e: Errors = {};
  if (!d.studentId.trim()) e.studentId = "Student ID is required";
  if (!d.age || d.age < 15 || d.age > 60) e.age = "Enter an age between 15 and 60";
  if (!d.gender) e.gender = "Select a gender";
  if (!d.department) e.department = "Select a department";
  if (!d.year) e.year = "Select year of study";
  const pct = (k: keyof StudentFormData, label: string) => {
    const v = d[k] as number;
    if (Number.isNaN(v) || v < 0 || v > 100) e[k] = `${label} must be 0–100`;
  };
  pct("previousMarks", "Marks");
  pct("internalMarks", "Marks");
  pct("assignmentScore", "Score");
  pct("previousExamScore", "Score");
  if (d.backlogs < 0 || d.backlogs > 20 || Number.isNaN(d.backlogs)) e.backlogs = "Enter 0–20";
  return e;
}

function Field({ label, id, error, hint, children }: { label: string; id: string; error?: string | undefined; hint?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Section({ step, title, description, children }: { step: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-t py-8 first:border-t-0 first:pt-0 md:grid-cols-[220px_1fr]">
      <div>
        <p className="text-xs font-semibold tabular-nums text-highlight">{step}</p>
        <h2 className="mt-1 text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="panel grid gap-5 p-5 sm:grid-cols-2 sm:p-6">{children}</div>
    </section>
  );
}

function PredictPage() {
  const allowed = useRequireAuth();
  const [data, setData] = useState<StudentFormData>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  const set = <K extends keyof StudentFormData>(k: K, v: StudentFormData[K]) => {
    setData((d) => ({ ...d, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const num = (k: keyof StudentFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(k, (e.target.value === "" ? NaN : Number(e.target.value)) as never);
  const invalid = (k: keyof StudentFormData) => (errors[k] ? "border-destructive focus-visible:ring-destructive/30" : "");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(data);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(Object.keys(errs)[0] ?? "")?.focus();
      return;
    }
    setLoading(true);
    try {
      const r = await predictPerformance(data);
      saveLastPrediction(r);
      setResult(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Prediction failed. Make sure the Flask backend and MySQL are running.");
    } finally {
      setLoading(false);
    }
  }

  if (!allowed) return null;
  if (result) return <ResultView result={result} onReset={() => setResult(null)} />;

  return (
    <div className="page-enter mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader title="Student Performance Prediction" subtitle="Enter the student's academic information to generate a performance prediction." />
      <form onSubmit={submit} noValidate>
        <Section step="01" title="Student Information" description="Basic details used to identify the record.">
          <Field label="Student ID" id="studentId" error={errors.studentId}>
            <Input id="studentId" value={data.studentId} onChange={(e) => set("studentId", e.target.value)} className={invalid("studentId")} />
          </Field>
          <Field label="Age" id="age" error={errors.age}>
            <Input id="age" type="number" value={Number.isNaN(data.age) ? "" : data.age} onChange={num("age")} className={invalid("age")} />
          </Field>
          <Field label="Gender" id="gender" error={errors.gender}>
            <Select value={data.gender} onValueChange={(v) => set("gender", v)}>
              <SelectTrigger id="gender" className={invalid("gender")}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="other">Other / Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Course / Department" id="department" error={errors.department}>
            <Select value={data.department} onValueChange={(v) => set("department", v)}>
              <SelectTrigger id="department" className={invalid("department")}><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cse">Computer Science & Engineering</SelectItem>
                <SelectItem value="it">Information Technology</SelectItem>
                <SelectItem value="ece">Electronics & Communication</SelectItem>
                <SelectItem value="mech">Mechanical Engineering</SelectItem>
                <SelectItem value="civil">Civil Engineering</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Year of Study" id="year" error={errors.year}>
            <Select value={data.year} onValueChange={(v) => set("year", v)}>
              <SelectTrigger id="year" className={invalid("year")}><SelectValue placeholder="Select year" /></SelectTrigger>
              <SelectContent>
                {["1", "2", "3", "4"].map((y) => <SelectItem key={y} value={y}>Year {y}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section step="02" title="Academic Information" description="Marks and attendance from the current and previous semester.">
          <Field label="Previous Semester Marks (%)" id="previousMarks" error={errors.previousMarks}>
            <Input id="previousMarks" type="number" min={0} max={100} value={Number.isNaN(data.previousMarks) ? "" : data.previousMarks} onChange={num("previousMarks")} className={invalid("previousMarks")} />
          </Field>
          <Field label="Internal Assessment Marks (%)" id="internalMarks" error={errors.internalMarks}>
            <Input id="internalMarks" type="number" min={0} max={100} value={Number.isNaN(data.internalMarks) ? "" : data.internalMarks} onChange={num("internalMarks")} className={invalid("internalMarks")} />
          </Field>
          <Field label="Assignment Score (%)" id="assignmentScore" error={errors.assignmentScore}>
            <Input id="assignmentScore" type="number" min={0} max={100} value={Number.isNaN(data.assignmentScore) ? "" : data.assignmentScore} onChange={num("assignmentScore")} className={invalid("assignmentScore")} />
          </Field>
          <Field label="Number of Backlogs" id="backlogs" error={errors.backlogs}>
            <Input id="backlogs" type="number" min={0} value={Number.isNaN(data.backlogs) ? "" : data.backlogs} onChange={num("backlogs")} className={invalid("backlogs")} />
          </Field>
          <div className="space-y-3 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="attendance" className="text-sm font-medium">Attendance Percentage</Label>
              <span className="text-sm font-semibold tabular-nums">{data.attendance}%</span>
            </div>
            <Slider id="attendance" min={0} max={100} step={1} value={[data.attendance]} onValueChange={([v]) => set("attendance", v ?? 0)} aria-label="Attendance percentage" />
          </div>
        </Section>

        <Section step="03" title="Study & Lifestyle" description="Habits that commonly influence academic outcomes.">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Average Study Hours / Day</Label>
              <span className="text-sm font-semibold tabular-nums">{data.studyHours} hrs</span>
            </div>
            <Slider min={0} max={12} step={0.5} value={[data.studyHours]} onValueChange={([v]) => set("studyHours", v ?? 0)} aria-label="Study hours per day" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Sleep Hours / Day</Label>
              <span className="text-sm font-semibold tabular-nums">{data.sleepHours} hrs</span>
            </div>
            <Slider min={3} max={12} step={0.5} value={[data.sleepHours]} onValueChange={([v]) => set("sleepHours", v ?? 0)} aria-label="Sleep hours per day" />
          </div>
          <Field label="Previous Exam Score (%)" id="previousExamScore" error={errors.previousExamScore}>
            <Input id="previousExamScore" type="number" min={0} max={100} value={Number.isNaN(data.previousExamScore) ? "" : data.previousExamScore} onChange={num("previousExamScore")} className={invalid("previousExamScore")} />
          </Field>
          <div className="flex items-center justify-between rounded-md border px-4 py-3 self-end">
            <div>
              <Label htmlFor="extracurricular" className="text-sm font-medium">Extracurricular Activity</Label>
              <p className="text-xs text-muted-foreground">Clubs, sports or societies</p>
            </div>
            <Switch id="extracurricular" checked={data.extracurricular} onCheckedChange={(v) => set("extracurricular", v)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="text-sm font-medium">Internet / Study Resource Availability</Label>
            <RadioGroup value={data.resources} onValueChange={(v) => set("resources", v as StudentFormData["resources"])} className="grid gap-2 sm:grid-cols-3">
              {[
                { v: "good", l: "Reliable access" },
                { v: "limited", l: "Limited access" },
                { v: "none", l: "No access" },
              ].map((o) => (
                <Label key={o.v} htmlFor={`res-${o.v}`} className="flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm font-normal hover:bg-muted has-[[data-state=checked]]:border-primary">
                  <RadioGroupItem id={`res-${o.v}`} value={o.v} /> {o.l}
                </Label>
              ))}
            </RadioGroup>
          </div>
        </Section>

        <div className="flex flex-col-reverse items-stretch justify-end gap-3 border-t pt-6 sm:flex-row sm:items-center">
          {Object.keys(errors).some((k) => errors[k as keyof Errors]) && (
            <p className="text-sm text-destructive sm:mr-auto">Please correct the highlighted fields.</p>
          )}
          <Button type="button" variant="outline" onClick={() => { setData(initial); setErrors({}); }}>Reset</Button>
          <Button type="submit" disabled={loading} className="min-w-44">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</> : "Predict Performance"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function downloadPDF(result: PredictionResult) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  // Header gradient bar
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, W, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Student Performance Report", 14, 13);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}`, 14, 21);
  doc.text(`Student ID: ${result.studentId}`, W - 14, 21, { align: "right" });

  // Score section
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Prediction Summary", 14, 42);

  const metrics = [
    ["Predicted Score", `${result.score} / 100`],
    ["Performance Status", result.status],
    ["Expected Grade", result.grade],
    ["Academic Risk", result.risk],
    ["Attendance", `${result.attendance}%`],
    ["Study Hours", `${result.studyHours} hrs/day`],
  ];
  let y = 50;
  metrics.forEach(([label, value], i) => {
    if (i % 2 === 0) doc.setFillColor(248, 248, 255);
    else doc.setFillColor(255, 255, 255);
    doc.rect(14, y - 4, W - 28, 9, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 120);
    doc.text(label, 16, y + 1);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(String(value), W - 16, y + 1, { align: "right" });
    y += 10;
  });

  // Insights
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Performance Analysis", 14, y);
  y += 8;
  result.insights.forEach((insight) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 80);
    const lines = doc.splitTextToSize(`• ${insight}`, W - 32);
    doc.text(lines, 16, y);
    y += lines.length * 5 + 2;
  });

  // Recommendations
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Areas for Improvement", 14, y);
  y += 8;
  result.recommendations.forEach((rec, i) => {
    doc.setFillColor(240, 240, 255);
    doc.rect(14, y - 4, W - 28, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(99, 102, 241);
    doc.text(`${String(i + 1).padStart(2, "0")}  ${rec.title}`, 16, y + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 80);
    const lines = doc.splitTextToSize(rec.detail, W - 36);
    doc.text(lines, 16, y + 7);
    y += 20;
  });

  // Footer
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 280, W, 17, "F");
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 255);
  doc.text("Student Performance Predictor · Academic Project · Predictions are AI estimates and should support academic advising.", 14, 291);

  doc.save(`SPP_Report_${result.studentId}_${Date.now()}.pdf`);
}

function ResultView({ result, onReset }: { result: PredictionResult; onReset: () => void }) {
  const tone = riskTone(result.risk);
  return (
    <div className="page-enter mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader eyebrow={`Prediction result · ${result.studentId}`} title="Performance Prediction" subtitle="Estimated outcome based on the submitted academic and lifestyle information." />

      <div className="panel flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
        <ScoreRing score={result.score} />
        <div className="text-center sm:text-left">
          <p className="text-sm text-muted-foreground">Predicted Score</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">{result.score} / 100</p>
          <p className={`mt-2 inline-flex items-center gap-2 text-sm font-medium ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-destructive"}`}>
            <span className="h-2 w-2 rounded-full bg-current" /> {result.status}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Attendance" value={`${result.attendance}%`} />
        <MetricCard label="Academic Risk" value={result.risk} tone={tone} />
        <MetricCard label="Study Hours" value={`${result.studyHours} hrs/day`} />
        <MetricCard label="Expected Grade" value={result.grade} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-base font-semibold">Performance Analysis</h2>
          <ul className="panel mt-3 divide-y">
            {result.insights.map((i) => (
              <li key={i} className="flex gap-3 p-4 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-highlight" />
                {i}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-base font-semibold">Areas for Improvement</h2>
          <div className="mt-3 space-y-3">
            {result.recommendations.map((r, i) => <RecommendationCard key={r.title} index={i + 1} {...r} />)}
          </div>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">
        <Button variant="outline" onClick={onReset}><RotateCcw className="h-4 w-4" /> Predict Again</Button>
        <Button variant="outline" onClick={() => downloadPDF(result)} className="gap-2">
          <Download className="h-4 w-4" /> Download PDF Report
        </Button>
        <Button asChild><Link to="/dashboard">View Detailed Dashboard</Link></Button>
      </div>
    </div>
  );
}

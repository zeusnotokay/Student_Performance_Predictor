import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/site/shared";
import { getGoalSuggestion, type GoalResult, type GoalSuggestion } from "@/lib/predict";
import { useRequireAuth } from "@/lib/require-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/goals")({
  head: () => ({
    meta: [
      { title: "Goal Setting — Student Performance Predictor" },
      { name: "description", content: "Set a target score and get AI-powered suggestions on what to improve." },
    ],
  }),
  component: GoalsPage,
});

function PriorityBadge({ priority }: { priority: GoalSuggestion["priority"] }) {
  const config = {
    high: { label: "High Priority", cls: "bg-destructive/10 text-destructive border-destructive/20" },
    medium: { label: "Medium", cls: "bg-warning/10 text-warning border-warning/20" },
    low: { label: "On Track", cls: "bg-success/10 text-success border-success/20" },
  };
  const { label, cls } = config[priority];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function SuggestionCard({ suggestion, index }: { suggestion: GoalSuggestion; index: number }) {
  const Icon = suggestion.priority === "low" ? CheckCircle2 : AlertTriangle;
  const iconCls = suggestion.priority === "low" ? "text-success" : suggestion.priority === "medium" ? "text-warning" : "text-destructive";
  return (
    <div className="panel flex gap-4 p-5 transition-all hover:shadow-md animate-in slide-in-from-bottom-2">
      <div className={`mt-0.5 shrink-0 ${iconCls}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="font-semibold text-sm">{suggestion.field}</p>
          <PriorityBadge priority={suggestion.priority} />
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{suggestion.message}</p>
      </div>
    </div>
  );
}

function ScoreGauge({ current, target }: { current: number; target: number }) {
  const max = 100;
  const currentPct = (current / max) * 100;
  const targetPct = (target / max) * 100;
  const gap = target - current;
  const color = gap <= 0 ? "text-success" : gap <= 10 ? "text-warning" : "text-destructive";

  return (
    <div className="panel p-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">Score Gap Analysis</p>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Current Predicted Score</span>
            <span className="font-bold text-foreground">{current}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${currentPct}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Target Score</span>
            <span className="font-bold text-foreground">{target}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${targetPct}%`, background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3 mt-2">
          <span className="text-sm text-muted-foreground">Gap to close</span>
          <span className={`text-2xl font-bold tabular-nums ${color}`}>
            {gap > 0 ? `+${gap.toFixed(1)}` : `${gap.toFixed(1)}`} pts
          </span>
        </div>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const allowed = useRequireAuth();
  const [targetScore, setTargetScore] = useState(80);
  const [studyHours, setStudyHours] = useState(3.5);
  const [attendance, setAttendance] = useState(80);
  const [previousMarks, setPreviousMarks] = useState(70);
  const [internalMarks, setInternalMarks] = useState(65);
  const [assignmentScore, setAssignmentScore] = useState(72);
  const [backlogs, setBacklogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GoalResult | null>(null);

  if (!allowed) return null;

  async function analyze() {
    setLoading(true);
    try {
      const r = await getGoalSuggestion({
        targetScore,
        studyHours,
        attendance,
        previousMarks,
        internalMarks,
        assignmentScore,
        backlogs,
        sleepHours: 7,
        previousExamScore: previousMarks,
        extracurricular: false,
        resources: "good",
        studentId: "",
        age: 20,
        gender: "",
        department: "",
        year: "",
      });
      setResult(r);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to analyze. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-enter mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Goal Setting"
        title="Set Your Target & Get a Plan"
        subtitle="Enter your current academic situation, set a target score, and the AI will tell you exactly what to improve."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Input Panel */}
        <div className="panel p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold">Target Score</Label>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <Slider
                min={50} max={100} step={1}
                value={[targetScore]}
                onValueChange={([v]) => setTargetScore(v ?? 80)}
                className="flex-1"
                aria-label="Target score"
              />
              <span className="text-2xl font-bold text-primary tabular-nums w-16 text-right">{targetScore}%</span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 border-t pt-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-medium">Study Hours / Day</Label>
                <span className="text-sm font-bold tabular-nums">{studyHours} hrs</span>
              </div>
              <Slider min={0} max={12} step={0.5} value={[studyHours]} onValueChange={([v]) => setStudyHours(v ?? 0)} aria-label="Study hours" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-medium">Attendance %</Label>
                <span className="text-sm font-bold tabular-nums">{attendance}%</span>
              </div>
              <Slider min={0} max={100} step={1} value={[attendance]} onValueChange={([v]) => setAttendance(v ?? 0)} aria-label="Attendance" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-prev-marks" className="text-sm font-medium">Previous Marks (%)</Label>
              <Input id="goal-prev-marks" type="number" min={0} max={100} value={previousMarks}
                onChange={e => setPreviousMarks(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-internal" className="text-sm font-medium">Internal Marks (%)</Label>
              <Input id="goal-internal" type="number" min={0} max={100} value={internalMarks}
                onChange={e => setInternalMarks(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-assignment" className="text-sm font-medium">Assignment Score (%)</Label>
              <Input id="goal-assignment" type="number" min={0} max={100} value={assignmentScore}
                onChange={e => setAssignmentScore(Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-backlogs" className="text-sm font-medium">Number of Backlogs</Label>
              <Input id="goal-backlogs" type="number" min={0} max={20} value={backlogs}
                onChange={e => setBacklogs(Number(e.target.value))} />
            </div>
          </div>

          <Button onClick={analyze} disabled={loading} className="w-full gap-2" size="lg">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</> : <><TrendingUp className="h-4 w-4" /> Analyze My Goal</>}
          </Button>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {result ? (
            <>
              <ScoreGauge current={result.currentScore} target={result.targetScore} />
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Action Plan ({result.suggestions.length} suggestions)</p>
                {result.suggestions.map((s, i) => (
                  <SuggestionCard key={i} suggestion={s} index={i + 1} />
                ))}
              </div>
            </>
          ) : (
            <div className="panel flex flex-col items-center justify-center gap-4 p-10 text-center h-full min-h-[300px]">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-primary/10">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Set your target & analyze</p>
                <p className="mt-1 text-sm text-muted-foreground">Fill in your current scores, set a target, and click <strong>Analyze My Goal</strong> to get a personalized action plan.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

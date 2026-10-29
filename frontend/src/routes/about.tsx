import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/site/shared";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Student Performance Predictor" },
      { name: "description", content: "How the Student Performance Predictor uses a machine learning model to estimate academic performance." },
      { property: "og:title", content: "About — Student Performance Predictor" },
      { property: "og:description", content: "Objective, process and model behind the Student Performance Predictor." },
    ],
  }),
  component: About,
});

const steps = [
  { n: "01", t: "Enter academic data", d: "Marks, attendance, backlogs and study habits are entered through the prediction form." },
  { n: "02", t: "ML model analyzes the data", d: "A trained regression model weighs each factor based on patterns in historical student records." },
  { n: "03", t: "Receive performance prediction", d: "The system returns an estimated score, grade, risk level and suggested areas to improve." },
];

function About() {
  return (
    <div className="page-enter mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="About the project"
        title="What is Student Performance Predictor?"
        subtitle="A machine-learning-based academic analytics system designed to estimate student performance using academic, attendance and behavioral factors."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-sm font-semibold">Objective</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            To help students and faculty identify, early in the semester, who may need additional
            academic support — so that interventions happen before final examinations, not after.
          </p>
        </section>
        <section className="panel p-6">
          <h2 className="text-sm font-semibold">Machine Learning Model</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The model is trained on anonymised student records using supervised learning (e.g. Random
            Forest or Linear Regression). It is evaluated on held-out data and served through a
            Python API. Predictions are estimates, not guarantees.
          </p>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-base font-semibold">How it works</h2>
        <ol className="mt-4 grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="bg-card p-6">
              <span className="text-sm font-semibold tabular-nums text-highlight">{s.n}</span>
              <p className="mt-3 text-sm font-semibold">{s.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-base font-semibold">Benefits</h2>
        <ul className="panel mt-4 divide-y text-sm">
          {[
            "Early identification of students at academic risk",
            "Clear view of which factors most affect performance",
            "Practical, specific recommendations for improvement",
            "Supports faculty advisors with data instead of guesswork",
          ].map((b) => (
            <li key={b} className="flex gap-3 p-4">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {b}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10">
        <Button asChild><Link to="/predict">Try a prediction</Link></Button>
      </div>
    </div>
  );
}

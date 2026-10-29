import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authRequest, saveAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Student Login — Student Performance Predictor" }, { name: "description", content: "Sign in or create a student account." }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const result = await authRequest(register ? "register" : "login", { name, studentId: id.trim(), password: pw });
      saveAuth(result.token, result.user);
      await navigate({ to: "/dashboard" });
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in. Check the backend and MySQL connection."); }
    finally { setLoading(false); }
  }

  return (
    <div className="page-enter mx-auto flex min-h-[75vh] max-w-sm flex-col justify-center px-4 py-12">
      <div className="mb-6 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">SP</div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{register ? "Create student account" : "Welcome back"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{register ? "Register to access your performance dashboard." : "Sign in to continue to your student dashboard."}</p>
      </div>
      <form className="panel space-y-4 p-6" onSubmit={submit}>
        {register && <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required /></div>}
        <div className="space-y-1.5"><Label htmlFor="sid">Student ID</Label><Input id="sid" autoComplete="username" value={id} onChange={e => setId(e.target.value)} placeholder="Enter your student ID" required /></div>
        <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" autoComplete={register ? "new-password" : "current-password"} value={pw} onChange={e => setPw(e.target.value)} minLength={register ? 6 : 1} required />{register && <p className="text-xs text-muted-foreground">Use at least 6 characters.</p>}</div>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Please wait…" : register ? "Create account" : "Sign in"}</Button>
        <p className="text-center text-sm text-muted-foreground">{register ? "Already registered?" : "New student?"} <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => { setRegister(!register); setError(""); }}>{register ? "Sign in" : "Create an account"}</button></p>
      </form>
      <p className="mt-4 text-center text-xs text-muted-foreground">Your account is stored in the configured MySQL database.</p>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getUser, isLoggedIn, logout } from "@/lib/auth";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/predict", label: "Predict" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/goals", label: "Goals" },
  { to: "/about", label: "About" },
] as const;

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 font-semibold text-foreground">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">SP</span>
      <span className="text-sm sm:text-[15px]">Student Performance Predictor</span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const signedIn = typeof window !== "undefined" && isLoggedIn();
  const user = typeof window !== "undefined" ? getUser() : null;
  const signOut = () => { logout(); setOpen(false); void navigate({ to: "/login", replace: true }); };
  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: true }}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? <><span className="max-w-28 truncate text-xs text-muted-foreground">{user?.name ?? user?.studentId}</span><Button variant="ghost" size="sm" onClick={signOut}>Log out</Button></> : <Button variant="ghost" size="sm" asChild><Link to="/login">Student Login</Link></Button>}
          {!signedIn && <Button size="sm" asChild><Link to="/login">Get Started</Link></Button>}
        </div>
        <button
          className="rounded-md p-2 text-foreground md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="border-t bg-card md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                activeOptions={{ exact: true }}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"
                activeProps={{ className: "text-foreground font-medium bg-muted" }}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-3 flex gap-2 border-t pt-3">
              {signedIn ? <Button variant="outline" size="sm" className="flex-1" onClick={signOut}>Log out</Button> : <><Button variant="outline" size="sm" className="flex-1" asChild><Link to="/login" onClick={() => setOpen(false)}>Student Login</Link></Button><Button size="sm" className="flex-1" asChild><Link to="/login" onClick={() => setOpen(false)}>Get Started</Link></Button></>}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>Student Performance Predictor · Academic project</span>
        <span>Predictions are estimates and should support, not replace, academic advising.</span>
      </div>
    </footer>
  );
}

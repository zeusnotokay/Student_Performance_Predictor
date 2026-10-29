import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isLoggedIn } from "@/lib/auth";

export function useRequireAuth() {
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    if (!isLoggedIn()) { void navigate({ to: "/login", replace: true }); }
    else setAllowed(true);
  }, [navigate]);
  return allowed;
}

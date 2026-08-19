import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/brothers/AppShell";
import { supabase } from "@/lib/supabase";
import { ensureClienteForCurrentUser, getCurrentUserRole } from "@/lib/brothers/auth";

export const Route = createFileRoute("/app")({
  component: AppGuard,
});

function AppGuard() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (!data.session) {
        navigate({ to: "/login" });
        return;
      }
      try {
        await ensureClienteForCurrentUser(data.session.user.email || "");
        const role = await getCurrentUserRole();
        if (role === "tecnico" || role === "admin") {
          navigate({ to: "/tecnico" });
          return;
        }
      } catch (err) {
        console.error("Erro ao garantir cliente do usuário:", err);
      }
      if (active) setChecking(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate({ to: "/login" });
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

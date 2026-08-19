import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TecnicoShell } from "@/components/brothers/TecnicoShell";
import { supabase } from "@/lib/supabase";
import { getCurrentUserRole } from "@/lib/brothers/auth";

export const Route = createFileRoute("/tecnico")({
  component: TecnicoGuard,
});

function TecnicoGuard() {
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
        const role = await getCurrentUserRole();
        if (role === "cliente" || role === null) {
          navigate({ to: "/app" });
          return;
        }
      } catch (err) {
        console.error("Erro ao verificar papel do usuário:", err);
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
    <TecnicoShell>
      <Outlet />
    </TecnicoShell>
  );
}

import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Snowflake, ClipboardList, User } from "lucide-react";

const TABS: { to: string; label: string; icon: any; exact?: boolean }[] = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/equipamentos", label: "Equipamentos", icon: Snowflake },
  { to: "/app/chamados", label: "Chamados", icon: ClipboardList },
  { to: "/app/perfil", label: "Perfil", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto w-full max-w-xl px-5 pt-6 sm:max-w-2xl sm:px-8">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-stretch justify-between px-2 py-2 sm:max-w-2xl">
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to as any}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <t.icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";

export function AuthCard({
  title,
  subtitle,
  back = "/",
  step,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  step?: { current: number; total: number };
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6 sm:max-w-lg sm:px-8">
        <div className="flex items-center justify-between">
          <Link to={back} className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card text-foreground transition hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Logo size="sm" />
        </div>

        {step && (
          <div className="mt-8 flex items-center gap-2">
            {Array.from({ length: step.total }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition ${i < step.current ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
        )}

        <div className="mt-8">
          <h1 className="text-3xl font-black tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="mt-8 flex-1">{children}</div>
      </div>
    </main>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full h-12 rounded-xl border border-input bg-card px-4 text-[15px] placeholder:text-muted-foreground/60 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

export const primaryBtn =
  "inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-[0_20px_40px_-20px_rgba(37,99,235,0.5)] transition hover:bg-primary/90 disabled:opacity-50";
import { Snowflake } from "lucide-react";

export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const t = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`grid ${s} place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_8px_24px_-8px_rgba(37,99,235,0.6)]`}>
        <Snowflake className="h-1/2 w-1/2" />
      </div>
      <span className={`font-extrabold tracking-tight ${t}`}>Brothers</span>
    </div>
  );
}
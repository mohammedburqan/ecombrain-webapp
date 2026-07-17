import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-ink-muted">{label}</span>
        {icon ? <span className="text-brand-accent">{icon}</span> : null}
      </div>
      <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
    </div>
  );
}

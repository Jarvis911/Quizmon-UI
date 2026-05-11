import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";

/** Filter / toolbar strip — matches Classrooms & Billing "card" panels */
export const adminFilterPanelClass =
  "flex flex-col md:flex-row gap-3 md:gap-4 bg-card p-4 md:p-6 rounded-lg border shadow-sm";

/** Text inputs & selects in admin */
export const adminFieldClass =
  "w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

/** Table outer shell */
export const adminTableShellClass =
  "rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden";

type AdminPageHeaderProps = {
  title: string;
  subtitle: string;
  actions?: ReactNode;
};

export function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div className="space-y-1.5 min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm max-w-3xl">
          {subtitle}
        </p>
      </div>
      {actions ? <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-4 shrink-0">{actions}</div> : null}
    </div>
  );
}

export function AdminLoading({ label = "Đang tải…" }: { label?: string }) {
  return (
    <div className="flex flex-col justify-center items-center min-h-[40vh] gap-4 text-muted-foreground font-black">
      <Loader2 className="animate-spin text-primary w-10 h-10" />
      <span className="text-sm uppercase tracking-widest">{label}</span>
    </div>
  );
}

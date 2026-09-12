import { ArrowLeft } from "./Icons";

interface BackButtonProps {
  onBack: () => void;
  label?: string;
  crumbs?: { label: string; onClick?: () => void }[];
  className?: string;
}

export default function BackButton({ onBack, label = "Back to Dashboard", crumbs, className = "" }: BackButtonProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[var(--border)] ${className}`}>
      <button
        onClick={onBack}
        type="button"
        className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-[var(--foreground)] bg-white border border-[var(--border)] rounded-md hover:bg-[var(--secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40 transition-all shadow-xs group focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        title="Return to previous screen"
      >
        <ArrowLeft size={16} strokeWidth={2} className="text-slate-600 transition-transform group-hover:-translate-x-0.5" />
        <span>{label}</span>
      </button>

      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <span key={c.label} className="flex items-center gap-2">
                {i > 0 && <span className="opacity-40">/</span>}
                {c.onClick && !isLast ? (
                  <button
                    onClick={c.onClick}
                    type="button"
                    className="hover:text-[var(--accent)] hover:underline transition-colors"
                  >
                    {c.label}
                  </button>
                ) : (
                  <span className={isLast ? "font-semibold text-[var(--foreground)]" : ""}>{c.label}</span>
                )}
              </span>
            );
          })}
        </nav>
      )}
    </div>
  );
}

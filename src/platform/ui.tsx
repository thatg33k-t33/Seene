import type { ReactNode } from "react";

/** SOURCE OF TRUTH: Panel, Command, StatusPill, buttonPrimary, buttonQuiet, fieldClass.
 * WHAT: the platform's shared presentation primitives.
 * WHY: one visual language for Projects, Studio, Settings and Presentation.
 * WHERE: src/platform views compose these elements.
 */

export const buttonPrimary = "inline-flex h-10 items-center justify-center rounded-lg bg-[#f1f1f4] px-4 text-sm font-medium text-[#111114] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 disabled:opacity-40";
export const buttonQuiet = "inline-flex h-10 items-center justify-center rounded-lg border border-[#303038] px-4 text-sm font-medium text-[#85858e] transition-colors hover:border-[#55555d] hover:text-[#f1f1f4] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 disabled:opacity-40";
export const fieldClass = "h-10 w-full rounded-lg border border-[#303038] bg-[#19191e] px-3 font-mono text-sm text-[#f1f1f4] placeholder:text-[#55555d] focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2";

export function Command({ children }: { children: ReactNode }) {
  return <code className="rounded-md border border-[#303038] bg-[#19191e] px-3 py-2 font-mono text-xs text-[#f1f1f4]">{children}</code>;
}

export function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      data-status={ok ? "connected" : "pending"}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${ok ? "border-[#2f4a37] bg-[#16221a] text-[#9fe0b4]" : "border-[#4a3f2f] bg-[#221d16] text-[#e0c79f]"}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-[#9fe0b4]" : "bg-[#e0c79f]"}`} />
      {label}
    </span>
  );
}

export function Panel({ title, description, actions, children, className = "" }: { title: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[#222228] bg-[#16161a] ${className}`}>
      <header className="flex items-start justify-between gap-4 border-b border-[#222228] px-6 py-5">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-[#f1f1f4] uppercase">{title}</h2>
          {description && <p className="mt-1 text-sm text-[#85858e]">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

export function Notice({ tone = "error", children }: { tone?: "error" | "info"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm ${tone === "error" ? "border-[#4a2f2f] bg-[#221717] text-[#e0a9a9]" : "border-[#303038] bg-[#19191e] text-[#85858e]"}`}
    >
      {children}
    </p>
  );
}

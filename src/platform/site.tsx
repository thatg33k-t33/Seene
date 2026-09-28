/** SOURCE OF TRUTH: Seene site chrome.
 * WHAT: shared marketing/platform frame, buttons, kbd and icons.
 * WHY: keep one zed-like quiet system instead of duplicated markup.
 * WHERE: platform views render the public site and project console.
 */
import type { ReactNode } from "react";

export type RailSegment = { kind: "solid" | "dashed"; flex: number };
export const DEFAULT_RAIL: RailSegment[] = [
  { kind: "solid", flex: 3 },
  { kind: "dashed", flex: 2 },
  { kind: "solid", flex: 5 },
  { kind: "dashed", flex: 1 },
];

export function FrameSection({
  children,
  edge = "both",
  rails,
  texture = false,
  label,
}: {
  children: ReactNode;
  edge?: "top" | "bottom" | "both" | "none";
  rails?: RailSegment[];
  texture?: boolean;
  label?: string;
}) {
  const segments = rails ?? DEFAULT_RAIL;
  const showTop = edge === "top" || edge === "both";
  const showBottom = edge === "bottom" || edge === "both";
  const rail = (side: string) => (
    <div className="seene-rail" aria-hidden="true" data-seene-rail={side}>
      {segments.map((segment, index) => (
        <span
          key={`${side}-${index}`}
          className={segment.kind === "solid" ? "seene-rail-seg-solid" : "seene-rail-seg-dashed"}
          style={{ flexGrow: segment.flex, flexBasis: 0 }}
        />
      ))}
    </div>
  );
  return (
    <section className="seene-frame" aria-label={label}>
      {showTop && (
        <>
          <span className="seene-node hidden lg:block" style={{ left: "calc(50% - 36rem - 3.5px)", top: "-3.5px" }} aria-hidden="true" />
          <span className="seene-node hidden lg:block" style={{ right: "calc(50% - 36rem - 3.5px)", top: "-3.5px" }} aria-hidden="true" />
        </>
      )}
      <div className="seene-frame-row">
        <div className={`seene-gutter seene-gutter-left${texture ? " seene-gutter-texture" : ""}`} aria-hidden="true" />
        {rail("left")}
        <div className="seene-frame-content">{children}</div>
        {rail("right")}
        <div className={`seene-gutter seene-gutter-right${texture ? " seene-gutter-texture" : ""}`} aria-hidden="true" />
      </div>
      {showBottom && (
        <>
          <span className="seene-node" style={{ left: "calc(50% - min(36rem, 100vw - 3rem) - 3.5px)", bottom: "-3.5px" }} aria-hidden="true" />
          <span className="seene-node" style={{ right: "calc(50% - min(36rem, 100vw - 3rem) - 3.5px)", bottom: "-3.5px" }} aria-hidden="true" />
        </>
      )}
    </section>
  );
}

export function Kbd({ children, onPrimary = false }: { children: ReactNode; onPrimary?: boolean }) {
  return (
    <kbd aria-hidden="true" className={onPrimary ? "seene-kbd seene-kbd-on-primary" : "seene-kbd"}>
      {children}
    </kbd>
  );
}

type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "nav" | "cta";
  kbd?: ReactNode;
  loading?: boolean;
  className?: string;
  children: ReactNode;
} & ({ href: string } & Record<string, unknown> | { href?: undefined } & Record<string, unknown>);

export function SeeneButton(props: ButtonProps) {
  const { variant = "secondary", size = "nav", kbd, loading, className = "", children, ...rest } = props as {
    variant?: "primary" | "secondary" | "ghost"; size?: "nav" | "cta"; kbd?: ReactNode; loading?: boolean;
    className?: string; children: ReactNode; href?: string; disabled?: boolean;
  } & Record<string, unknown>;
  const cls = ["seene-btn", `seene-btn-${variant}`, size === "cta" ? "seene-btn-cta" : "seene-btn-nav", className]
    .filter(Boolean).join(" ");
  const inner = (
    <>
      {loading ? <span className="seene-spinner" aria-hidden="true" /> : null}
      <span>{loading ? "Working…" : children}</span>
      {kbd && !loading ? kbd : null}
    </>
  );
  const { href } = rest as { href?: string };
  if (href) {
    const { disabled: _disabled, ...anchorRest } = rest as Record<string, unknown>;
    return <a href={href} className={cls} {...(anchorRest as object)}>{inner}</a>;
  }
  return <button className={cls} disabled={loading || (rest as { disabled?: boolean }).disabled} {...(rest as object)}>{inner}</button>;
}

export function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 2v10M2 7h10" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="6" cy="6" r="4.2" />
      <path d="m9.3 9.3 3 3" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" />
    </svg>
  );
}

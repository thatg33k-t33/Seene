/** SOURCE OF TRUTH: Seene site chrome.
 * WHAT: shared marketing/platform frame, header, buttons, kbd and icons.
 * WHY: keep one zed-like quiet system instead of duplicated markup.
 * WHERE: platform views render the public site and project console.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SEENE_BRAND } from "../core/branding";
import { HOME_ROUTE, PROJECTS_ROUTE } from "./api";

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
  const { variant = "secondary", size = "nav", kbd, loading, className = "", children, disabled, ...rest } = props as {
    variant?: "primary" | "secondary" | "ghost"; size?: "nav" | "cta"; kbd?: ReactNode; loading?: boolean;
    className?: string; children: ReactNode; href?: string; disabled?: boolean; type?: string;
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
  return <button className={cls} disabled={loading || disabled} {...(rest as object)}>{inner}</button>;
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

export function SiteHeader({ onPalette }: { onPalette: () => void }) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const palette = () => onPalette();
    window.addEventListener("seene:palette", palette);
    return () => window.removeEventListener("seene:palette", palette);
  }, [onPalette]);
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  return (
    <header className="seene-site-header" role="banner">
      <div className="seene-frame-row" style={{ height: 57 }}>
        <div className="seene-gutter seene-gutter-left" aria-hidden="true" />
        <div className="seene-rail" aria-hidden="true"><span className="seene-rail-seg-solid" style={{ flexGrow: 1 }} /></div>
        <div className="seene-frame-content">
          <nav aria-label="Primary" className="flex h-[57px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1">
              <a href={HOME_ROUTE} className="flex items-center gap-2" aria-label="Seene home">
                <img src={`${import.meta.env.BASE_URL}logo-seene.png`} alt="" width={23} height={23} style={{ height: 23, width: "auto" }} />
                <span className="text-[15px] font-semibold tracking-tight">{SEENE_BRAND.name}</span>
              </a>
              <div className="ml-3 hidden items-center gap-0.5 lg:flex">
                <a className="seene-nav-item" href="#install">Install</a>
                <a className="seene-nav-item" href={SEENE_BRAND.docs} target="_blank" rel="noreferrer noopener">Docs</a>
                <a className="seene-nav-item" href={SEENE_BRAND.examples} target="_blank" rel="noreferrer noopener">Examples</a>
              </div>
            </div>
            <div className="hidden items-center gap-1.5 lg:flex">
              <a className="seene-btn seene-btn-ghost seene-btn-nav" href={SEENE_BRAND.repository} target="_blank" rel="noreferrer noopener">
                GitHub
              </a>
              <a className="seene-btn seene-btn-primary seene-btn-nav" href="#install">Get started <Kbd onPrimary>I</Kbd></a>
            </div>
            <button type="button" className="seene-btn seene-btn-secondary seene-btn-nav lg:hidden" aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(value => !value)}>
              <MenuIcon />
            </button>
          </nav>
        </div>
        <div className="seene-rail" aria-hidden="true"><span className="seene-rail-seg-solid" style={{ flexGrow: 1 }} /></div>
        <div className="seene-gutter seene-gutter-right" aria-hidden="true" />
      </div>
      {mobileOpen && (
        <div className="lg:hidden" style={{ borderTop: "1px solid var(--seene-border)", background: "var(--seene-surface)" }}>
          <nav aria-label="Mobile" className="flex flex-col gap-1 p-4">
            <a className="seene-nav-item" href="#install" onClick={() => setMobileOpen(false)}>Install</a>
            <a className="seene-nav-item" href={SEENE_BRAND.docs} target="_blank" rel="noreferrer noopener">Docs</a>
            <a className="seene-nav-item" href={SEENE_BRAND.examples} target="_blank" rel="noreferrer noopener">Examples</a>
            <div className="mt-2 flex flex-wrap gap-2">
              <a className="seene-btn seene-btn-secondary seene-btn-nav" href={SEENE_BRAND.repository} target="_blank" rel="noreferrer noopener">GitHub</a>
              <a className="seene-btn seene-btn-primary seene-btn-nav" href="#install" onClick={() => setMobileOpen(false)}>Get started</a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/** Public-site shortcuts. There is no account to log in to, so these only
 * move around the page or jump to the install section. */
export function useSiteShortcuts() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const mod = event.metaKey || event.ctrlKey;
      if ((event.key === "k" || event.key === "K") && mod && !event.shiftKey) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("seene:palette"));
      } else if (!mod && !event.altKey && (event.key === "i" || event.key === "I")) {
        document.getElementById("install")?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}


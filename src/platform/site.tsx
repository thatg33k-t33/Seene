/** SOURCE OF TRUTH: Seene site chrome.
 * WHAT: shared marketing/platform frame, header, buttons, kbd and icons.
 * WHY: keep one zed-like quiet system instead of duplicated markup.
 * WHERE: platform views render the public site and project console.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SEENE_BRAND } from "../core/branding";
import { LOGIN_ROUTE, PROJECTS_ROUTE, SIGNUP_ROUTE, readRoute } from "./api";

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
  const [hash, setHash] = useState(() => (typeof window === "undefined" ? "" : window.location.hash));
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [account, setAccount] = useState<string | null>(() => {
    try { return localStorage.getItem("seene-account"); } catch { return null; }
  });
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    const palette = () => onPalette();
    window.addEventListener("seene:palette", palette);
    return () => window.removeEventListener("seene:palette", palette);
  }, [onPalette]);
  const route = readRoute(hash);
  const authed = account !== null;
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const logout = () => {
    try { localStorage.removeItem("seene-account"); } catch {}
    setAccount(null);
    window.location.hash = PROJECTS_ROUTE;
  };
  void route;
  void mac;
  void logout;
  void authed;
  return (
    <header className="seene-site-header" role="banner">
      <div className="seene-frame-row" style={{ height: 57 }}>
        <div className="seene-gutter seene-gutter-left" aria-hidden="true" />
        <div className="seene-rail" aria-hidden="true"><span className="seene-rail-seg-solid" style={{ flexGrow: 1 }} /></div>
        <div className="seene-frame-content">
          <nav aria-label="Primary" className="flex h-[57px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-1">
              <a href={PROJECTS_ROUTE} className="flex items-center gap-2" aria-label="Seene home">
                <img src="/logo-seene.png" alt="" width={23} height={23} style={{ height: 23, width: "auto" }} />
                <span className="text-[15px] font-semibold tracking-tight">{SEENE_BRAND.name}</span>
              </a>
              <div className="ml-3 hidden items-center gap-0.5 lg:flex">
                <div className="relative" onMouseLeave={() => setOpenMenu(null)}>
                  <button type="button" className="seene-nav-item" aria-expanded={openMenu === "product"} onMouseEnter={() => setOpenMenu("product")} onClick={() => setOpenMenu(openMenu === "product" ? null : "product")}>
                    Product
                  </button>
                  {openMenu === "product" && (
                    <div className="seene-dropdown" role="menu">
                      <a href={PROJECTS_ROUTE} role="menuitem">Studio<small>Compose cinematic scenes</small></a>
                      <a href={PROJECTS_ROUTE} role="menuitem">Scenes<small>Camera, focus and motion</small></a>
                    </div>
                  )}
                </div>
                <a className="seene-nav-item" href={PROJECTS_ROUTE}>Docs</a>
                <a className="seene-nav-item" href={PROJECTS_ROUTE}>Install</a>
              </div>
            </div>
            <div className="hidden items-center gap-1.5 lg:flex">
              <button type="button" className="seene-btn seene-btn-ghost seene-btn-nav" onClick={onPalette} aria-label="Command menu">
                <SearchIcon />
                <Kbd>{mac ? "⌘K" : "Ctrl+K"}</Kbd>
              </button>
              {authed ? (
                <button type="button" className="seene-btn seene-btn-secondary seene-btn-nav" onClick={logout}>Log out</button>
              ) : (
                <>
                  <a className="seene-btn seene-btn-ghost seene-btn-nav" href={LOGIN_ROUTE}>Log in <Kbd>L</Kbd></a>
                  <a className="seene-btn seene-btn-secondary seene-btn-nav" href={SIGNUP_ROUTE}>Sign up <Kbd>S</Kbd></a>
                </>
              )}
              <a className="seene-btn seene-btn-primary seene-btn-nav" href={PROJECTS_ROUTE}>Get Seene <Kbd onPrimary>I</Kbd></a>
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
            <a className="seene-nav-item" href={PROJECTS_ROUTE} onClick={() => setMobileOpen(false)}>Product</a>
            <a className="seene-nav-item" href={PROJECTS_ROUTE} onClick={() => setMobileOpen(false)}>Docs</a>
            <a className="seene-nav-item" href={PROJECTS_ROUTE} onClick={() => setMobileOpen(false)}>Install</a>
            <div className="mt-2 flex flex-wrap gap-2">
              {authed ? (
                <button type="button" className="seene-btn seene-btn-secondary seene-btn-nav" onClick={() => { logout(); setMobileOpen(false); }}>Log out</button>
              ) : (
                <>
                  <a className="seene-btn seene-btn-ghost seene-btn-nav" href={LOGIN_ROUTE} onClick={() => setMobileOpen(false)}>Log in</a>
                  <a className="seene-btn seene-btn-secondary seene-btn-nav" href={SIGNUP_ROUTE} onClick={() => setMobileOpen(false)}>Sign up</a>
                </>
              )}
              <a className="seene-btn seene-btn-primary seene-btn-nav" href={PROJECTS_ROUTE} onClick={() => setMobileOpen(false)}>Get Seene</a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export function useSiteShortcuts() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const mod = event.metaKey || event.ctrlKey;
      if ((event.key === "k" || event.key === "K") && mod && !event.shiftKey) {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("seene:palette"));
      } else if (!mod && !event.altKey && (event.key === "l" || event.key === "L")) {
        window.location.hash = LOGIN_ROUTE;
      } else if (!mod && !event.altKey && (event.key === "s" || event.key === "S")) {
        window.location.hash = SIGNUP_ROUTE;
      } else if (!mod && !event.altKey && (event.key === "i" || event.key === "I")) {
        window.location.hash = PROJECTS_ROUTE;
      } else if (!mod && !event.altKey && (event.key === "r" || event.key === "R")) {
        const field = document.getElementById("project-path") as HTMLInputElement | null;
        if (field) { event.preventDefault(); field.focus(); field.scrollIntoView({ block: "center" }); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}


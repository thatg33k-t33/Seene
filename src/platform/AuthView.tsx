/** SOURCE OF TRUTH: Seene account access.
 * WHAT: local login/signup form over the existing platform shell.
 * WHY: keep auth styling in platform without inventing a cloud service.
 * WHERE: Platform renders these routes from the site header.
 */
import { useState, type FormEvent } from "react";
import { PROJECTS_ROUTE, SIGNUP_ROUTE, LOGIN_ROUTE } from "./api";
import { FrameSection, Kbd } from "./site";
import { Notice } from "./ui";

export function AuthView({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const title = mode === "login" ? "Log in to Seene" : "Create your Seene account";
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for the password.");
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      try { localStorage.setItem("seene-account", email.trim()); } catch {}
      window.location.hash = PROJECTS_ROUTE;
    }, 350);
  };
  return (
    <FrameSection label={title} edge="both">
      <div className="mx-auto w-full max-w-md py-14">
        <div className="rounded-md border border-[var(--seene-border)] bg-[var(--seene-surface)] p-6 shadow-sm">
          <h1 className="seene-h2 text-3xl">{title}</h1>
          <p className="mt-2 text-center text-sm text-[var(--seene-text-muted)]">Local studio access. No cloud account leaves this machine.</p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            <label className="block space-y-1.5 text-sm">
              <span>Email</span>
              <input className="h-9 w-full rounded-sm border border-[var(--seene-border)] bg-[var(--seene-surface)] px-3 text-sm" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="you@studio.local" />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span>Password</span>
              <input className="h-9 w-full rounded-sm border border-[var(--seene-border)] bg-[var(--seene-surface)] px-3 text-sm" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="........" />
            </label>
            {error && <Notice>{error}</Notice>}
            <button type="submit" className="seene-btn seene-btn-primary seene-btn-cta w-full" disabled={busy}>
              {busy ? <span className="seene-spinner" aria-hidden="true" /> : null}
              <span>{busy ? "Working…" : mode === "login" ? "Log in" : "Sign up"}</span>
            </button>
            <button type="button" className="seene-btn seene-btn-secondary seene-btn-cta w-full" onClick={() => { try { localStorage.setItem("seene-account", "github-user"); } catch {} window.location.hash = PROJECTS_ROUTE; }}>
              Continue with GitHub
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-[var(--seene-text-muted)]">
            {mode === "login" ? (
              <>No account? <a className="underline" href={SIGNUP_ROUTE}>Sign up</a> <Kbd>S</Kbd></>
            ) : (
              <>Have an account? <a className="underline" href={LOGIN_ROUTE}>Log in</a> <Kbd>L</Kbd></>
            )}
          </p>
        </div>
      </div>
    </FrameSection>
  );
}

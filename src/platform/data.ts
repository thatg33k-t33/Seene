import { useEffect, useRef, useState } from "react";
import { readRoute, type Route } from "./api";

/** SOURCE OF TRUTH: useHashRoute, useResource.
 * WHAT: read the platform's hash route and load platform data into explicit loading, data and error states.
 * WHY: the product surface needs predictable navigation and exactly one data path per view.
 * WHERE: src/platform views use these hooks.
 */

export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => readRoute(typeof window === "undefined" ? "" : window.location.hash));
  useEffect(() => {
    const sync = () => setRoute(readRoute(window.location.hash));
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return route;
}

/**
 * `key` is the only reload trigger, so callers may pass a fresh closure on every render without refetching.
 */
export function useResource<T>(key: string, load: () => Promise<T>) {
  const loader = useRef(load);
  loader.current = load;
  const [state, setState] = useState<{ data?: T; error: string; loading: boolean }>({ error: "", loading: true });
  const [tick, setTick] = useState(0);
  const reload = () => setTick(value => value + 1);
  useEffect(() => {
    let active = true;
    setState(previous => ({ ...previous, loading: true, error: "" }));
    loader.current().then(
      data => { if (active) setState({ data, error: "", loading: false }); },
      error => { if (active) setState({ error: error instanceof Error ? error.message : "The platform request failed.", loading: false }); },
    );
    return () => { active = false; };
  }, [key, tick]);
  return { ...state, reload };
}


import { useState, type ReactNode } from "react";

/** A real application panel that scenes can present directly. */
export function WorkspacePanel({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section style={{ border: "1px solid #cfd8e3", borderRadius: 12, padding: 20, marginTop: 24, background: "#fff" }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
      <div style={{ marginTop: 12, color: "#48566b", fontSize: 14 }}>{children}</div>
    </section>
  );
}

export default function App() {
  const [refreshed, setRefreshed] = useState(0);
  return (
    <main style={{ padding: 40, minHeight: 640, background: "#f4f7fb", color: "#17233a", fontFamily: "system-ui" }}>
      <h1 style={{ margin: 0, fontSize: 32 }}>Acme workspace</h1>
      <p style={{ color: "#48566b" }}>Existing application state stays live inside every Seene scene.</p>
      <button type="button" onClick={() => setRefreshed(value => value + 1)}>Refresh feed {refreshed}</button>
      <WorkspacePanel title="Open conversations">
        <p>12 conversations waiting for a reply.</p>
      </WorkspacePanel>
      <WorkspacePanel title="This week">
        <p>Revenue is up 8% against last week.</p>
      </WorkspacePanel>
    </main>
  );
}

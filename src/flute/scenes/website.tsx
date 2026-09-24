import { Surface } from "@thatg33k/seene";

export default function WebsiteScene() {
  return (
    <Surface id="flute-application" style={{ width: 1400, height: 980 }}>
      <div className="p-12 max-w-xl mx-auto space-y-4">
        <h2 className="text-2xl font-medium text-white">Website</h2>
        <p className="text-neutral-400 text-sm">Authored and persisted live in Seene Studio.</p>
      </div>
    </Surface>
  );
}

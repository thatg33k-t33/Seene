import { SEENE_BRAND } from "../core/branding";
import type { ProjectResult } from "../core/project";

export type TerminalOptions = {
  interactive?: boolean;
  colorDepth?: number;
  columns?: number;
  unicode?: boolean;
  version?: string;
};

const wordmark = `███████╗███████╗███████╗███╗   ██╗███████╗
██╔════╝██╔════╝██╔════╝████╗  ██║██╔════╝
███████╗█████╗  █████╗  ██╔██╗ ██║█████╗
╚════██║██╔══╝  ██╔══╝  ██║╚██╗██║██╔══╝
███████║███████╗███████╗██║ ╚████║███████╗
╚══════╝╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝`;

const colors = {
  face: ["38;2;230;215;255", "38;5;189", "97"],
  shadow: ["38;2;120;96;151", "38;5;103", "35"],
  accent: ["38;2;191;161;255", "38;5;183", "95"],
  quiet: ["38;2;170;160;185", "38;5;247", "37"],
} as const;

export function terminalText(value: string): string {
  return value
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, "")
    .replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "")
    .replace(/[\x00-\x08\x0b-\x1f\x7f-\x9f]/g, "");
}

function palette(options: TerminalOptions) {
  return (text: string, role: keyof typeof colors) => {
    const depth = options.colorDepth ?? 0;

    if (depth < 4) return text;

    const color = colors[role][
      depth >= 24 ? 0 : depth >= 8 ? 1 : 2
    ];

    return `\x1b[${color}m${text}\x1b[0m`;
  };
}

export function terminalWelcome(
  options: TerminalOptions = {},
): string {
  const paint = palette(options);

  const large =
    options.interactive &&
    options.unicode !== false &&
    (options.columns ?? 80) >= 44;

  const title = large
    ? wordmark
        .split("\n")
        .map(
          (line) =>
            "  " +
            line
              .split(/([╔╗╚╝═║]+)/)
              .map((part) =>
                paint(
                  part,
                  /^[╔╗╚╝═║]+$/.test(part) ? "shadow" : "face",
                ),
              )
              .join(""),
        )
        .join("\n")
    : paint(SEENE_BRAND.name, "face");

  return `\n${title}\n\n${paint(SEENE_BRAND.title, "accent")}  ${paint(
    "v" + (options.version ?? "development"),
    "quiet",
  )}\n${paint(SEENE_BRAND.url, "quiet")}\n\nTurn your React UI into cinematic 3D scenes.\n\n`;
}

export function formatOnboarding(
  result: Extract<ProjectResult, { success: true }>,
  options: TerminalOptions = {},
  includeWelcome = true,
): string {
  const { project, integration, handoff, url } = result.data;
  const paint = palette(options);
  const tick = options.unicode === false ? "+" : "✓";
  const width = options.interactive
    ? Math.max(20, (options.columns ?? 80) - 4)
    : Infinity;

  const line = (value: string, role?: "accent" | "quiet") => {
    const clean = terminalText(value);

    const wrapped = clean
      .split("\n")
      .map((part) => {
        if (!Number.isFinite(width)) return part;

        const chunks: string[] = [];

        for (let i = 0; i < part.length; i += width) {
          chunks.push(part.slice(i, i + width));
        }

        return chunks;
      })
      .flat();

    return wrapped
      .map((part) => (role ? paint(part, role) : part))
      .join("\n");
  };

  const parts: string[] = [];

  if (includeWelcome) {
    parts.push(terminalWelcome(options));
  }

  parts.push(
    paint(
      project
        ? `${tick} Project ready (${project.entry})`
        : `${tick} Command completed`,
      "accent",
    ),
  );

  if (url) {
    parts.push(line(`  Preview origin: ${url}`));
  }

  if (integration) {
    parts.push(
      line(`  Integration (${integration.kind}): ${integration.component}`),
    );

    if (integration.route) {
      parts.push(line(`  Development route: ${integration.route}`));
    }

    parts.push(line(`  ${integration.instructions}`));
  }

  if (handoff) {
    parts.push(line(`  Studio docs: ${handoff.path}`));
  }

  parts.push("");

  return parts.join("\n");
}
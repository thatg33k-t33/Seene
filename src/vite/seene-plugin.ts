import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import { SceneRecipeSchema } from "../core/recipes";
import { sceneComponentSource } from "../core/platform";
import { PlatformFault, writeSceneSourcePair } from "./scene-files";

const route = "/__seene/create-scene";
const maxBodyBytes = 256_000;

function send(response: ServerResponse, status: number, value: Record<string, unknown>): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(value));
}

function collect(request: IncomingMessage): Promise<string | undefined> {
  return new Promise(resolve => {
    const declared = Number(request.headers["content-length"] ?? 0);
    if (declared > maxBodyBytes) { request.resume(); resolve(undefined); return; }
    let body = "";
    let bytes = 0;
    request.on("data", chunk => {
      bytes += chunk.length;
      if (bytes > maxBodyBytes) { body = ""; return; }
      body += chunk;
    });
    request.on("end", () => resolve(body === "" && bytes > maxBodyBytes ? undefined : body));
    request.on("error", () => resolve(undefined));
  });
}

export function seeneCreateScenePlugin(): Plugin {
  return {
    name: "seene-create-scene",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.method !== "POST" || request.url !== route) { next(); return; }
        void (async () => {
          const text = await collect(request);
          if (text === undefined) { send(response, 413, { error: "Scene request is too large." }); return; }
          let payload: unknown;
          try { payload = JSON.parse(text); }
          catch { send(response, 400, { error: "Scene request must contain valid JSON." }); return; }
          if (!payload || typeof payload !== "object" || !("id" in payload) || !("recipe" in payload) || typeof payload.id !== "string") {
            send(response, 400, { error: "Missing scene id or recipe." });
            return;
          }
          const parsed = SceneRecipeSchema.safeParse((payload as { recipe: unknown }).recipe);
          if (!parsed.success || parsed.data.id !== payload.id) {
            send(response, 400, {
              error: parsed.success
                ? `Scene id "${payload.id}" does not match recipe id "${parsed.data.id}".`
                : parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; "),
            });
            return;
          }
          try {
            const outcome = await writeSceneSourcePair(path.resolve(server.config.root), parsed.data.id, parsed.data, sceneComponentSource({ id: parsed.data.id }));
            if (outcome === "exists") {
              send(response, 409, { error: `Scene "${parsed.data.id}" already exists or has an incomplete source pair.` });
              return;
            }
            send(response, 200, { success: true, id: parsed.data.id });
          } catch (error) {
            if (error instanceof PlatformFault && error.code === "denied-path") { send(response, 400, { error: error.message }); return; }
            send(response, 500, { error: error instanceof Error ? error.message : "Unable to create scene files." });
          }
        })();
      });
    },
  };
}

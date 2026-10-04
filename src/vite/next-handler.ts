import type { IncomingMessage, ServerResponse } from "node:http";
import { SceneRecipeSchema } from "../core/recipes";
import { sceneComponentSource } from "../core/platform";
import { PlatformFault, writeSceneSourcePair } from "./scene-files";

const maxBodyBytes = 256_000;
type Result = { status: number; body: { success?: true; id?: string; error?: string } };
type ReadResult = { kind: "ok"; text: string } | { kind: "too-large" } | { kind: "unreadable" };

function json(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

async function readWebBody(request: Request): Promise<ReadResult> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBodyBytes) return { kind: "too-large" };
  if (!request.body) return { kind: "ok", text: "" };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBodyBytes) {
        await reader.cancel();
        return { kind: "too-large" };
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { kind: "ok", text: new TextDecoder().decode(bytes) };
  } catch {
    return { kind: "unreadable" };
  }
}

function readNodeBody(request: IncomingMessage): Promise<ReadResult> {
  return new Promise(resolve => {
    if (Number(request.headers["content-length"] ?? 0) > maxBodyBytes) {
      request.resume();
      resolve({ kind: "too-large" });
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    let oversized = false;
    request.on("data", (chunk: Buffer | string) => {
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += bytes.byteLength;
      if (size > maxBodyBytes) { oversized = true; chunks.length = 0; }
      else if (!oversized) chunks.push(bytes);
    });
    request.on("end", () => resolve(oversized ? { kind: "too-large" } : { kind: "ok", text: Buffer.concat(chunks).toString("utf8") }));
    request.on("error", () => resolve({ kind: "unreadable" }));
  });
}

function jsonError(status: number, error: string): Result {
  return { status, body: { error } };
}

async function createScene(payload: unknown, root: string): Promise<Result> {
  if (process.env.NODE_ENV !== "development") return jsonError(404, "Scene creation is available only in development.");
  if (!payload || typeof payload !== "object" || !("id" in payload) || !("recipe" in payload) || typeof payload.id !== "string")
    return jsonError(400, "Missing scene id or recipe.");
  const input = payload as { id: string; recipe: unknown };
  const parsed = SceneRecipeSchema.safeParse(input.recipe);
  if (!parsed.success || parsed.data.id !== input.id)
    return jsonError(400, parsed.success
      ? `Scene id "${input.id}" does not match recipe id "${parsed.data.id}".`
      : parsed.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; "));
  try {
    const outcome = await writeSceneSourcePair(root, parsed.data.id, parsed.data, sceneComponentSource({ id: parsed.data.id }));
    if (outcome === "exists") return jsonError(409, `Scene "${parsed.data.id}" already exists or has an incomplete source pair.`);
    return { status: 200, body: { success: true, id: parsed.data.id } };
  } catch (error) {
    if (error instanceof PlatformFault && error.code === "denied-path") return jsonError(400, error.message);
    return jsonError(500, error instanceof Error ? error.message : "Unable to create scene files.");
  }
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false } {
  try { return { ok: true, value: JSON.parse(text) as unknown }; }
  catch { return { ok: false }; }
}

export async function handleNextScenePost(request: Request, root = process.cwd()): Promise<Response> {
  if (request.method !== "POST") return Response.json({ error: "Use POST to create a scene." }, { status: 405, headers: { Allow: "POST" } });
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "Cross-origin scene creation is not allowed." }, { status: 403 });
  const read = await readWebBody(request);
  if (read.kind === "too-large") return Response.json({ error: "Scene request is too large." }, { status: 413 });
  if (read.kind === "unreadable") return Response.json({ error: "Scene request could not be read." }, { status: 400 });
  const parsed = parseJson(read.text);
  if (!parsed.ok) return Response.json({ error: "Scene request must contain valid JSON." }, { status: 400 });
  const result = await createScene(parsed.value, root);
  return Response.json(result.body, { status: result.status });
}

export async function POST(request: Request): Promise<Response> {
  return handleNextScenePost(request);
}

export function createPagesHandler(request: IncomingMessage, response: ServerResponse, root = process.cwd()): void {
  if (request.method !== "POST") { json(response, 405, { error: "Use POST to create a scene." }); return; }
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (origin && host && new URL(origin).host !== host) { json(response, 403, { error: "Cross-origin scene creation is not allowed." }); return; }
  void (async () => {
    const read = await readNodeBody(request);
    if (read.kind === "too-large") { json(response, 413, { error: "Scene request is too large." }); return; }
    if (read.kind === "unreadable") { json(response, 400, { error: "Scene request could not be read." }); return; }
    const parsed = parseJson(read.text);
    if (!parsed.ok) { json(response, 400, { error: "Scene request must contain valid JSON." }); return; }
    const result = await createScene(parsed.value, root);
    json(response, result.status, result.body);
  })();
}

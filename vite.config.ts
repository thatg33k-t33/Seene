import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs/promises";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "seene-create-scene",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.method === "POST" && req.url === "/__seene/create-scene") {
            let body = "";
            req.on("data", chunk => { body += chunk; });
            req.on("end", async () => {
              try {
                const { id, recipe } = JSON.parse(body);
                if (!id || !recipe) {
                  res.statusCode = 400;
                  res.end(JSON.stringify({ error: "Missing id or recipe" }));
                  return;
                }
                const dir = path.join(process.cwd(), "src/flute/scenes");
                await fs.mkdir(dir, { recursive: true });

                const sceneJsonPath = path.join(dir, `${id}.scene.json`);
                const tsxPath = path.join(dir, `${id}.tsx`);

                await fs.writeFile(sceneJsonPath, JSON.stringify(recipe, null, 2), "utf8");

                const componentName = id.split("-").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join("");
                const componentCode = `import { Surface } from "@thatg33k/seene";\n\nexport default function ${componentName}Scene() {\n  return (\n    <Surface id="flute-application" style={{ width: 1400, height: 980 }}>\n      <div className="p-12 max-w-xl mx-auto space-y-4">\n        <h2 className="text-2xl font-medium text-white">${recipe.title}</h2>\n        <p className="text-neutral-400 text-sm">Authored and persisted live in Seene Studio.</p>\n      </div>\n    </Surface>\n  );\n}\n`;

                try {
                  await fs.access(tsxPath);
                } catch {
                  await fs.writeFile(tsxPath, componentCode, "utf8");
                }

                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true, id }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
          next();
        });
      }
    }
  ],
  server: {host:"127.0.0.1",port:Number(process.env.APP_PORT ?? process.env.PORT ?? 5173),strictPort:true},
  preview: {host:"127.0.0.1",port:Number(process.env.APP_PORT ?? process.env.PORT ?? 5173),strictPort:true},
});

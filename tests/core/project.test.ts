import { describe, it, expect } from "vitest";
import { OpenPreviewSchema, InitProjectSchema, RESOURCES, ProjectResultSchema } from "../../src/core";
import { isAllowedDevOrigin, defaultDevOrigin, SEENE_PROTOCOL_VERSION } from "../../src/core/platform";

describe("project transport contracts",()=>{
  it.each(["http://localhost:5173","http://127.0.0.1:61234/","http://[::1]:5173"])("accepts loopback origin %s",url=>{
    expect(OpenPreviewSchema.parse({url})).toEqual({url,launch:true});
  });
  it.each(["https://localhost:5173","http://example.com","http://127.0.0.1.evil.test","http://127.0.0.1:99999","http://localhost:5173/path","http://localhost:5173/?x=1","http://localhost:5173/#hash","http://user:secret@localhost:5173","file:///tmp/index.html","http://0.0.0.0:5173","http://127.1:5173"])("rejects non-origin / non-loopback input %s",url=>{
    expect(OpenPreviewSchema.safeParse({url}).success).toBe(false);
  });
  it("rejects unknown command fields and nonboolean launch",()=>{
    expect(InitProjectSchema.safeParse({force:true}).success).toBe(false);
    expect(OpenPreviewSchema.safeParse({url:"http://localhost",launch:"false"}).success).toBe(false);
  });
  it("binds project schemas once in the existing resource registry",()=>{
    expect(RESOURCES["open-preview"]).toBe(OpenPreviewSchema);
    expect(RESOURCES["init-project"]).toBe(InitProjectSchema);
    expect(ProjectResultSchema.safeParse({success:false,issues:[{code:"missing",message:"Start the host server."}]}).success).toBe(true);
  });
  it.each([
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://[::1]:3000",
    "http://192.168.18.245:3000",
    "http://10.0.0.5:8080",
    "http://app.local:3000",
  ])("accepts allowed development origin %s", origin => {
    expect(isAllowedDevOrigin(origin)).toBe(true);
  });
  it.each([
    "https://external-malicious-site.com",
    "ftp://localhost",
    "not-a-url",
  ])("rejects disallowed or invalid origin %s", origin => {
    expect(isAllowedDevOrigin(origin)).toBe(false);
  });
  it("selects default development origin by adapter and exports protocol version", () => {
    expect(defaultDevOrigin("next-app")).toBe("http://localhost:3000");
    expect(defaultDevOrigin("next-pages")).toBe("http://localhost:3000");
    expect(defaultDevOrigin("react")).toBe("http://127.0.0.1:5173");
    expect(SEENE_PROTOCOL_VERSION).toBe(1);
  });
});

// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { containsDocumentContent, applicationDocumentUrl } from "../../src/preview/application";
import { SEENE_PREVIEW_QUERY_PARAM, SEENE_SCENE_QUERY_PARAM, SEENE_APPLICATION_QUERY_PARAM } from "../../src/core/platform";

describe("containsDocumentContent", () => {
  it("returns false for null/undefined/primitives", () => {
    expect(containsDocumentContent(null)).toBe(false);
    expect(containsDocumentContent(undefined)).toBe(false);
    expect(containsDocumentContent("string")).toBe(false);
    expect(containsDocumentContent(42)).toBe(false);
    expect(containsDocumentContent(true)).toBe(false);
  });

  it("detects <html> element", () => {
    expect(containsDocumentContent({ type: "html", props: {} } as never)).toBe(true);
  });

  it("detects <body> element", () => {
    expect(containsDocumentContent({ type: "body", props: {} } as never)).toBe(true);
  });

  it("detects RootLayout component by name", () => {
    function RootLayout({ children }: { children: unknown }) {
      return { type: "html", props: { children } };
    }
    expect(containsDocumentContent({ type: RootLayout, props: { children: null } } as never)).toBe(true);
  });

  it("returns false for regular components", () => {
    function MyComponent({ children }: { children: unknown }) {
      return { type: "div", props: { children } };
    }
    expect(containsDocumentContent({ type: MyComponent, props: { children: null } } as never)).toBe(false);
  });

  it("returns false for nested non-document content", () => {
    const child = { type: "span", props: { children: "hello" } };
    const parent = { type: "div", props: { children: child } };
    expect(containsDocumentContent(parent as never)).toBe(false);
  });

  it("detects document content nested inside a wrapper", () => {
    const child = { type: "body", props: {} };
    const parent = { type: "div", props: { children: child } };
    expect(containsDocumentContent(parent as never)).toBe(true);
  });

  it("returns false for arrays without document content", () => {
    const arr = [
      { type: "div", props: { children: "hello" } },
      { type: "span", props: { children: "world" } },
    ];
    expect(containsDocumentContent(arr as never)).toBe(false);
  });

  it("detects document content in arrays", () => {
    const arr = [
      { type: "div", props: {} },
      { type: "html", props: {} },
    ];
    expect(containsDocumentContent(arr as never)).toBe(true);
  });

  it("detects RootLayout via createElement for Next.js integration", () => {
    const React = require("react");
    function RootLayout({ children }: { children: unknown }) {
      return React.createElement("html", null, children);
    }
    const element = React.createElement(RootLayout, { children: "app" });
    expect(containsDocumentContent(element)).toBe(true);
  });
});

describe("applicationDocumentUrl", () => {
  it("strips seene query params and returns current origin for undefined route", () => {
    const url = applicationDocumentUrl("http://localhost:3000/page?seene-preview=1&other=1", undefined);
    expect(url).toBe("http://localhost:3000/page?other=1");
  });

  it("strips seene params and uses provided route", () => {
    const url = applicationDocumentUrl("http://localhost:3000/page?seene-preview=1", "/dashboard");
    expect(url).toBe("http://localhost:3000/dashboard");
  });

  it("preserves existing query params on target route", () => {
    const url = applicationDocumentUrl("http://localhost:3000/page?seene-preview=1&seene-scene=test", "/dashboard?tab=1");
    expect(url).toBe("http://localhost:3000/dashboard?tab=1");
  });

  it("falls back to origin root for /seene route", () => {
    const url = applicationDocumentUrl("http://localhost:3000/seene?seene-preview=1&seene-scene=test", undefined);
    expect(url).toBe("http://localhost:3000/");
  });

  it("handles 127.0.0.1 origin", () => {
    const url = applicationDocumentUrl("http://127.0.0.1:3000/page?seene-preview=1", undefined);
    expect(url).toBe("http://127.0.0.1:3000/page");
  });

  it("handles trailing slashes", () => {
    const url = applicationDocumentUrl("http://localhost:3000/seene/?seene-preview=1", undefined);
    expect(url).toBe("http://localhost:3000/");
  });
});

describe("SEENE query params", () => {
  it("uses correct param names", () => {
    expect(SEENE_PREVIEW_QUERY_PARAM).toBe("seene-preview");
    expect(SEENE_SCENE_QUERY_PARAM).toBe("seene-scene");
    expect(SEENE_APPLICATION_QUERY_PARAM).toBe("seene-app");
  });
});

describe("Preview connection boundary", () => {
  it("containsDocumentContent is exported from application module", () => {
    expect(typeof containsDocumentContent).toBe("function");
  });

  it("detects document content via createElement with real React", () => {
    const React = require("react");
    function App() {
      return React.createElement("div", null, "hello");
    }
    const element = React.createElement(App);
    expect(containsDocumentContent(element)).toBe(false);
  });
});

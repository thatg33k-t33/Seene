// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { SceneLibrary } from "../../src/preview";

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});

it("guides developers from the Seene introduction into the scene library", () => {
  window.history.replaceState({}, "", "/");
  render(<SceneLibrary />);
  expect(screen.getByRole("heading", { name: "Turn your app into a cinematic experience." })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Get started" }));
  expect(screen.getByRole("heading", { name: "Add Seene to your app" })).toBeTruthy();
  expect(screen.getByText("pnpm exec seene init")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Open the studio" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(screen.getByRole("heading", { name: "Create a scene" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Start creating" }));
  expect(screen.getByRole("button", { name: "+ Create scene" })).toBeTruthy();
  expect(localStorage.getItem("seene-entered")).toBe("true");
});

// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSeeneClientBridge } from "../../src/preview/connection";
import { useStudioBridge } from "../../src/platform/api";
import { SEENE_PROTOCOL_VERSION, isAllowedDevOrigin } from "../../src/core/platform";

type BridgeMessage = { type: string; version?: number; projectId?: string; href?: string };
type Msg = { type: string };

function filterByType(messages: unknown[], type: string): BridgeMessage[] {
	return messages.filter(m => typeof m === "object" && m !== null && (m as Msg).type === type) as BridgeMessage[];
}

function mockIframeParent(): unknown[] {
	const sent: unknown[] = [];
	const mockParent = {
		postMessage: (msg: unknown) => { sent.push(msg); },
	};
	Object.defineProperty(window, "parent", { value: mockParent, configurable: true });
	return sent;
}

function spyWindowPostMessages(): unknown[] {
	const sent: unknown[] = [];
	vi.spyOn(window, "postMessage").mockImplementation(((msg: unknown) => { sent.push(msg); }) as never);
	return sent;
}

function dispatchClientMsg(type: string, projectId = "proj-1", href = "http://localhost:5173", origin = "http://localhost:5173") {
	window.dispatchEvent(new MessageEvent("message", {
		data: { type, version: SEENE_PROTOCOL_VERSION, projectId, href },
		origin,
		source: window,
	}));
}

afterEach(() => {
	vi.restoreAllMocks();
	vi.useRealTimers();
	cleanup();
});

describe("useSeeneClientBridge", () => {
	beforeEach(() => vi.useFakeTimers());

	it("sends SEENE_CLIENT_HELLO on mount", () => {
		const sent = mockIframeParent();
		const { unmount } = renderHook(() => useSeeneClientBridge("proj-1"));
		expect(filterByType(sent, "SEENE_CLIENT_HELLO")).toHaveLength(1);
		expect(filterByType(sent, "SEENE_CLIENT_HELLO")[0]).toMatchObject({ type: "SEENE_CLIENT_HELLO", version: 1, projectId: "proj-1" });
		unmount();
	});

	it("retries HELLO every 2s if no ACK received", () => {
		const sent = mockIframeParent();
		const { unmount } = renderHook(() => useSeeneClientBridge("proj-1"));
		expect(filterByType(sent, "SEENE_CLIENT_HELLO")).toHaveLength(1);

		act(() => { vi.advanceTimersByTime(2000); });
		expect(filterByType(sent, "SEENE_CLIENT_HELLO")).toHaveLength(2);

		act(() => { vi.advanceTimersByTime(2000); });
		expect(filterByType(sent, "SEENE_CLIENT_HELLO")).toHaveLength(3);

		unmount();
	});

	it("stops retrying after ACK and starts 12s keep-alive", () => {
		const sent = mockIframeParent();
		const { unmount } = renderHook(() => useSeeneClientBridge("proj-1"));
		expect(filterByType(sent, "SEENE_CLIENT_HELLO")).toHaveLength(1);

		act(() => { dispatchClientMsg("SEENE_STUDIO_ACK"); });
		expect(filterByType(sent, "SEENE_CLIENT_READY")).toHaveLength(1);

		act(() => { vi.advanceTimersByTime(2000); });
		expect(filterByType(sent, "SEENE_CLIENT_HELLO")).toHaveLength(1);

		act(() => { vi.advanceTimersByTime(12000); });
		expect(filterByType(sent, "SEENE_CLIENT_HELLO")).toHaveLength(2);

		unmount();
	});

	it("handles SEENE_STUDIO_PING as a heartbeat and starts keep-alive", () => {
		const sent = mockIframeParent();
		const { unmount } = renderHook(() => useSeeneClientBridge("proj-1"));

		act(() => { vi.advanceTimersByTime(2000); });
		expect(filterByType(sent, "SEENE_CLIENT_HELLO")).toHaveLength(2);

		act(() => { dispatchClientMsg("SEENE_STUDIO_PING"); });
		expect(filterByType(sent, "SEENE_CLIENT_READY")).toHaveLength(1);

		act(() => { vi.advanceTimersByTime(12000); });
		expect(filterByType(sent, "SEENE_CLIENT_HELLO")).toHaveLength(3);

		unmount();
	});

	it("does not send HELLO when window.parent === window", () => {
		Object.defineProperty(window, "parent", { value: window, configurable: true });
		const spy = spyWindowPostMessages();
		const { unmount } = renderHook(() => useSeeneClientBridge("proj-1"));
		expect(spy).toHaveLength(0);
		unmount();
	});

	it("stops all timers on unmount", () => {
		const sent = mockIframeParent();
		const { unmount } = renderHook(() => useSeeneClientBridge("proj-1"));
		unmount();

		act(() => { vi.advanceTimersByTime(60000); });
		expect(filterByType(sent, "SEENE_CLIENT_HELLO")).toHaveLength(1);
	});
});

describe("useStudioBridge", () => {
	beforeEach(() => vi.useFakeTimers());

	it("sends SEENE_STUDIO_ACK only for HELLO, not for READY", () => {
		const sent = spyWindowPostMessages();
		const { unmount } = renderHook(() => useStudioBridge("project-path", true));

		act(() => { dispatchClientMsg("SEENE_CLIENT_HELLO"); });
		expect(filterByType(sent, "SEENE_STUDIO_ACK")).toHaveLength(1);
		expect(filterByType(sent, "SEENE_STUDIO_ACK")[0]).toMatchObject({ type: "SEENE_STUDIO_ACK", version: 1, projectId: "project-path" });

		act(() => { dispatchClientMsg("SEENE_CLIENT_READY"); });
		expect(filterByType(sent, "SEENE_STUDIO_ACK")).toHaveLength(1);

		unmount();
	});

	it("sends SEENE_STUDIO_PING every 10s after first client message", () => {
		const sent = spyWindowPostMessages();
		const { unmount } = renderHook(() => useStudioBridge("project-path", true));

		act(() => { dispatchClientMsg("SEENE_CLIENT_HELLO"); });
		expect(filterByType(sent, "SEENE_STUDIO_PING")).toHaveLength(0);

		act(() => { vi.advanceTimersByTime(10000); });
		expect(filterByType(sent, "SEENE_STUDIO_PING")).toHaveLength(1);
		expect(filterByType(sent, "SEENE_STUDIO_PING")[0]).toMatchObject({ type: "SEENE_STUDIO_PING", version: 1 });

		act(() => { vi.advanceTimersByTime(10000); });
		expect(filterByType(sent, "SEENE_STUDIO_PING")).toHaveLength(2);

		unmount();
	});

	it("does not send PING before any client message is received", () => {
		const sent = spyWindowPostMessages();
		const { unmount } = renderHook(() => useStudioBridge("project-path", true));

		act(() => { vi.advanceTimersByTime(30000); });
		expect(filterByType(sent, "SEENE_STUDIO_PING")).toHaveLength(0);

		unmount();
	});

	it("clears liveConnected after 15s without a heartbeat", () => {
		const { result, unmount } = renderHook(() => useStudioBridge("project-path", true));

		act(() => { dispatchClientMsg("SEENE_CLIENT_HELLO"); });
		expect(result.current.liveConnected).toBe(true);

		act(() => { vi.advanceTimersByTime(14999); });
		expect(result.current.liveConnected).toBe(true);

		act(() => { vi.advanceTimersByTime(5001); });
		expect(result.current.liveConnected).toBe(false);

		unmount();
	});

	it("extends heartbeat on each client message", () => {
		const { result, unmount } = renderHook(() => useStudioBridge("project-path", true));

		act(() => { dispatchClientMsg("SEENE_CLIENT_HELLO"); });
		expect(result.current.liveConnected).toBe(true);

		act(() => { vi.advanceTimersByTime(14000); });
		expect(result.current.liveConnected).toBe(true);

		act(() => { dispatchClientMsg("SEENE_CLIENT_READY"); });
		expect(result.current.liveConnected).toBe(true);

		act(() => { vi.advanceTimersByTime(14999); });
		expect(result.current.liveConnected).toBe(true);

		act(() => { vi.advanceTimersByTime(5002); });
		expect(result.current.liveConnected).toBe(false);

		unmount();
	});

	it("rejects messages from disallowed origins", () => {
		const sent = spyWindowPostMessages();
		const { result, unmount } = renderHook(() => useStudioBridge("project-path", true));

		expect(isAllowedDevOrigin("http://evil.example.com")).toBe(false);
		act(() => { dispatchClientMsg("SEENE_CLIENT_HELLO", "proj-1", undefined, "http://evil.example.com"); });

		expect(filterByType(sent, "SEENE_STUDIO_ACK")).toHaveLength(0);
		expect(result.current.liveConnected).toBe(false);

		unmount();
	});

	it("does not register listener when inactive", () => {
		const sent = spyWindowPostMessages();
		const { result, unmount } = renderHook(() => useStudioBridge("project-path", false));

		act(() => { dispatchClientMsg("SEENE_CLIENT_HELLO"); });
		expect(filterByType(sent, "SEENE_STUDIO_ACK")).toHaveLength(0);
		expect(result.current.liveConnected).toBe(false);

		unmount();
	});

	it("re-sends ACK when active toggles back on after a new HELLO", () => {
		const sent = spyWindowPostMessages();
		const { result, rerender, unmount } = renderHook(({ active }) => useStudioBridge("project-path", active), { initialProps: { active: true } });

		act(() => { dispatchClientMsg("SEENE_CLIENT_HELLO"); });
		expect(result.current.liveConnected).toBe(true);

		rerender({ active: false });
		expect(result.current.liveConnected).toBe(false);

		rerender({ active: true });
		expect(result.current.liveConnected).toBe(false);

		act(() => { dispatchClientMsg("SEENE_CLIENT_HELLO"); });
		expect(filterByType(sent, "SEENE_STUDIO_ACK")).toHaveLength(2);

		unmount();
	});
});

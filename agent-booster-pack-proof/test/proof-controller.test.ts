import type { ExtensionContext, ToolResultEvent } from "@mariozechner/pi-coding-agent";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/test-config.js", () => ({
  resolveTestConfig: vi.fn(),
}));

import { createProofController } from "../src/proof-controller.js";
import { resolveTestConfig } from "../src/test-config.js";

const resolveTestConfigMock = vi.mocked(resolveTestConfig);

function createContext(cwd = "/repo"): {
  ctx: ExtensionContext;
  ui: {
    notify: ReturnType<typeof vi.fn>;
    setStatus: ReturnType<typeof vi.fn>;
    setWidget: ReturnType<typeof vi.fn>;
  };
} {
  const ui = {
    notify: vi.fn(),
    setStatus: vi.fn(),
    setWidget: vi.fn(),
  };

  const ctx = {
    cwd,
    hasUI: true,
    ui,
  } as unknown as ExtensionContext;

  return { ctx, ui };
}

describe("createProofController", () => {
  beforeEach(() => {
    resolveTestConfigMock.mockReset();
  });

  it("describes specifying as behavior-first when enabling proof mode", async () => {
    resolveTestConfigMock.mockResolvedValue({ command: "npm test", cwd: "/repo" });
    const controller = createProofController();
    const { ctx, ui } = createContext();

    const message = await controller.enable(ctx);

    expect(ui.notify).toHaveBeenCalledOnce();
    expect(message).toContain("SPECIFYING phase");
    expect(message).toContain("Test command: npm test");
  });

  it("blocks production edits with behavior-first specifying guidance", async () => {
    resolveTestConfigMock.mockResolvedValue({ command: "npm test", cwd: "/repo" });
    const controller = createProofController();
    const { ctx, ui } = createContext();

    await controller.enable(ctx);
    ui.notify.mockClear();
    const mutation = controller.handleProductionWrite("src/math.ts", ctx);

    expect(ui.notify).toHaveBeenCalledOnce();
    expect(ui.notify.mock.calls[0]?.[1]).toBe("warning");
    expect(mutation).toEqual({
      block: true,
      reason: "PROOF SPECIFYING phase: specify the next behavior in a test before changing production code",
    });
  });

  it("blocks production edits without requiring UI notifications", async () => {
    resolveTestConfigMock.mockResolvedValue({ command: "npm test", cwd: "/repo" });
    const controller = createProofController();
    const { ctx, ui } = createContext();
    (ctx as { hasUI: boolean }).hasUI = false;

    await controller.enable(ctx);
    const mutation = controller.handleProductionWrite("src/math.ts", ctx);

    expect(ui.notify).not.toHaveBeenCalled();
    expect(mutation).toEqual({
      block: true,
      reason: "PROOF SPECIFYING phase: specify the next behavior in a test before changing production code",
    });
  });

  it("uses the same guidance for shell-based production writes", async () => {
    resolveTestConfigMock.mockResolvedValue({ command: "npm test", cwd: "/repo" });
    const controller = createProofController();
    const { ctx, ui } = createContext();

    await controller.enable(ctx);
    ui.notify.mockClear();
    const mutation = controller.handleShellWriteWarning(
      {
        toolName: "bash",
        input: { command: "printf 'export const x = 1' > src/math.ts" },
        content: [],
      } as unknown as ToolResultEvent,
      ctx,
    );

    expect(ui.notify).toHaveBeenCalledOnce();
    expect(ui.notify.mock.calls[0]?.[1]).toBe("warning");
    expect(mutation?.content).toHaveLength(1);
    expect(mutation?.content[0]?.text).toContain("[PROOF WARNING]");
    expect(mutation?.content[0]?.text).toContain("SPECIFYING");
  });
});

import { describe, expect, it } from "vitest";

import designMomentGuard, {
  DESIGN_MOMENT_STATE_ENTRY,
  designMomentBlockReason,
  designMomentFor,
  designMomentReminder,
  editNewTexts,
  hasDesignMomentAllowedThisTurn,
  hasInterfaceGateApproval,
  hasInterfaceUiAllowThisTurn,
  introducesNewExport,
  isSurfacePath,
  shouldPromptDesignMoment,
} from "../extensions/design-moment-guard.js";

const userText = (text) => ({
  type: "message",
  message: { role: "user", content: [{ type: "text", text }] },
});

const assistantText = (text) => ({
  type: "message",
  message: { role: "assistant", content: [{ type: "text", text }] },
});

const customEntry = (customType, data = {}) => ({ type: "custom", customType, data });

const editInput = (path, edits) => ({ path, edits });
const writeInput = (path, content = "") => ({ path, content });
const bashInput = (command) => ({ command });

describe("design-moment guard", () => {
  it("isSurfacePath flags api/cli/schema/contract locations", () => {
    expect(isSurfacePath("src/api/users.ts")).toBe(true);
    expect(isSurfacePath("packages/server/routes/widgets.ts")).toBe(true);
    expect(isSurfacePath("src/cli/commands/new-cmd.ts")).toBe(true);
    expect(isSurfacePath("db/migrations/0001_init.sql")).toBe(true);
    expect(isSurfacePath("api/openapi.yaml")).toBe(true);
    expect(isSurfacePath("schema/orders.graphql")).toBe(true);
    expect(isSurfacePath("src/index.ts")).toBe(true);
    expect(isSurfacePath("src/widgets.routes.ts")).toBe(true);
  });

  it("isSurfacePath ignores tests, fixtures, markdown, and inner non-surface paths", () => {
    expect(isSurfacePath("src/api/users.test.ts")).toBe(false);
    expect(isSurfacePath("tests/api/users.ts")).toBe(false);
    expect(isSurfacePath("fixtures/api/payload.json")).toBe(false);
    expect(isSurfacePath("docs/api/README.md")).toBe(false);
    expect(isSurfacePath("src/utils/cache.ts")).toBe(false);
    expect(isSurfacePath("src/api/users.spec.ts")).toBe(false);
  });

  it("introducesNewExport matches common new public symbols across languages", () => {
    expect(introducesNewExport("export function listUsers(req) {}")).toBe(true);
    expect(introducesNewExport("export const router = new Router()")).toBe(true);
    expect(introducesNewExport("export default class Server {}")).toBe(true);
    expect(introducesNewExport("pub fn list_users(req: Req) -> Resp {}")).toBe(true);
    expect(introducesNewExport("func ListUsers(w http.ResponseWriter, r *http.Request) {}")).toBe(true);
    expect(introducesNewExport("def list_users(request):\n    pass")).toBe(true);
  });

  it("introducesNewExport ignores non-export edits", () => {
    expect(introducesNewExport("// just a comment")).toBe(false);
    expect(introducesNewExport("const internal = 1")).toBe(false);
    expect(introducesNewExport("    return users")).toBe(false);
    expect(introducesNewExport("func listUsers(r *Req)")).toBe(false); // unexported go
  });

  it("editNewTexts extracts newText from the edits array, skipping empties", () => {
    expect(
      editNewTexts({
        edits: [
          { oldText: "a", newText: "b" },
          { oldText: "c", newText: "" },
          { newText: 42 },
          { oldText: "d", newText: "e" },
        ],
      }),
    ).toEqual(["b", "e"]);
    expect(editNewTexts({})).toEqual([]);
    expect(editNewTexts(null)).toEqual([]);
  });

  it("fires when write creates a file at a surface path", () => {
    const entries = [userText("add a users endpoint")];
    const moment = shouldPromptDesignMoment("write", writeInput("src/api/users.ts", "export function listUsers() {}"), entries);
    expect(moment).toMatchObject({ path: "src/api/users.ts", source: "write" });
  });

  it("fires when edit introduces a new exported function under routes/", () => {
    const entries = [userText("add list route")];
    const input = editInput("src/routes/widgets.ts", [
      { oldText: "// routes", newText: "// routes\nexport function listWidgets(req, res) {\n  res.json([]);\n}" },
    ]);

    expect(shouldPromptDesignMoment("edit", input, entries)).toMatchObject({
      path: "src/routes/widgets.ts",
      source: "edit",
    });
  });

  it("fires on bash heredoc that writes to a surface path", () => {
    const entries = [userText("scaffold a command")];
    const command = "cat <<'EOF' > src/cli/commands/new-cmd.ts\nexport const command = {}\nEOF";

    expect(shouldPromptDesignMoment("bash", bashInput(command), entries)).toMatchObject({
      path: "src/cli/commands/new-cmd.ts",
      source: "bash",
    });
  });

  it("does not fire on edits to test files even at a surface path", () => {
    const entries = [userText("write a test")];
    const input = editInput("src/api/users.test.ts", [
      { oldText: "", newText: "export function setupTest() {}" },
    ]);
    expect(shouldPromptDesignMoment("edit", input, entries)).toBeNull();
  });

  it("does not fire on README under a surface path", () => {
    const entries = [userText("doc the api")];
    const input = editInput("src/api/README.md", [
      { oldText: "", newText: "export function whatever() {}" },
    ]);
    expect(shouldPromptDesignMoment("edit", input, entries)).toBeNull();
  });

  it("does not fire on edits without a new export, even at a surface path", () => {
    const entries = [userText("tweak handler body")];
    const input = editInput("src/api/users.ts", [
      { oldText: "return users", newText: "return users.filter(active)" },
    ]);
    expect(shouldPromptDesignMoment("edit", input, entries)).toBeNull();
  });

  it("does not fire when the user has already approved an Interface Design Gate packet this cycle", () => {
    const gatePacket = [
      "Interface Design Gate",
      "Current interface: none",
      "Proposed interface: GET /widgets returns Widget[]",
      "Why this boundary: clients need to list widgets",
      "User decision: please approve or revise",
    ].join("\n");

    const entries = [
      userText("add a widgets endpoint"),
      assistantText(gatePacket),
      userText("approve"),
    ];

    expect(hasInterfaceGateApproval(entries)).toBe(true);
    const input = writeInput("src/api/widgets.ts", "export function listWidgets() {}");
    expect(shouldPromptDesignMoment("write", input, entries)).toBeNull();
  });

  it("does not fire when the user has clicked Allow on the Interface Design Gate UI this turn", () => {
    const entries = [
      userText("add widgets"),
      customEntry("abp-interface-gate-ui-allowed", { allowedAt: 1 }),
    ];
    expect(hasInterfaceUiAllowThisTurn(entries)).toBe(true);
    const input = writeInput("src/api/widgets.ts", "export function listWidgets() {}");
    expect(shouldPromptDesignMoment("write", input, entries)).toBeNull();
  });

  it("does not fire twice in the same turn after the allowed marker is appended", () => {
    const entries = [
      userText("add a few endpoints"),
      customEntry(DESIGN_MOMENT_STATE_ENTRY, { path: "src/api/users.ts", allowedAt: 1 }),
    ];
    expect(hasDesignMomentAllowedThisTurn(entries)).toBe(true);
    const input = writeInput("src/api/widgets.ts", "export function listWidgets() {}");
    expect(shouldPromptDesignMoment("write", input, entries)).toBeNull();
  });

  it("re-arms in a new turn after the user speaks again", () => {
    const entries = [
      userText("first task"),
      customEntry(DESIGN_MOMENT_STATE_ENTRY, { path: "src/api/users.ts", allowedAt: 1 }),
      userText("now a new endpoint"),
    ];
    expect(hasDesignMomentAllowedThisTurn(entries)).toBe(false);
    const input = writeInput("src/api/widgets.ts", "export function listWidgets() {}");
    expect(shouldPromptDesignMoment("write", input, entries)).toMatchObject({ source: "write" });
  });

  it("designMomentBlockReason names the path and includes the gate template", () => {
    const reason = designMomentBlockReason({ path: "src/api/users.ts", source: "write" });
    expect(reason).toMatch(/Design-Moment Guard/);
    expect(reason).toMatch(/src\/api\/users\.ts/);
    expect(reason).toMatch(/Current interface/);
    expect(reason).toMatch(/Proposed interface/);
    expect(reason).toMatch(/Why this boundary/);
    expect(reason).toMatch(/User decision/);
  });

  it("designMomentFor returns null for non-mutating tool names", () => {
    expect(designMomentFor("read", { path: "src/api/users.ts" })).toBeNull();
    expect(designMomentFor("grep", { pattern: "x" })).toBeNull();
  });

  it("registers a before_agent_start handler that appends the reminder", async () => {
    const handlers = new Map();
    const fakePi = {
      on: (eventName, handler) => handlers.set(eventName, handler),
      appendEntry: () => {},
    };
    designMomentGuard(fakePi);

    const handler = handlers.get("before_agent_start");
    expect(handler).toBeTruthy();
    const result = await handler({ systemPrompt: "base." });
    expect(result.systemPrompt).toMatch(/^base\./);
    expect(result.systemPrompt).toMatch(/Design-Moment Guard/);
    expect(result.systemPrompt).toMatch(/Interface Design Gate packet/);
  });

  it("blocks headless when a design moment fires and no UI is available", async () => {
    const handlers = new Map();
    const appended = [];
    const fakePi = {
      on: (eventName, handler) => handlers.set(eventName, handler),
      appendEntry: (...args) => appended.push(args),
    };
    designMomentGuard(fakePi);

    const toolCall = handlers.get("tool_call");
    expect(toolCall).toBeTruthy();

    const entries = [userText("add an endpoint")];
    const ctx = {
      sessionManager: { getBranch: () => entries },
      hasUI: false,
    };
    const event = {
      toolName: "write",
      input: writeInput("src/api/users.ts", "export function listUsers() {}"),
    };

    const result = await toolCall(event, ctx);
    expect(result).toMatchObject({ block: true });
    expect(result.reason).toMatch(/Design-Moment Guard/);
    expect(appended).toEqual([]);
  });

  it("prompts UI when present; Allow appends the marker and unblocks", async () => {
    const handlers = new Map();
    const appended = [];
    const fakePi = {
      on: (eventName, handler) => handlers.set(eventName, handler),
      appendEntry: (customType, data) => appended.push({ customType, data }),
    };
    designMomentGuard(fakePi);
    const toolCall = handlers.get("tool_call");

    const entries = [userText("add an endpoint")];
    const confirms = [];
    const ctx = {
      sessionManager: { getBranch: () => entries },
      hasUI: true,
      ui: {
        confirm: async (title, message) => {
          confirms.push({ title, message });
          return true;
        },
      },
    };
    const event = {
      toolName: "write",
      input: writeInput("src/api/users.ts", "export function listUsers() {}"),
    };

    const result = await toolCall(event, ctx);
    expect(result).toBeUndefined();
    expect(confirms).toHaveLength(1);
    expect(confirms[0].title).toMatch(/Design-Moment Guard/);
    expect(appended).toEqual([{ customType: DESIGN_MOMENT_STATE_ENTRY, data: expect.objectContaining({ path: "src/api/users.ts" }) }]);
  });

  it("prompts UI when present; Deny blocks with the gate template", async () => {
    const handlers = new Map();
    const appended = [];
    const fakePi = {
      on: (eventName, handler) => handlers.set(eventName, handler),
      appendEntry: (...args) => appended.push(args),
    };
    designMomentGuard(fakePi);
    const toolCall = handlers.get("tool_call");

    const entries = [userText("add an endpoint")];
    const ctx = {
      sessionManager: { getBranch: () => entries },
      hasUI: true,
      ui: { confirm: async () => false },
    };
    const event = {
      toolName: "write",
      input: writeInput("src/api/users.ts", "export function listUsers() {}"),
    };

    const result = await toolCall(event, ctx);
    expect(result).toMatchObject({ block: true });
    expect(result.reason).toMatch(/Current interface/);
    expect(appended).toEqual([]);
  });

  it("reminder mentions the gate and the four packet fields", () => {
    const reminder = designMomentReminder();
    expect(reminder).toMatch(/Design-Moment Guard/);
    expect(reminder).toMatch(/Current interface/);
    expect(reminder).toMatch(/Proposed interface/);
    expect(reminder).toMatch(/Why this boundary/);
    expect(reminder).toMatch(/User decision/);
  });
});

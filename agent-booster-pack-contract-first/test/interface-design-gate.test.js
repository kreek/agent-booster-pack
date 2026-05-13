import { describe, expect, it } from "vitest";

import {
  INTERFACE_GATE_CYCLE_ENTRY,
  INTERFACE_GATE_STATE_ENTRY,
  INTERFACE_GATE_UI_ALLOW_ENTRY,
  classifyToolCall,
  hasInterfaceGateApproval,
  hasInterfaceGatePrompt,
  hasInterfaceUiAllowThisTurn,
  hasOpenInterfaceGatePrompt,
  isPotentialInterfaceImplementation,
  latestInterfaceGateState,
} from "../extensions/interface-design-gate.js";

import interfaceDesignGate from "../extensions/interface-design-gate.js";

const messages = (...items) =>
  items.map(([role, content]) => ({
    type: "message",
    message: { role, content },
  }));

const customEntry = (customType, data = {}) => ({ type: "custom", customType, data });

const closedCycleEntry = () => customEntry(INTERFACE_GATE_CYCLE_ENTRY, { state: "closed", at: 1 });
const uiAllowEntry = () => customEntry(INTERFACE_GATE_UI_ALLOW_ENTRY, { allowedAt: 1 });
const stateEntry = (active) => customEntry(INTERFACE_GATE_STATE_ENTRY, { active });

function makePiHarness(entries = []) {
  const commands = new Map();
  const handlers = new Map();
  const sent = [];
  const appended = [];
  const notifications = [];
  const confirms = [];

  const pi = {
    registerCommand: (name, definition) => commands.set(name, definition),
    on: (eventName, handler) => handlers.set(eventName, handler),
    appendEntry: (customType, data) => {
      appended.push({ customType, data });
      entries.push({ type: "custom", customType, data });
    },
    sendUserMessage: (message) => sent.push(message),
  };

  const ctx = {
    hasUI: true,
    sessionManager: { getBranch: () => entries },
    ui: {
      notify: (message, level) => notifications.push({ message, level }),
      confirm: async (title, message) => {
        confirms.push({ title, message });
        return true;
      },
    },
  };

  interfaceDesignGate(pi);
  return { commands, handlers, sent, appended, notifications, confirms, ctx };
}

describe("interface design gate", () => {
it("starts inactive and only registers manual commands plus scoped tool enforcement", () => {
  const { commands, handlers } = makePiHarness();

  expect(commands.get("abp:contract")).toBeTruthy();
  expect(commands.get("abp:contract-off")).toBeTruthy();
  expect(handlers.get("before_agent_start")).toBeUndefined();
  expect(handlers.get("tool_call")).toBeTruthy();
});

it("manual command activates the gate and sends the contract prompt", async () => {
  const { commands, sent, appended, notifications } = makePiHarness();

  await commands.get("abp:contract").handler("design the cache adapter", {
    ui: { notify: (message, level) => notifications.push({ message, level }) },
  });

  expect(appended.at(-1)).toMatchObject({ customType: INTERFACE_GATE_STATE_ENTRY, data: { active: true } });
  expect(sent[0]).toContain("Interface Design Gate");
  expect(sent[0]).toContain("Acceptance and proof:");
  expect(sent[0]).toContain("Intent: design the cache adapter");
  expect(notifications.at(-1).message).toMatch(/enabled/i);
});

it("manual off command deactivates the gate", async () => {
  const { commands, appended, notifications } = makePiHarness([stateEntry(true)]);

  await commands.get("abp:contract-off").handler("", {
    ui: { notify: (message, level) => notifications.push({ message, level }) },
  });

  expect(appended.at(-1)).toMatchObject({ customType: INTERFACE_GATE_STATE_ENTRY, data: { active: false } });
  expect(latestInterfaceGateState([stateEntry(true), stateEntry(false)])).toBe(false);
  expect(notifications.at(-1).message).toMatch(/disabled/i);
});

it("does not block tool calls before the manual workflow is active", async () => {
  const history = messages([
    "assistant",
    `Interface Design Gate

Current interface: new adapter
Proposed interface: export function createClient(options)
Why this boundary: callers should not know transport details
Acceptance and proof: caller behavior is covered by tests
User decision: approve or revise`,
  ]);
  const { handlers, ctx, confirms } = makePiHarness(history);

  const result = await handlers.get("tool_call")({ toolName: "edit", input: { path: "src/client.js" } }, ctx);

  expect(result).toBeUndefined();
  expect(confirms).toEqual([]);
});

it("blocks an open gate only after the manual workflow is active", async () => {
  const history = [
    stateEntry(true),
    ...messages([
      "assistant",
      `Interface Design Gate

Current interface: new adapter
Proposed interface: export function createClient(options)
Why this boundary: callers should not know transport details
Acceptance and proof: caller behavior is covered by tests
User decision: approve or revise`,
    ]),
  ];
  const { handlers, ctx, confirms } = makePiHarness(history);

  const result = await handlers.get("tool_call")({ toolName: "edit", input: { path: "src/client.js" } }, ctx);

  expect(result).toBeUndefined();
  expect(confirms).toHaveLength(1);
  expect(confirms[0].title).toBe("Interface Design Gate");
  expect(confirms[0].message).toMatch(/acceptance\/proof/i);
});

it("detects an interface gate prompt with the required lean fields", () => {
  const history = messages([
    "assistant",
    `Interface Design Gate

Current interface: new module facade
Proposed interface: export function parseConfig(path)
Why this boundary: parsing stays at the IO edge
Acceptance and proof: parser behavior is covered by tests
User decision: approve or revise this interface before I implement it`,
  ]);

  expect(hasInterfaceGatePrompt(history)).toBe(true);
});

it("treats an incomplete gate packet as open until the full packet is shown", () => {
  const history = messages(
    [
      "assistant",
      `Interface Design Gate

Current interface: new adapter
Proposed interface: export function createClient(options)
Why this boundary: callers should not know transport details
User decision: approve or revise`,
    ],
    ["user", "Approved, please implement."]
  );

  expect(hasInterfaceGatePrompt(history)).toBe(false);
  expect(hasInterfaceGateApproval(history)).toBe(false);
  expect(hasOpenInterfaceGatePrompt(history)).toBe(true);
  expect(isPotentialInterfaceImplementation("edit", {}, history)).toBe(true);
});

it("requires approval after the latest interface gate prompt", () => {
  const history = messages(
    [
      "assistant",
      `Interface Design Gate

Current interface: new adapter
Proposed interface: export function createClient(options)
Why this boundary: callers should not know transport details
Acceptance and proof: caller behavior is covered by tests
User decision: approve or revise`,
    ],
    ["user", "Yes, approved. Implement it."]
  );

  expect(hasInterfaceGateApproval(history)).toBe(true);
});

it("does not treat approval before a later interface gate prompt as sign-off", () => {
  const history = messages(
    ["user", "Approved"],
    [
      "assistant",
      `Interface Design Gate

Current interface: new adapter
Proposed interface: export function createClient(options)
Why this boundary: callers should not know transport details
Acceptance and proof: caller behavior is covered by tests
User decision: approve or revise`,
    ]
  );

  expect(hasInterfaceGateApproval(history)).toBe(false);
});

it("classifies edit and write as mutating tools", () => {
  expect(classifyToolCall("edit", {})).toBe("mutating");
  expect(classifyToolCall("write", {})).toBe("mutating");
  expect(classifyToolCall("read", {})).toBe("read_only");
});

it("detects mutating bash commands that likely write code", () => {
  expect(classifyToolCall("bash", { command: "python - <<'PY'\nopen('x.py','w').write('')\nPY" })).toBe("mutating");
  expect(classifyToolCall("bash", { command: "echo ok > generated.txt" })).toBe("mutating");
  expect(classifyToolCall("bash", { command: "rg interface" })).toBe("read_only");
});

it("does not classify read-only bash with stderr redirects as mutating", () => {
  expect(classifyToolCall("bash", { command: 'rg "contract-first" /Users/alastair/.pi 2>/dev/null' })).toBe(
    "read_only"
  );
});

it("does not infer interface intent from assistant prose without a gate packet", () => {
  const history = messages([
    "assistant",
    "I'll add a new exported class contract for the cache adapter, then edit the files.",
  ]);

  expect(isPotentialInterfaceImplementation("edit", {}, history)).toBe(false);
});

it("does not infer interface intent from user prose without a gate packet", () => {
  const history = messages([
    "user",
    "Add a public function interface for configuring the cache adapter.",
  ]);

  expect(isPotentialInterfaceImplementation("edit", {}, history)).toBe(false);
});

it("flags implementation after an explicit gate packet without approval", () => {
  const history = messages([
    "assistant",
    `Interface Design Gate

Current interface: new adapter
Proposed interface: export function createClient(options)
Why this boundary: callers should not know transport details
Acceptance and proof: caller behavior is covered by tests
User decision: approve or revise`,
  ]);

  expect(hasOpenInterfaceGatePrompt(history)).toBe(true);
  expect(isPotentialInterfaceImplementation("edit", {}, history)).toBe(true);
});

it("does not treat hyphenated package names as interface intent", () => {
  const history = messages([
    "user",
    "Resolve the agent-booster-pack-contract-first package collision; I only want the npm installed version.",
  ]);

  expect(isPotentialInterfaceImplementation("edit", {}, history)).toBe(false);
});

it("does not flag implementation after the user approves the gate", () => {
  const history = messages(
    [
      "assistant",
      `Interface Design Gate

Current interface: new adapter
Proposed interface: export function createClient(options)
Why this boundary: callers should not know transport details
Acceptance and proof: caller behavior is covered by tests
User decision: approve or revise`,
    ],
    ["user", "Approved, please implement."]
  );

  expect(isPotentialInterfaceImplementation("edit", {}, history)).toBe(false);
});

it("stale interface intent does not fire the gate after a closed cycle", () => {
  const history = [
    ...messages(
      ["user", "Add a public function interface for the cache adapter."],
      [
        "assistant",
        `Interface Design Gate

Current interface: new adapter
Proposed interface: export function createClient(options)
Why this boundary: callers should not know transport details
Acceptance and proof: caller behavior is covered by tests
User decision: approve or revise`,
      ],
      ["user", "Approved, please implement."]
    ),
    closedCycleEntry(),
    ...messages(
      ["user", "now bump the dependency version"],
      ["assistant", "Sure, updating the manifest."]
    ),
  ];

  expect(isPotentialInterfaceImplementation("edit", {}, history)).toBe(false);
});

it("new prose after a closed cycle does not reopen the gate without a packet", () => {
  const history = [
    closedCycleEntry(),
    ...messages(
      ["user", "Also redesign the schema for the audit-log endpoint."],
      ["assistant", "Looking into it."]
    ),
  ];

  expect(isPotentialInterfaceImplementation("edit", {}, history)).toBe(false);
});

it("UI allow within the current turn suppresses an explicit open gate", () => {
  const history = [
    ...messages([
      "assistant",
      `Interface Design Gate

Current interface: new adapter
Proposed interface: export function createClient(options)
Why this boundary: callers should not know transport details
Acceptance and proof: caller behavior is covered by tests
User decision: approve or revise`,
    ]),
    uiAllowEntry(),
  ];

  expect(hasInterfaceUiAllowThisTurn(history)).toBe(true);
  expect(isPotentialInterfaceImplementation("edit", {}, history)).toBe(false);
});

it("UI allow does not leak across turns", () => {
  const history = [
    ...messages([
      "assistant",
      `Interface Design Gate

Current interface: new adapter
Proposed interface: export function createClient(options)
Why this boundary: callers should not know transport details
Acceptance and proof: caller behavior is covered by tests
User decision: approve or revise`,
    ]),
    uiAllowEntry(),
    ...messages(["user", "Now also tweak the formatter."]),
  ];

  expect(hasInterfaceUiAllowThisTurn(history)).toBe(false);
  expect(isPotentialInterfaceImplementation("edit", {}, history)).toBe(true);
});

it("rejection of the gate prompt keeps the cycle open", () => {
  const history = messages(
    [
      "assistant",
      `Interface Design Gate

Current interface: new adapter
Proposed interface: export function createClient(options)
Why this boundary: callers should not know transport details
Acceptance and proof: caller behavior is covered by tests
User decision: approve or revise`,
    ],
    ["user", "No, revise the error response shape first."]
  );

  expect(hasInterfaceGateApproval(history)).toBe(false);
  expect(isPotentialInterfaceImplementation("edit", {}, history)).toBe(true);
});
});

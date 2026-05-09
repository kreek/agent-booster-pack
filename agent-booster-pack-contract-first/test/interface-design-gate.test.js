import { describe, expect, it } from "vitest";

import {
  INTERFACE_GATE_CYCLE_ENTRY,
  INTERFACE_GATE_UI_ALLOW_ENTRY,
  classifyToolCall,
  hasInterfaceGateApproval,
  hasInterfaceGatePrompt,
  hasInterfaceUiAllowThisTurn,
  hasOpenInterfaceGatePrompt,
  isPotentialInterfaceImplementation,
} from "../extensions/interface-design-gate.js";

const messages = (...items) =>
  items.map(([role, content]) => ({
    type: "message",
    message: { role, content },
  }));

const customEntry = (customType, data = {}) => ({ type: "custom", customType, data });

const closedCycleEntry = () => customEntry(INTERFACE_GATE_CYCLE_ENTRY, { state: "closed", at: 1 });
const uiAllowEntry = () => customEntry(INTERFACE_GATE_UI_ALLOW_ENTRY, { allowedAt: 1 });

describe("interface design gate", () => {
it("detects an interface gate prompt with the required lean fields", () => {
  const history = messages([
    "assistant",
    `Interface Design Gate

Current interface: new module facade
Proposed interface: export function parseConfig(path)
Why this boundary: parsing stays at the IO edge
User decision: approve or revise this interface before I implement it`,
  ]);

  expect(hasInterfaceGatePrompt(history)).toBe(true);
});

it("requires approval after the latest interface gate prompt", () => {
  const history = messages(
    [
      "assistant",
      `Interface Design Gate

Current interface: new adapter
Proposed interface: export function createClient(options)
Why this boundary: callers should not know transport details
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
User decision: approve or revise`,
    ],
    ["user", "No, revise the error response shape first."]
  );

  expect(hasInterfaceGateApproval(history)).toBe(false);
  expect(isPotentialInterfaceImplementation("edit", {}, history)).toBe(true);
});
});

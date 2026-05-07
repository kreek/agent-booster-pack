import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyToolCall,
  hasInterfaceGateApproval,
  hasInterfaceGatePrompt,
  isPotentialInterfaceImplementation,
} from "../extensions/interface-design-gate.js";

const messages = (...items) =>
  items.map(([role, content]) => ({
    type: "message",
    message: { role, content },
  }));

test("detects an interface gate prompt with the required lean fields", () => {
  const history = messages([
    "assistant",
    `Interface Design Gate

Current interface: new module facade
Proposed interface: export function parseConfig(path)
Why this boundary: parsing stays at the IO edge
User decision: approve or revise this interface before I implement it`,
  ]);

  assert.equal(hasInterfaceGatePrompt(history), true);
});

test("requires approval after the latest interface gate prompt", () => {
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

  assert.equal(hasInterfaceGateApproval(history), true);
});

test("does not treat approval before a later interface gate prompt as sign-off", () => {
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

  assert.equal(hasInterfaceGateApproval(history), false);
});

test("classifies edit and write as mutating tools", () => {
  assert.equal(classifyToolCall("edit", {}), "mutating");
  assert.equal(classifyToolCall("write", {}), "mutating");
  assert.equal(classifyToolCall("read", {}), "read_only");
});

test("detects mutating bash commands that likely write code", () => {
  assert.equal(classifyToolCall("bash", { command: "python - <<'PY'\nopen('x.py','w').write('')\nPY" }), "mutating");
  assert.equal(classifyToolCall("bash", { command: "echo ok > generated.txt" }), "mutating");
  assert.equal(classifyToolCall("bash", { command: "rg interface" }), "read_only");
});

test("flags implementation when interface intent exists without approval", () => {
  const history = messages([
    "assistant",
    "I'll add a new exported class contract for the cache adapter, then edit the files.",
  ]);

  assert.equal(isPotentialInterfaceImplementation("edit", {}, history), true);
});

test("flags implementation when the user requested an interface change", () => {
  const history = messages([
    "user",
    "Add a public function interface for configuring the cache adapter.",
  ]);

  assert.equal(isPotentialInterfaceImplementation("edit", {}, history), true);
});

test("does not flag implementation after the user approves the gate", () => {
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

  assert.equal(isPotentialInterfaceImplementation("edit", {}, history), false);
});

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

import {
  alreadyAcknowledged,
  buildDecision,
  computeHash,
  decide,
  parseChangedPaths,
} from "../scripts/self-review.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const SCRIPT = resolve(__dirname, "..", "scripts", "self-review.mjs");

function baseInput(overrides = {}) {
  return {
    session_id: "session-abc",
    cwd: "/tmp/repo",
    hook_event_name: "Stop",
    stop_hook_active: false,
    last_assistant_message: "I made the change.",
    ...overrides,
  };
}

function baseArgs(overrides = {}) {
  return {
    input: baseInput(),
    root: "/tmp/repo",
    status: " M src/feature.ts\n",
    head: "deadbeef",
    prevHash: undefined,
    ...overrides,
  };
}

test("decide: stop_hook_active short-circuits to silent", () => {
  const out = decide(baseArgs({ input: baseInput({ stop_hook_active: true }) }));
  assert.equal(out.action, "silent");
  assert.equal(out.reason, "stop_hook_active");
});

test("decide: missing git root is silent (not a repo)", () => {
  const out = decide(baseArgs({ root: null }));
  assert.equal(out.action, "silent");
  assert.equal(out.reason, "not_a_repo");
});

test("decide: empty status is silent (clean tree)", () => {
  const out = decide(baseArgs({ status: "" }));
  assert.equal(out.action, "silent");
  assert.equal(out.reason, "clean_tree");
});

test("decide: docs-only diff is silent", () => {
  const out = decide(baseArgs({ status: " M README.md\n M docs/intro.md\n" }));
  assert.equal(out.action, "silent");
  assert.equal(out.reason, "no_production_changes");
});

test("decide: config-only diff is silent", () => {
  const out = decide(baseArgs({ status: " M package.json\n M tsconfig.json\n" }));
  assert.equal(out.action, "silent");
  assert.equal(out.reason, "no_production_changes");
});

test("decide: test-only diff is silent", () => {
  const out = decide(baseArgs({ status: " M src/foo.test.ts\n A test/bar_test.py\n" }));
  assert.equal(out.action, "silent");
  assert.equal(out.reason, "no_production_changes");
});

test("decide: last_assistant_message naming Self-review: is silent", () => {
  const out = decide(baseArgs({
    input: baseInput({ last_assistant_message: "Self-review: no findings, residual risk noted." }),
  }));
  assert.equal(out.action, "silent");
  assert.equal(out.reason, "already_acknowledged");
});

test("decide: last_assistant_message naming Findings: is silent", () => {
  const out = decide(baseArgs({
    input: baseInput({ last_assistant_message: "Findings: H1 missing input validation in src/foo.ts:42" }),
  }));
  assert.equal(out.action, "silent");
  assert.equal(out.reason, "already_acknowledged");
});

test("decide: last_assistant_message naming Proof: is silent", () => {
  const out = decide(baseArgs({
    input: baseInput({ last_assistant_message: "Done. Proof: tests/pagination.spec.ts passes." }),
  }));
  assert.equal(out.action, "silent");
  assert.equal(out.reason, "already_acknowledged");
});

test("decide: last_assistant_message naming unproven is silent", () => {
  const out = decide(baseArgs({
    input: baseInput({ last_assistant_message: "Change is unproven — no test runner installed." }),
  }));
  assert.equal(out.action, "silent");
  assert.equal(out.reason, "already_acknowledged");
});

test("decide: production diff, fresh hash → block", () => {
  const out = decide(baseArgs());
  assert.equal(out.action, "block");
  assert.equal(out.decision.decision, "block");
  assert.match(out.decision.reason, /ABP self-review/);
  assert.ok(!("hookSpecificOutput" in out.decision));
  assert.ok(out.hash);
  assert.equal(out.sessionId, "session-abc");
});

test("decide: duplicate hash is silent (idempotency)", () => {
  const first = decide(baseArgs());
  assert.equal(first.action, "block");
  const second = decide(baseArgs({ prevHash: first.hash }));
  assert.equal(second.action, "silent");
  assert.equal(second.reason, "duplicate_hash");
});

test("decide: different status with same prevHash → fires again", () => {
  const first = decide(baseArgs());
  const second = decide(baseArgs({
    status: " M src/other.ts\n",
    prevHash: first.hash,
  }));
  assert.equal(second.action, "block");
  assert.notEqual(second.hash, first.hash);
});

test("parseChangedPaths: handles modified, added, untracked, renamed", () => {
  const status = " M src/a.ts\nA  src/b.ts\n?? src/c.ts\nR  src/old.ts -> src/new.ts\n";
  assert.deepEqual(parseChangedPaths(status), [
    "src/a.ts",
    "src/b.ts",
    "src/c.ts",
    "src/new.ts",
  ]);
});

test("alreadyAcknowledged: case-insensitive substring match", () => {
  assert.equal(alreadyAcknowledged("self-review: clean"), true);
  assert.equal(alreadyAcknowledged("Findings: none, residual risk noted"), true);
  assert.equal(alreadyAcknowledged("proof: works"), true);
  assert.equal(alreadyAcknowledged("EVIDENCE: ran the test"), true);
  assert.equal(alreadyAcknowledged("This is Unproven."), true);
  assert.equal(alreadyAcknowledged("I made changes."), false);
  assert.equal(alreadyAcknowledged(""), false);
  assert.equal(alreadyAcknowledged(null), false);
  assert.equal(alreadyAcknowledged(undefined), false);
});

test("computeHash: stable for same inputs, distinct for different", () => {
  const a = computeHash("s1", "head1", " M f.ts\n");
  const b = computeHash("s1", "head1", " M f.ts\n");
  const c = computeHash("s1", "head1", " M g.ts\n");
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test("buildDecision: shape matches Claude Code Stop hook contract", () => {
  const d = buildDecision();
  assert.equal(d.decision, "block");
  assert.ok(typeof d.reason === "string" && d.reason.length > 0);
  // Stop has no entry in Claude Code's hookSpecificOutput schema, so the
  // field must be omitted — emitting it fails JSON validation and drops
  // the reminder entirely.
  assert.ok(!("hookSpecificOutput" in d));
});

// End-to-end test against a real git repo.

function makeTempRepo() {
  const dir = mkdtempSync(join(tmpdir(), "abp-self-review-"));
  execFileSync("git", ["-C", dir, "init", "-q", "-b", "main"]);
  execFileSync("git", ["-C", dir, "config", "user.email", "t@t"]);
  execFileSync("git", ["-C", dir, "config", "user.name", "t"]);
  execFileSync("git", ["-C", dir, "commit", "-q", "--allow-empty", "-m", "init"]);
  return dir;
}

function runScript(input, env = {}) {
  return spawnSync("node", [SCRIPT], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

function makeStateFile() {
  // State must live outside the repo: writing it inside would make
  // `git status` report it as untracked, changing the status hash between
  // invocations and defeating idempotency.
  const dir = mkdtempSync(join(tmpdir(), "abp-self-review-state-"));
  return { path: join(dir, "state.json"), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test("e2e: clean tree exits 0 silent", () => {
  const repo = makeTempRepo();
  const state = makeStateFile();
  try {
    const r = runScript(
      { session_id: "e2e-1", cwd: repo, hook_event_name: "Stop" },
      { ABP_SELF_REVIEW_STATE_FILE: state.path },
    );
    assert.equal(r.status, 0);
    assert.equal(r.stdout, "");
  } finally {
    rmSync(repo, { recursive: true, force: true });
    state.cleanup();
  }
});

test("e2e: production change emits block JSON and writes state", () => {
  const repo = makeTempRepo();
  const state = makeStateFile();
  writeFileSync(join(repo, "feature.ts"), "export const x = 1;\n");
  try {
    const r = runScript(
      {
        session_id: "e2e-2",
        cwd: repo,
        hook_event_name: "Stop",
        last_assistant_message: "Implemented x.",
      },
      { ABP_SELF_REVIEW_STATE_FILE: state.path },
    );
    assert.equal(r.status, 0);
    const parsed = JSON.parse(r.stdout);
    assert.equal(parsed.decision, "block");
    assert.match(parsed.reason, /ABP self-review/);
    assert.ok(!("hookSpecificOutput" in parsed));

    const stored = JSON.parse(readFileSync(state.path, "utf8"));
    assert.ok(stored["e2e-2"], "state file should record the session hash");
  } finally {
    rmSync(repo, { recursive: true, force: true });
    state.cleanup();
  }
});

test("e2e: second invocation with same state file is silent (idempotency)", () => {
  const repo = makeTempRepo();
  const state = makeStateFile();
  writeFileSync(join(repo, "feature.ts"), "export const x = 1;\n");
  try {
    const first = runScript(
      { session_id: "e2e-3", cwd: repo, hook_event_name: "Stop" },
      { ABP_SELF_REVIEW_STATE_FILE: state.path },
    );
    assert.equal(first.status, 0);
    assert.ok(first.stdout.length > 0);

    const second = runScript(
      { session_id: "e2e-3", cwd: repo, hook_event_name: "Stop" },
      { ABP_SELF_REVIEW_STATE_FILE: state.path },
    );
    assert.equal(second.status, 0);
    assert.equal(second.stdout, "");
  } finally {
    rmSync(repo, { recursive: true, force: true });
    state.cleanup();
  }
});

test("e2e: stop_hook_active=true is silent even with dirty production tree", () => {
  const repo = makeTempRepo();
  const state = makeStateFile();
  writeFileSync(join(repo, "feature.ts"), "export const x = 1;\n");
  try {
    const r = runScript(
      {
        session_id: "e2e-4",
        cwd: repo,
        hook_event_name: "Stop",
        stop_hook_active: true,
      },
      { ABP_SELF_REVIEW_STATE_FILE: state.path },
    );
    assert.equal(r.status, 0);
    assert.equal(r.stdout, "");
  } finally {
    rmSync(repo, { recursive: true, force: true });
    state.cleanup();
  }
});

test("e2e: not a git repo is silent", () => {
  const dir = mkdtempSync(join(tmpdir(), "abp-self-review-nongit-"));
  const state = makeStateFile();
  try {
    const r = runScript(
      { session_id: "e2e-5", cwd: dir, hook_event_name: "Stop" },
      { ABP_SELF_REVIEW_STATE_FILE: state.path },
    );
    assert.equal(r.status, 0);
    assert.equal(r.stdout, "");
  } finally {
    rmSync(dir, { recursive: true, force: true });
    state.cleanup();
  }
});

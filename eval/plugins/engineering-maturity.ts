import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import type { EvalPlugin, EvalSession, VerifyResult } from "pi-do-eval";

const TEXT_FILE_EXTENSIONS = new Set([".html", ".js", ".json", ".md", ".sql", ".txt"]);
const KNOWN_SKILLS = [
  "workflow",
  "proof",
  "whiteboarding",
  "data-first",
  "architecture",
  "code-review",
  "debugging",
  "refactoring",
  "error-handling",
  "security",
  "database",
  "release",
  "observability",
  "async-systems",
  "performance",
  "api",
  "documentation",
  "ui-design",
  "accessibility",
  "git-workflow",
  "scaffolding",
] as const;

interface RoutingCriteria {
  caseId: number;
  title: RegExp;
  expected: Array<[label: string, pattern: RegExp]>;
  excluded: Array<[label: string, pattern: RegExp]>;
  maxNamedSkills: number;
}

type PluginScoreResult = ReturnType<EvalPlugin["scoreSession"]>;

const ROUTING_CRITERIA: RoutingCriteria[] = [
  {
    caseId: 1,
    title: /checkout payment change triage/i,
    expected: [
      ["data modeling", /\b(data[- ]first|data[ /-]invariants?|data model(?:ing)?|domain model|invariant)\b/i],
      ["trust boundary", /\b(security|trust boundary|auth|sensitive|payment)\b/i],
      ["persistence", /\b(database|migration|persist|stored data)\b/i],
      ["public contract", /\b(api|contract|wire|http)\b/i],
      ["release safety", /\b(release|rollout|rollback|deploy)\b/i],
      ["proof", /(?:\bproof\b(?!\s*->)|\bevidence plan\b|\bverification (?:plan|step)\b|\btest plan\b|\bacceptance check\b|\bvalidation plan\b)/i],
      ["self-review", /\b(code[- ]review|self[- ]review|review the diff|diff review)\b/i],
    ],
    excluded: [
      ["product expansion excluded", /\b(wallet|management UX|broad .*redesign|unrelated checkout|unrelated account)\b/i],
      ["speculative platform work excluded", /\b(provider abstraction|generalized|multi-provider|new external dependencies|speculative resilience|retry orchestration)\b/i],
    ],
    maxNamedSkills: 11,
  },
  {
    caseId: 2,
    title: /worker retry change triage/i,
    expected: [
      ["async behavior", /\b(async[- ]systems|worker|queue|concurrency|retry)\b/i],
      ["error handling", /\b(error[- ]handling|failure|timeout|retry)\b/i],
      ["observability", /\b(observability|log|metric|trace|lifecycle)\b/i],
      ["proof", /(?:\bproof\b(?!\s*->)|\bevidence plan\b|\bverification (?:plan|step)\b|\btest plan\b|\bacceptance check\b|\bvalidation plan\b)/i],
      ["self-review", /\b(code[- ]review|self[- ]review|review the diff|diff review)\b/i],
    ],
    excluded: [
      ["database excluded", /\b(database|migration|schema|transaction)\b/i],
      ["ui excluded", /\b(ui[- ]design|accessibility|screen reader|keyboard|wcag)\b/i],
    ],
    maxNamedSkills: 7,
  },
  {
    caseId: 3,
    title: /settings copy change triage/i,
    expected: [
      ["user surface", /\b(ui[- ]design|user-facing|interface|copy|content)\b/i],
      ["accessibility", /\b(accessibility|screen reader|keyboard|wcag|focus)\b/i],
      ["documentation", /\b(documentation|docs|content|copy)\b/i],
      ["verification", /(?:\bproof\b(?!\s*->)|\bverification (?:plan|step)\b|\binspection pass\b|\bacceptance check\b|\bcopy review\b|\bscreen reader check\b)/i],
    ],
    excluded: [
      ["security excluded", /\b(security|auth|secret|trust boundary)\b/i],
      ["database excluded", /\b(database|migration|schema|transaction)\b/i],
      ["async excluded", /\b(async[- ]systems|queue|worker|stream|concurrency)\b/i],
    ],
    maxNamedSkills: 8,
  },
  {
    caseId: 4,
    title: /customer email migration triage/i,
    expected: [
      ["database", /\b(database|migration|schema|index|constraint)\b/i],
      ["release", /\b(release|rollout|rollback|deploy)\b/i],
      ["data invariant", /\b(data[- ]first|invariant|unique|email)\b/i],
      ["proof", /(?:\bproof\b(?!\s*->)|\bevidence plan\b|\bverification (?:plan|step)\b|\btest plan\b|\bacceptance check\b|\bexplain plan\b|\bdry[- ]run\b)/i],
      ["self-review", /\b(code[- ]review|self[- ]review|review the diff|diff review)\b/i],
    ],
    excluded: [
      ["ui excluded", /\b(ui[- ]design|accessibility|screen reader|keyboard|wcag)\b/i],
      ["async excluded", /\b(async[- ]systems|queue|worker|stream|concurrency)\b/i],
    ],
    maxNamedSkills: 7,
  },
];

function runNodeCheck(workDir: string, script: string): VerifyResult {
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: workDir,
    encoding: "utf-8",
    timeout: 30_000,
  });
  return {
    passed: result.status === 0,
    output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
    metrics: {},
  };
}

function runVisibleTests(workDir: string): VerifyResult {
  const packageJsonPath = path.join(workDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return { passed: false, output: "Missing package.json", metrics: {} };
  }
  const result = spawnSync("npm", ["test"], {
    cwd: workDir,
    encoding: "utf-8",
    timeout: 60_000,
  });
  return {
    passed: result.status === 0,
    output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
    metrics: {},
  };
}

function runTextCheck(name: string, checks: Array<[label: string, passed: boolean]>): VerifyResult {
  const failed = checks.filter(([, passed]) => !passed).map(([label]) => label);
  return {
    passed: failed.length === 0,
    output: failed.length === 0 ? `${name}: OK` : `${name}: failed checks: ${failed.join(", ")}`,
    metrics: {},
  };
}

function readIfExists(filePath: string): string {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "";
}

function routingMarkerPath(workDir: string): string {
  return path.join(workDir, ".abp-eval-kind.json");
}

function readRoutingMarker(workDir: string): { kind?: unknown; case?: unknown } | undefined {
  try {
    return JSON.parse(readIfExists(routingMarkerPath(workDir))) as { kind?: unknown; case?: unknown };
  } catch {
    return undefined;
  }
}

function isRoutingTrial(workDir: string): boolean {
  return readRoutingMarker(workDir)?.kind === "routing";
}

function extractTextBlocks(content: unknown): string[] {
  if (!Array.isArray(content)) return [];
  const textBlocks: string[] = [];
  for (const block of content) {
    if (typeof block !== "object" || block === null) continue;
    const candidate = block as { type?: unknown; text?: unknown };
    if ((candidate.type === "text" || candidate.type === "output_text") && typeof candidate.text === "string") {
      textBlocks.push(candidate.text);
    }
  }
  return textBlocks;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function collectRoleMessages(value: unknown, role: "user" | "assistant", messages: string[]): void {
  const record = asRecord(value);
  if (!record) return;

  const message = asRecord(record["message"]);
  if (message?.["role"] === role) {
    const text = extractTextBlocks(message["content"]).join("\n").trim();
    if (text) messages.push(text);
    return;
  }

  const item = asRecord(record["item"]);
  if (
    role === "assistant" &&
    item?.["type"] === "agent_message" &&
    typeof item["text"] === "string" &&
    item["text"].trim()
  ) {
    messages.push(item["text"].trim());
    return;
  }
  if (item?.["role"] === role) {
    const text = extractTextBlocks(item["content"]).join("\n").trim();
    if (text) messages.push(text);
    return;
  }

  for (const child of Object.values(record)) collectRoleMessages(child, role, messages);
}

function extractMessages(rawLines: string[], role: "user" | "assistant"): string[] {
  const messages: string[] = [];
  for (const line of rawLines) {
    if (!line.trim()) continue;
    try {
      collectRoleMessages(JSON.parse(line), role, messages);
    } catch {
      continue;
    }
  }
  return messages;
}

export function extractInitialUserPrompt(rawLines: string[]): string {
  return extractMessages(rawLines, "user")[0] ?? "";
}

export function extractFinalAssistantText(rawLines: string[]): string {
  const messages = extractMessages(rawLines, "assistant");
  return messages[messages.length - 1] ?? "";
}

function matchingRoutingCriteria(prompt: string): RoutingCriteria | undefined {
  return ROUTING_CRITERIA.find((criteria) => criteria.title.test(prompt));
}

function hasExplicitExclusion(text: string, pattern: RegExp): boolean {
  const exclusionSection = text.match(
    /(?:engineering lenses to (?:explicitly )?exclude|excluded? (?:lenses|areas|scope)|exclusions?)[\s\S]*?(?=\n\s*(?:#{1,6}\s|\*\*[^*\n]+:\*\*|[A-Z][A-Za-z /-]{2,}:)|$)/i,
  )?.[0];
  if (exclusionSection && pattern.test(exclusionSection)) return true;

  const sentences = text.split(/(?<=[.!?])\s+|\n+/);
  return sentences.some(
    (sentence) => pattern.test(sentence) && /\b(exclude|skip|defer|not needed|not relevant|out of scope|unneeded|avoid)\b/i.test(sentence),
  );
}

function countNamedSkills(text: string): number {
  return KNOWN_SKILLS.filter((skill) => new RegExp(`\\b${skill.replaceAll("-", "[- ]")}\\b`, "i").test(text)).length;
}

function scoreRoutingSession(session: EvalSession, verify: VerifyResult): PluginScoreResult {
  const prompt = extractInitialUserPrompt(session.rawLines);
  const finalAnswer = extractFinalAssistantText(session.rawLines);
  const routingCase = verify.metrics["routingCase"];
  const criteria =
    routingCase !== undefined
      ? ROUTING_CRITERIA.find((candidate) => candidate.caseId === routingCase)
      : matchingRoutingCriteria(prompt);
  if (!criteria) {
    return {
      scores: { routing: 0, exclusions: 0, proof_plan: 0, proportionality: 0 },
      weights: { routing: 0.4, exclusions: 0.2, proof_plan: 0.25, proportionality: 0.15 },
      findings: ["Routing trial criteria could not be matched from the prompt."],
      judge: {
        includeInOverall: true,
        defaultWeight: 0.2,
        weights: {
          engineering_maturity: 0.35,
          proof_quality: 0.25,
          simplicity: 0.2,
          risk_handling: 0.2,
        },
      },
    };
  }

  const expectedHits = criteria.expected.filter(([, pattern]) => pattern.test(finalAnswer));
  const excludedHits = criteria.excluded.filter(([, pattern]) => hasExplicitExclusion(finalAnswer, pattern));
  const writesScore = session.fileWrites.length === 0 ? 100 : 0;
  const proofSignals = [
    /\b(proof|evidence|validation|verification|test|check|inspect)\b/i.test(finalAnswer),
    /\b(command|scenario|negative|regression|acceptance|boundary)\b/i.test(finalAnswer),
    /\b(self[- ]review|review the diff|code[- ]review|before claiming done|final scoped claim)\b/i.test(finalAnswer),
  ].filter(Boolean).length;
  const namedSkills = countNamedSkills(finalAnswer);
  const proportionality =
    namedSkills <= criteria.maxNamedSkills && namedSkills >= Math.min(3, criteria.expected.length) ? 100 : namedSkills === 0 ? 35 : 60;

  const scores = {
    routing: Math.round((expectedHits.length / criteria.expected.length) * 100),
    exclusions: Math.round((excludedHits.length / criteria.excluded.length) * 100),
    proof_plan: Math.round((proofSignals / 3) * 100),
    no_file_writes: writesScore,
    proportionality,
  };
  const weights = {
    routing: 0.35,
    exclusions: 0.15,
    proof_plan: 0.25,
    no_file_writes: 0.1,
    proportionality: 0.15,
  };
  const findings: string[] = [];
  for (const [label] of criteria.expected.filter(([label]) => !expectedHits.some(([hit]) => hit === label))) {
    findings.push(`Missing expected routing lens: ${label}.`);
  }
  for (const [label] of criteria.excluded.filter(([label]) => !excludedHits.some(([hit]) => hit === label))) {
    findings.push(`Missing explicit exclusion: ${label}.`);
  }
  if (session.fileWrites.length > 0) findings.push("Routing trial wrote files despite being read-only.");
  if (proofSignals < 3) findings.push("Evidence plan or self-review loop was incomplete.");
  if (scores.proportionality < 100) findings.push("Routing was not proportional to the task risks.");

  return {
    scores,
    weights,
    findings,
    judge: {
      includeInOverall: true,
      defaultWeight: 0.2,
      weights: {
        engineering_maturity: 0.35,
        proof_quality: 0.25,
        simplicity: 0.2,
        risk_handling: 0.2,
      },
    },
  };
}

function isCommandTool(call: EvalSession["toolCalls"][number]): boolean {
  return /\b(exec_command|bash|shell|terminal|run_command|write_stdin)\b/i.test(call.name);
}

function commandText(call: EvalSession["toolCalls"][number]): string {
  const args = call.arguments as Record<string, unknown>;
  const fields = ["cmd", "command", "script", "input", "chars"];
  return fields.map((field) => args[field]).filter((value): value is string => typeof value === "string").join(" ");
}

function hasPostWriteCommand(session: EvalSession, pattern: RegExp): boolean {
  const writeTimes = session.fileWrites.map((write) => write.timestamp);
  if (writeTimes.length === 0) return false;
  const lastWrite = Math.max(...writeTimes);
  return session.toolCalls.some(
    (call) => call.timestamp > lastWrite && isCommandTool(call) && pattern.test(`${call.name} ${commandText(call)}`),
  );
}

function runHiddenChecks(workDir: string): VerifyResult {
  if (fs.existsSync(path.join(workDir, "src", "cart.js"))) {
    return runNodeCheck(
      workDir,
      `
        import assert from "node:assert/strict";
        import { totalCents } from "./src/cart.js";
        assert.equal(totalCents([{ priceCents: 1000, quantity: 2 }], "SAVE10"), 1800);
        assert.equal(totalCents([{ priceCents: 333, quantity: 3 }]), 999);
        assert.throws(() => totalCents([{ priceCents: -1, quantity: 1 }]));
        assert.throws(() => totalCents([{ priceCents: 100, quantity: 1.5 }]));
      `,
    );
  }

  if (fs.existsSync(path.join(workDir, "src", "redirect.js"))) {
    return runNodeCheck(
      workDir,
      `
        import assert from "node:assert/strict";
        import { resolveRedirect } from "./src/redirect.js";
        assert.equal(resolveRedirect("/account/settings"), "/account/settings");
        assert.equal(resolveRedirect("https://example.com/docs"), "https://example.com/docs");
        assert.equal(resolveRedirect("https://evil.example/phish"), "/");
        assert.equal(resolveRedirect("//evil.example/phish"), "/");
        assert.equal(resolveRedirect("javascript:alert(1)"), "/");
      `,
    );
  }

  if (fs.existsSync(path.join(workDir, "docs", "checkout-notes.md"))) {
    const docPath = path.join(workDir, "docs", "checkout-validation.md");
    const content = readIfExists(docPath);
    return runTextCheck("checkout validation note", [
      ["created docs/checkout-validation.md", content.length > 0],
      ["states context", /\bcontext\b/i.test(content)],
      ["states a decision", /\bdecision\b/i.test(content)],
      ["describes alternatives", /\balternatives?\b/i.test(content)],
      ["covers consequences or follow-up", /\b(consequences?|follow[- ]?up)\b/i.test(content)],
      ["names the validation boundary", /\b(boundary|validation)\b/i.test(content)],
    ]);
  }

  if (fs.existsSync(path.join(workDir, "src", "profile.js"))) {
    return runNodeCheck(
      workDir,
      `
        import assert from "node:assert/strict";
        import { mergeProfile } from "./src/profile.js";

        const existing = {
          id: "u_1",
          preferences: { theme: "dark", email: true },
          tags: ["admin"],
        };
        const patch = {
          preferences: { email: false },
          tags: ["beta"],
        };
        const merged = mergeProfile(existing, patch);

        assert.deepEqual(merged.preferences, { theme: "dark", email: false });
        assert.deepEqual(merged.tags, ["beta"]);
        assert.deepEqual(existing.preferences, { theme: "dark", email: true });
        assert.deepEqual(existing.tags, ["admin"]);
        assert.notEqual(merged.preferences, existing.preferences);
        assert.notEqual(merged.tags, existing.tags);

        // Negative test: prototype-pollution guard must actually block the
        // attack. JSON.parse is used so the attack surface is realistic
        // (network/JSON-borne patches), and we capture/restore the canary
        // on Object.prototype to keep this trial isolated from the runner.
        const canaryBefore = Object.prototype.polluted;
        try {
          const malicious = JSON.parse(
            '{"__proto__":{"polluted":"yes"}}'
          );
          mergeProfile({ id: "u_2" }, malicious);
          assert.equal(
            ({}).polluted,
            canaryBefore,
            "mergeProfile leaked __proto__ patch into Object.prototype",
          );
        } finally {
          if (canaryBefore === undefined) delete Object.prototype.polluted;
          else Object.prototype.polluted = canaryBefore;
        }

        // Negative test: a constructor-key attack must also not escalate.
        const ctorBefore = Object.prototype.ctorPolluted;
        try {
          const constructorAttack = JSON.parse(
            '{"constructor":{"prototype":{"ctorPolluted":"yes"}}}'
          );
          mergeProfile({ id: "u_3" }, constructorAttack);
          assert.equal(
            ({}).ctorPolluted,
            ctorBefore,
            "mergeProfile leaked constructor.prototype patch",
          );
        } finally {
          if (ctorBefore === undefined) delete Object.prototype.ctorPolluted;
          else Object.prototype.ctorPolluted = ctorBefore;
        }
      `,
    );
  }

  if (fs.existsSync(path.join(workDir, "src", "users.js"))) {
    return runNodeCheck(
      workDir,
      `
        import assert from "node:assert/strict";
        import { handleUserLookup } from "./src/users.js";

        const missing = handleUserLookup({ query: {} });
        assert.equal(missing.status, 400);
        assert.equal(typeof missing.body.error, "string");
        assert.equal(typeof missing.body.message, "string");

        const absent = handleUserLookup({ query: { id: "missing" } });
        assert.equal(absent.status, 404);
        assert.equal(typeof absent.body.error, "string");
        assert.equal(typeof absent.body.message, "string");

        const found = handleUserLookup({ query: { id: "u_1" } });
        assert.equal(found.status, 200);
        assert.equal(found.body.id, "u_1");
      `,
    );
  }

  if (
    fs.existsSync(path.join(workDir, "migrations", "001_customer_email.sql")) ||
    fs.existsSync(path.join(workDir, "migrations", "001_customer_email_add_column.sql"))
  ) {
    const migrationFiles = fs
      .readdirSync(path.join(workDir, "migrations"))
      .filter((name) => name.endsWith(".sql") && !name.includes("rollback"));
    const allMigrationSql = migrationFiles
      .map((name) => readIfExists(path.join(workDir, "migrations", name)))
      .join("\n\n");
    const rollback = migrationFiles
      .map((name) => readIfExists(path.join(workDir, "migrations", name.replace(/\.sql$/, ".rollback.sql"))))
      .join("\n");
    const operations = [
      readIfExists(path.join(workDir, "OPERATIONS.md")),
      readIfExists(path.join(workDir, "operations.md")),
      readIfExists(path.join(workDir, "ROLLBACK.md")),
      readIfExists(path.join(workDir, "README.md")),
    ].join("\n");
    // Detect the broken-elaboration shape: a partial index (CREATE [UNIQUE]
    // INDEX … WHERE …) followed by an attempt to back a unique constraint
    // with that index (ADD CONSTRAINT … UNIQUE USING INDEX <same name>).
    // Postgres rejects this combination, so the elaboration looks
    // sophisticated but ships a migration that cannot apply.
    const partialIndexNames = Array.from(
      allMigrationSql.matchAll(/create\s+(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+not\s+exists\s+)?([a-z0-9_]+)\b[^;]*\bwhere\b[^;]*;/gi),
    ).map((m) => m[1]?.toLowerCase()).filter((name): name is string => Boolean(name));
    const constraintAttachments = Array.from(
      allMigrationSql.matchAll(/add\s+constraint\s+[a-z0-9_]+\s+unique\s+using\s+index\s+([a-z0-9_]+)/gi),
    ).map((m) => m[1]?.toLowerCase()).filter((name): name is string => Boolean(name));
    const brokenAttachment = constraintAttachments.find((name) => partialIndexNames.includes(name));
    return runTextCheck("customer email migration", [
      ["uses a concurrent index build", /create\s+(unique\s+)?index\s+concurrently\b/i.test(allMigrationSql)],
      ["separates uniqueness validation", /\b(not\s+valid|validate\s+constraint)\b/i.test(allMigrationSql)],
      ["adds a rollback file", rollback.length > 0],
      ["documents rollout", /\b(rollout|deploy|apply)\b/i.test(operations)],
      ["documents rollback", /\brollback\b/i.test(operations)],
      [
        // Elaboration that cannot actually attach as a unique constraint in
        // Postgres: partial index backing ADD CONSTRAINT … UNIQUE USING INDEX.
        `does not back a unique constraint with a partial index${brokenAttachment ? ` (${brokenAttachment})` : ""}`,
        brokenAttachment === undefined,
      ],
    ]);
  }

  if (fs.existsSync(path.join(workDir, "src", "worker.js"))) {
    return runNodeCheck(
      workDir,
      `
        import assert from "node:assert/strict";
        import { processNotifications } from "./src/worker.js";

        let active = 0;
        let maxActive = 0;
        const attempts = new Map();
        const events = [];
        const notifications = [{ id: "n1" }, { id: "n2" }, { id: "n3" }];

        async function send(notification) {
          active++;
          maxActive = Math.max(maxActive, active);
          attempts.set(notification.id, (attempts.get(notification.id) ?? 0) + 1);
          await new Promise((resolve) => setTimeout(resolve, 5));
          active--;
          if (notification.id === "n2" && attempts.get(notification.id) === 1) {
            throw new Error("temporary failure");
          }
        }

        const logger = {
          info(event, data) { events.push({ level: "info", event, data }); },
          warn(event, data) { events.push({ level: "warn", event, data }); },
          error(event, data) { events.push({ level: "error", event, data }); },
        };

        const result = await processNotifications(notifications, send, logger, { concurrency: 2 });

        assert.equal(result.sent, 3);
        assert.equal(result.failed, 0);
        assert.ok(maxActive <= 2);
        assert.ok(maxActive > 1);
        assert.equal(attempts.get("n2"), 2);
        assert.ok(events.length >= 2);
      `,
    );
  }

  if (fs.existsSync(path.join(workDir, "public", "index.html"))) {
    const html = readIfExists(path.join(workDir, "public", "index.html"));
    return runTextCheck("subscription form", [
      [
        "email input has an associated label",
        /<label[^>]+for=["']email["'][^>]*>/i.test(html) ||
          /<label\b[^>]*>[\s\S]*<input[^>]+id=["']email["']/i.test(html),
      ],
      ["uses a button for submit", /<button\b/i.test(html)],
      ["announces status changes", /\b(aria-live|role=["']status["'])\b/i.test(html)],
      ["does not use a clickable div submit", !/<div\b[^>]*(onclick|role=["']button["'])[^>]*>[\s\S]*subscribe/i.test(html)],
    ]);
  }

  if (fs.existsSync(path.join(workDir, "src", "index.js")) && fs.existsSync(path.join(workDir, "test", "index.test.js"))) {
    const packageJson = JSON.parse(readIfExists(path.join(workDir, "package.json")) || "{}") as {
      scripts?: Record<string, string>;
    };
    const readme = readIfExists(path.join(workDir, "README.md"));
    const commitPlan = readIfExists(path.join(workDir, "COMMIT_PLAN.md"));
    return runTextCheck("package baseline", [
      ["defines npm test", typeof packageJson.scripts?.["test"] === "string"],
      ["defines npm run typecheck", typeof packageJson.scripts?.["typecheck"] === "string"],
      ["defines npm run lint", typeof packageJson.scripts?.["lint"] === "string"],
      ["adds typecheck config", fs.existsSync(path.join(workDir, "tsconfig.json"))],
      ["documents local commands", /\bnpm\s+run\s+(test|typecheck|lint)\b|\bnpm\s+test\b/i.test(readme)],
      ["adds review grouping note", /\b(commit|review|change)\b/i.test(commitPlan)],
    ]);
  }

  return { passed: true, output: "No hidden check for this trial", metrics: {} };
}

function collectFiles(root: string, current = root, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".codex") continue;
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      collectFiles(root, fullPath, files);
    } else if (entry.isFile()) {
      files.push(path.relative(root, fullPath));
    }
  }
  return files.sort();
}

function readProjectSnapshot(workDir: string): string {
  const parts: string[] = [];
  for (const relativePath of collectFiles(workDir).slice(0, 24)) {
    const fullPath = path.join(workDir, relativePath);
    if (!TEXT_FILE_EXTENSIONS.has(path.extname(relativePath))) continue;
    const content = fs.readFileSync(fullPath, "utf-8").slice(0, 4_000);
    parts.push(`## ${relativePath}\n\`\`\`\n${content}\n\`\`\``);
  }
  return parts.join("\n\n");
}

const plugin: EvalPlugin = {
  name: "engineering-maturity",
  extensionPath: "",

  classifyFile(filePath) {
    if (filePath.includes("/test/") || filePath.endsWith(".test.js")) return "test";
    if (filePath.endsWith(".md")) return "documentation";
    if (filePath.includes("package.json")) return "config";
    return "source";
  },

  verify(workDir) {
    if (isRoutingTrial(workDir)) {
      const marker = readRoutingMarker(workDir);
      const routingCase = typeof marker?.case === "number" ? marker.case : 0;
      return {
        passed: true,
        output: "Routing trial: transcript-scored; no workdir verification required.",
        metrics: { routingTrial: 1, routingCase },
      };
    }

    const visible = runVisibleTests(workDir);
    const hidden = runHiddenChecks(workDir);
    return {
      passed: visible.passed && hidden.passed,
      output: [`# npm test\n${visible.output}`, `# hidden checks\n${hidden.output}`].join("\n\n"),
      metrics: {
        visiblePassed: visible.passed ? 1 : 0,
        hiddenPassed: hidden.passed ? 1 : 0,
      },
    };
  },

  scoreSession(session: EvalSession, verify: VerifyResult) {
    if (verify.metrics["routingTrial"] === 1) {
      return scoreRoutingSession(session, verify);
    }

    const wroteTests = session.fileWrites.some((file) => file.labels.includes("test"));
    const wroteSource = session.fileWrites.some((file) => file.labels.includes("source"));
    const touchedManyFiles = session.fileWrites.length > 8;
    const postWriteSelfReview = hasPostWriteCommand(
      session,
      /\b(git\s+(?:diff|status|show)|rg\b)\b/i,
    );
    const postWriteProof = hasPostWriteCommand(
      session,
      /\b(npm\s+test|npm\s+run\s+(test|typecheck|lint|check)|vitest|pytest|go\s+test|cargo\s+test|mvn\s+test|uv\s+run\s+(pytest|ruff|pyright|python)|refcheck|validate_skill_anatomy)\b/i,
    );

    const scores = {
      verification: verify.passed ? 100 : 0,
      proof: wroteTests && postWriteProof ? 100 : wroteTests ? 85 : postWriteProof ? 75 : verify.passed ? 45 : 15,
      self_review: !wroteSource ? 80 : postWriteSelfReview ? 100 : 35,
      change_quality: wroteSource && !touchedManyFiles ? 85 : wroteSource ? 65 : 25,
    };
    const weights = {
      verification: 0.45,
      proof: 0.25,
      self_review: 0.15,
      change_quality: 0.15,
    };
    const findings: string[] = [];
    if (!wroteTests) findings.push("No test file writes were detected.");
    if (wroteSource && !postWriteSelfReview) findings.push("No post-change self-review inspection was detected.");
    if (wroteSource && !postWriteProof) findings.push("No post-change proof command was detected.");
    if (touchedManyFiles) findings.push("The solution touched many files for a small trial.");
    if (!verify.passed) findings.push("Visible tests or hidden checks failed.");

    return {
      scores,
      weights,
      findings,
      judge: {
        includeInOverall: true,
        defaultWeight: 0.2,
        weights: {
          engineering_maturity: 0.35,
          proof_quality: 0.25,
          simplicity: 0.2,
          risk_handling: 0.2,
        },
      },
    };
  },

  buildJudgePrompt(taskDescription, workDir) {
    return [
      "Evaluate this coding-agent result for engineering maturity.",
      "Respond with ONLY a single JSON object containing all required keys below. Scores must be numbers from 0 to 100.",
      "",
      "Required keys:",
      '- "engineering_maturity"',
      '- "engineering_maturity_reason"',
      '- "proof_quality"',
      '- "proof_quality_reason"',
      '- "simplicity"',
      '- "simplicity_reason"',
      '- "risk_handling"',
      '- "risk_handling_reason"',
      '- "findings" (JSON array of short strings)',
      "",
      "Findings rules:",
      '- "findings" MUST be a non-empty array whenever ANY score is below 90.',
      "- Each finding is one short sentence: a positive (\"good: …\") or a concrete concern (\"concern: …\"). Reference the specific file or function the finding applies to.",
      "- A score below 90 with no matching finding is invalid output; if you can't name a concern, the score should be ≥ 90.",
      "",
      "Scoring guidance:",
      "- Prefer evidence-backed, low-complexity, maintainable changes.",
      "- Penalize superficial test edits, broad rewrites, missing edge cases, and changes that only satisfy the visible tests.",
      "- Penalize elaborations that look sophisticated but do not deliver the invariant they imply (e.g. partial unique indexes that cannot enforce uniqueness, prototype-pollution guards that still permit `__proto__` writes, custom scripts that introduce undeclared dependencies).",
      "- A solution that fails verification but is otherwise simple SHOULD score lower on engineering_maturity and risk_handling than a solution that passes verification with the same simplicity.",
      "",
      "## Task",
      taskDescription,
      "",
      "## Final Assistant Answer",
      readIfExists(path.join(workDir, ".abp-eval", "assistant-final.md")) || "(not captured)",
      "",
      "## Final Workdir Snapshot",
      readProjectSnapshot(workDir),
    ].join("\n");
  },
};

export default plugin;

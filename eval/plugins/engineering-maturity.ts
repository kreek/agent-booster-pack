import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import type { EvalPlugin, EvalSession, VerifyResult } from "do-eval";

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

type PluginScoreResult = ReturnType<EvalPlugin["scoreSession"]>;

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

function combineChecks(name: string, results: VerifyResult[]): VerifyResult {
  const failed = results.flatMap((result) => (result.passed ? [] : [result.output]));
  return {
    passed: failed.length === 0,
    output: failed.length === 0 ? `${name}: OK` : failed.join("\n\n"),
    metrics: Object.assign({}, ...results.map((result) => result.metrics)),
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

function commandAndResultText(session: EvalSession): string {
  return session.toolCalls
    .map((call) => `${call.name} ${commandText(call)}\n${call.resultText}`)
    .join("\n");
}

function isBaselineSession(session: EvalSession): boolean {
  return /-codexBaseline[-/]|"profile"\s*:\s*"codexBaseline"|\bcodexBaseline\b/i.test(commandAndResultText(session));
}

function isAbpSession(session: EvalSession): boolean {
  return /-codexWithAbpSkills[-/]|"profile"\s*:\s*"codexWithAbpSkills"|\bcodexWithAbpSkills\b/i.test(
    commandAndResultText(session),
  );
}

function readAbpSkillNames(session: EvalSession): string[] {
  const text = commandAndResultText(session);
  const skills = new Set<string>();
  for (const match of text.matchAll(/agents\/\.agents\/skills\/([^/\s"']+)\/SKILL\.md/g)) {
    if (match[1]) skills.add(match[1]);
  }
  for (const match of text.matchAll(/plugin\/skills\/([^/\s"']+)\/SKILL\.md/g)) {
    if (match[1]) skills.add(match[1]);
  }
  for (const match of text.matchAll(/\.codex\/skills\/([^/\s"']+)\/SKILL\.md/g)) {
    if (match[1]) skills.add(match[1]);
  }
  return [...skills].sort();
}

function scoreRoutingSession(session: EvalSession, _verify: VerifyResult): PluginScoreResult {
  const skillReads = readAbpSkillNames(session);
  const baselineSkillReads = isBaselineSession(session) ? skillReads : [];
  const abpSkillReads = isAbpSession(session) ? skillReads : [];
  const writesScore = session.fileWrites.length === 0 ? 100 : 0;
  const scores = {
    no_file_writes: writesScore,
    baseline_isolation: baselineSkillReads.length > 0 ? 0 : 100,
    abp_activation: isAbpSession(session) && abpSkillReads.length === 0 ? 0 : 100,
  };
  const weights = {
    no_file_writes: 0.7,
    baseline_isolation: 0.15,
    abp_activation: 0.15,
  };
  const findings: string[] = [];
  if (session.fileWrites.length > 0) findings.push("Routing trial wrote files despite being read-only.");
  if (baselineSkillReads.length > 0) {
    findings.push(`Baseline session read ABP skill files: ${baselineSkillReads.join(", ")}.`);
  }
  if (isAbpSession(session) && abpSkillReads.length === 0) {
    findings.push("ABP profile did not read any ABP skill files; plugin activation is not proven.");
  }

  return {
    scores,
    weights,
    findings,
    judge: {
      includeInOverall: true,
      defaultWeight: 0.45,
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
  return /\b(command_execution|exec_command|bash|shell|terminal|run_command|write_stdin)\b/i.test(call.name);
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

function stripSqlComments(sql: string): string {
  return sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

function splitSqlStatements(sql: string): string[] {
  return stripSqlComments(sql)
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function validateCustomerEmailSql(workDir: string): VerifyResult {
  const migrationFiles = fs
    .readdirSync(path.join(workDir, "migrations"))
    .filter((name) => name.endsWith(".sql") && !name.includes("rollback"));
  const allMigrationSql = migrationFiles
    .map((name) => readIfExists(path.join(workDir, "migrations", name)))
    .join("\n\n");
  const statements = splitSqlStatements(allMigrationSql);
  const rollback = migrationFiles
    .map((name) => readIfExists(path.join(workDir, "migrations", name.replace(/\.sql$/, ".rollback.sql"))))
    .join("\n");
  const operations = [
    readIfExists(path.join(workDir, "OPERATIONS.md")),
    readIfExists(path.join(workDir, "operations.md")),
    readIfExists(path.join(workDir, "ROLLBACK.md")),
    readIfExists(path.join(workDir, "README.md")),
  ].join("\n");
  const partialIndexNames = Array.from(
    allMigrationSql.matchAll(/create\s+(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+not\s+exists\s+)?([a-z0-9_]+)\b[^;]*\bwhere\b[^;]*;/gi),
  ).map((m) => m[1]?.toLowerCase()).filter((name): name is string => Boolean(name));
  const constraintAttachments = Array.from(
    allMigrationSql.matchAll(/add\s+constraint\s+[a-z0-9_]+\s+unique\s+using\s+index\s+([a-z0-9_]+)/gi),
  ).map((m) => m[1]?.toLowerCase()).filter((name): name is string => Boolean(name));
  const brokenAttachment = constraintAttachments.find((name) => partialIndexNames.includes(name));
  const allowedPostgresStatements = statements.every((statement) =>
    [
      /^alter\s+table\s+customers\s+add\s+column\s+(?:if\s+not\s+exists\s+)?email\s+text(?:\s+null)?$/i,
      /^create\s+unique\s+index\s+concurrently\s+(?:if\s+not\s+exists\s+)?[a-z0-9_]+\s+on\s+customers\s*\(\s*(?:lower\s*\(\s*)?email\s*\)?\s*\)(?:\s+where\s+email\s+is\s+not\s+null)?$/i,
      /^alter\s+table\s+customers\s+add\s+constraint\s+[a-z0-9_]+\s+unique\s+using\s+index\s+[a-z0-9_]+$/i,
    ].some((pattern) => pattern.test(statement.replace(/\s+/g, " "))),
  );

  return runTextCheck("customer email migration", [
    ["contains only recognized Postgres online-migration statements", statements.length > 0 && allowedPostgresStatements],
    ["uses a concurrent unique index build", /create\s+unique\s+index\s+concurrently\b/i.test(allMigrationSql)],
    ["does not create a blocking unique index", !/create\s+unique\s+index\s+(?!concurrently\b)/i.test(allMigrationSql)],
    ["separates uniqueness from the initial table change", statements.length >= 2],
    ["adds a rollback file", rollback.length > 0],
    ["rollback reverses schema or index changes", /\b(drop\s+index|drop\s+constraint|drop\s+column)\b/i.test(rollback)],
    ["documents rollout", /\b(rollout|deploy|apply)\b/i.test(operations)],
    ["documents validation", /\b(validate|verification|check)\b/i.test(operations)],
    ["documents rollback", /\brollback\b/i.test(operations)],
    [
      `does not back a unique constraint with a partial index${brokenAttachment ? ` (${brokenAttachment})` : ""}`,
      brokenAttachment === undefined,
    ],
  ]);
}

function runOptionalPostgresMigrationCheck(workDir: string): VerifyResult {
  const databaseUrl = process.env["ABP_EVAL_POSTGRES_URL"];
  if (!databaseUrl) return { passed: true, output: "Postgres execution skipped; ABP_EVAL_POSTGRES_URL is not set.", metrics: {} };

  const migrationFiles = fs
    .readdirSync(path.join(workDir, "migrations"))
    .filter((name) => name.endsWith(".sql") && !name.includes("rollback"))
    .sort();
  const allMigrationSql = migrationFiles
    .map((name) => readIfExists(path.join(workDir, "migrations", name)))
    .join("\n\n");
  const schema = `abp_eval_${process.pid}_${Date.now()}`;
  const artifactDir = path.join(workDir, ".abp-eval");
  fs.mkdirSync(artifactDir, { recursive: true });
  const scriptPath = path.join(artifactDir, "postgres-migration-check.sql");
  fs.writeFileSync(
    scriptPath,
    [
      `DROP SCHEMA IF EXISTS ${schema} CASCADE;`,
      `CREATE SCHEMA ${schema};`,
      `SET search_path TO ${schema};`,
      "CREATE TABLE customers (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY);",
      ...splitSqlStatements(allMigrationSql).map((statement) => `${statement};`),
      `DROP SCHEMA ${schema} CASCADE;`,
    ].join("\n"),
  );
  const result = spawnSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", scriptPath], {
    cwd: workDir,
    encoding: "utf-8",
    timeout: 30_000,
  });
  return {
    passed: result.status === 0,
    output: [result.stdout, result.stderr].filter(Boolean).join("\n"),
    metrics: { postgresExecuted: result.status === 0 ? 1 : 0 },
  };
}

function hasSubmittedProofForTrial(workDir: string): boolean {
  if (fs.existsSync(path.join(workDir, "src", "cart.js"))) {
    const tests = readIfExists(path.join(workDir, "test", "cart.test.js"));
    return /\bSAVE10\b/.test(tests) && /assert\.throws/.test(tests) && /\b(integer|invalid|negative|quantity|priceCents)\b/i.test(tests);
  }
  if (fs.existsSync(path.join(workDir, "src", "pipeline.js"))) {
    const tests = readIfExists(path.join(workDir, "test", "pipeline.test.js"));
    return /\bvalid\b/.test(tests) &&
      /\berrors\b/.test(tests) &&
      /(deepEqual|deepStrictEqual|toEqual)/.test(tests) &&
      /(duplicate|dedupe|same\s+email|second\s+occurrence)/i.test(tests) &&
      /(reason|invalid|malformed|unable|cannot)/i.test(tests);
  }
  if (fs.existsSync(path.join(workDir, "src", "redirect.js"))) {
    const tests = readIfExists(path.join(workDir, "test", "redirect.test.js"));
    return /example\.com/.test(tests) && /evil\.example|javascript:|protocol-relative|\/\//i.test(tests);
  }
  if (fs.existsSync(path.join(workDir, "src", "profile.js"))) {
    const tests = readIfExists(path.join(workDir, "test", "profile.test.js"));
    return /preferences/.test(tests) && /notEqual|notStrictEqual/.test(tests) && /__proto__|constructor|prototype/.test(tests);
  }
  if (fs.existsSync(path.join(workDir, "src", "users.js"))) {
    const tests = readIfExists(path.join(workDir, "test", "users.test.js"));
    return /\b400\b/.test(tests) && /\b404\b/.test(tests) && /\berror\b/.test(tests) && /\bmessage\b/.test(tests);
  }
  if (fs.existsSync(path.join(workDir, "src", "worker.js"))) {
    const tests = readIfExists(path.join(workDir, "test", "worker.test.js"));
    return /\bconcurrency\b|\bmaxActive\b/i.test(tests) && /\bretry|attempt/i.test(tests) && /\blog|events/i.test(tests);
  }
  if (fs.existsSync(path.join(workDir, "src", "checkout.js")) && fs.existsSync(path.join(workDir, "src", "services.js"))) {
    const tests = readIfExists(path.join(workDir, "test", "checkout.test.js"));
    return Array.from(tests.matchAll(/(?:^|\n)\s*test\s*\(/g)).length >= 4;
  }
  if (fs.existsSync(path.join(workDir, "docs", "checkout-notes.md"))) {
    const content = readIfExists(path.join(workDir, "docs", "checkout-validation.md"));
    return /\bcontext\b/i.test(content) && /\bdecision\b/i.test(content) && /\balternatives?\b/i.test(content);
  }
  if (
    fs.existsSync(path.join(workDir, "migrations", "001_customer_email.sql")) ||
    fs.existsSync(path.join(workDir, "migrations", "001_customer_email_add_column.sql"))
  ) {
    const check = validateCustomerEmailSql(workDir);
    return check.passed;
  }
  if (fs.existsSync(path.join(workDir, "public", "index.html"))) {
    const check = validateSubscriptionForm(workDir);
    return check.passed;
  }
  if (fs.existsSync(path.join(workDir, "src", "index.js")) && fs.existsSync(path.join(workDir, "test", "index.test.js"))) {
    const packageJson = JSON.parse(readIfExists(path.join(workDir, "package.json")) || "{}") as {
      scripts?: Record<string, string>;
    };
    return Boolean(packageJson.scripts?.["test"] && packageJson.scripts?.["typecheck"] && packageJson.scripts?.["lint"]);
  }
  return false;
}

function validateSubscriptionForm(workDir: string): VerifyResult {
  const html = readIfExists(path.join(workDir, "public", "index.html"));
  const emailInput = html.match(/<input\b[^>]*\bid=["']email["'][^>]*>/i)?.[0] ?? "";
  const submitButton = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/i)?.[0] ?? "";
  const statusElement = html.match(/<(?:p|div|span)\b[^>]*\bid=["']status["'][^>]*>/i)?.[0] ?? "";
  const labelText = html.match(/<label[^>]+for=["']email["'][^>]*>([\s\S]*?)<\/label>/i)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";

  return runTextCheck("subscription form", [
    ["email input has an explicit text label", labelText.length > 0],
    ["email input is not placeholder-only", /\bplaceholder=/i.test(emailInput) ? labelText.length > 0 : true],
    ["submit control is a native submit button", /<button\b/i.test(submitButton) && !/\btype=["']button["']/i.test(submitButton)],
    ["status region is announced politely", /\b(aria-live=["']polite["']|role=["']status["'])\b/i.test(statusElement)],
    ["does not use a clickable div submit", !/<div\b[^>]*(onclick|role=["']button["'])[^>]*>[\s\S]*subscribe/i.test(html)],
  ]);
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

  if (fs.existsSync(path.join(workDir, "src", "pipeline.js"))) {
    return runNodeCheck(
      workDir,
      `
        import assert from "node:assert/strict";
        import { processCustomers } from "./src/pipeline.js";

        const result = processCustomers([
          { name: "Ada", email: "Ada@Example.COM", phone: "5551234567" },
          { name: "Ada Dup", email: "ada@example.com", phone: "(555) 123-4567" },
          { name: "Bob", email: "bob@example.com", phone: "555-987-6543" },
          { name: "Bad", email: "bad@example.com", phone: "abc" },
        ]);

        assert.equal(result.valid.length, 2, "expected two unique valid records");
        assert.equal(result.errors.length, 1, "expected one record in errors");

        const ada = result.valid.find((r) => r.email === "ada@example.com");
        assert.ok(ada, "expected first Ada record to survive dedupe");
        assert.equal(ada.email, "ada@example.com");
        assert.equal(ada.phone, "+15551234567");

        const bob = result.valid.find((r) => r.email === "bob@example.com");
        assert.ok(bob, "expected Bob record");
        assert.equal(bob.phone, "+15559876543");

        const bad = result.errors[0];
        assert.equal(typeof bad.reason, "string");
        assert.ok(bad.reason.length > 0, "error reason must describe the failure");

        const empty = processCustomers([]);
        assert.deepEqual(empty, { valid: [], errors: [] });
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
        assert.equal(missing.body.error, "missing_id");
        assert.equal(typeof missing.body.message, "string");
        assert.ok(missing.body.message.length > 0);

        const absent = handleUserLookup({ query: { id: "missing" } });
        assert.equal(absent.status, 404);
        assert.equal(typeof absent.body.error, "string");
        assert.equal(absent.body.error, "not_found");
        assert.equal(typeof absent.body.message, "string");
        assert.ok(absent.body.message.length > 0);

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
    return combineChecks("customer email migration", [
      validateCustomerEmailSql(workDir),
      runOptionalPostgresMigrationCheck(workDir),
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

  if (fs.existsSync(path.join(workDir, "src", "checkout.js")) && fs.existsSync(path.join(workDir, "src", "services.js"))) {
    return runNodeCheck(
      workDir,
      `
          import assert from "node:assert/strict";
          import { submitCheckout } from "./src/checkout.js";

          const request = {
            customerId: "cus_123",
            idempotencyKey: "idem_123",
            paymentSource: "tok_visa",
            items: [{ sku: "sku_book", quantity: 1, priceCents: 1000 }],
          };

          function makeServices(options = {}) {
            const events = [];
            const existing = options.existing;
            return {
              events,
              orders: {
                async findByIdempotencyKey(key) {
                  events.push(["find-order", key]);
                  return existing;
                },
                async create(order) {
                  events.push(["create-order", order]);
                  return { ...order, id: "ord_new" };
                },
              },
              inventory: {
                async reserve(items) {
                  events.push(["reserve", items]);
                  if (options.reserveFails) throw new Error("out of stock");
                  return { reservationId: "res_1" };
                },
                async release(reservationId) {
                  events.push(["release", reservationId]);
                },
              },
              payments: {
                async charge(payment) {
                  events.push(["charge", payment]);
                  if (options.chargeFails) throw new Error("card declined");
                  return { id: "pay_1" };
                },
                async refund(paymentId) {
                  events.push(["refund", paymentId]);
                },
              },
              email: {
                async sendReceipt(orderId, customerId) {
                  events.push(["email", { orderId, customerId }]);
                },
              },
              logger: {
                info(event, data) { events.push(["info", event, data]); },
                warn(event, data) { events.push(["warn", event, data]); },
                error(event, data) { events.push(["error", event, data]); },
              },
            };
          }

          const existingOrder = {
            id: "ord_existing",
            customerId: request.customerId,
            totalCents: 1083,
            status: "paid",
          };
          const duplicateServices = makeServices({ existing: existingOrder });
          const duplicate = await submitCheckout(request, duplicateServices);
          assert.equal(duplicate.status, "confirmed");
          assert.equal(duplicate.orderId, "ord_existing");
          assert.equal(duplicate.totalCents, 1083);
          assert.equal(duplicateServices.events.some(([event]) => event === "charge"), false);
          assert.equal(duplicateServices.events.some(([event]) => event === "reserve"), false);
          assert.equal(duplicateServices.events.some(([event]) => event === "create-order"), false);

          const stockServices = makeServices({ reserveFails: true });
          await assert.rejects(() => submitCheckout(request, stockServices), /stock|inventory|reserve|unavailable|failed|checkout/i);
          assert.equal(stockServices.events.some(([event]) => event === "charge"), false);
          assert.equal(stockServices.events.some(([event]) => event === "create-order"), false);

          const paymentServices = makeServices({ chargeFails: true });
          await assert.rejects(() => submitCheckout(request, paymentServices), /payment|charge|declined|failed|checkout/i);
          const paymentEvents = paymentServices.events.map(([event]) => event);
          assert.ok(paymentEvents.indexOf("reserve") >= 0);
          assert.ok(paymentEvents.indexOf("charge") > paymentEvents.indexOf("reserve"));
          assert.ok(paymentEvents.indexOf("release") > paymentEvents.indexOf("charge"));
          assert.equal(paymentServices.events.some(([event]) => event === "create-order"), false);
        `,
    );
  }

  if (fs.existsSync(path.join(workDir, "public", "index.html"))) {
    return validateSubscriptionForm(workDir);
  }

  if (fs.existsSync(path.join(workDir, "src", "index.js")) && fs.existsSync(path.join(workDir, "test", "index.test.js"))) {
    const packageJson = JSON.parse(readIfExists(path.join(workDir, "package.json")) || "{}") as {
      scripts?: Record<string, string>;
    };
    const readme = readIfExists(path.join(workDir, "README.md"));
    const commitPlan = readIfExists(path.join(workDir, "COMMIT_PLAN.md"));
    const typecheckScript = packageJson.scripts?.["typecheck"] ?? "";
    return runTextCheck("package baseline", [
      ["defines npm test", typeof packageJson.scripts?.["test"] === "string"],
      ["defines npm run typecheck", typeof packageJson.scripts?.["typecheck"] === "string"],
      ["defines npm run lint", typeof packageJson.scripts?.["lint"] === "string"],
      ["adds tsconfig typecheck config", fs.existsSync(path.join(workDir, "tsconfig.json"))],
      ["typecheck uses tsconfig", /\btsc\b/.test(typecheckScript) && /\btsconfig\.json\b/.test(typecheckScript)],
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
    const submittedProofPassed = hasSubmittedProofForTrial(workDir);
    return {
      passed: visible.passed && hidden.passed,
      output: [`# npm test\n${visible.output}`, `# hidden checks\n${hidden.output}`].join("\n\n"),
      metrics: {
        visiblePassed: visible.passed ? 1 : 0,
        hiddenPassed: hidden.passed ? 1 : 0,
        submittedProofPassed: submittedProofPassed ? 1 : 0,
        ...hidden.metrics,
      },
    };
  },

  scoreSession(session: EvalSession, verify: VerifyResult) {
    if (verify.metrics["routingTrial"] === 1) {
      return scoreRoutingSession(session, verify);
    }

    const wroteTests = session.fileWrites.some((file) => file.labels.includes("test"));
    const wroteSource = session.fileWrites.some((file) => file.labels.includes("source"));
    const submittedProofPassed = verify.metrics["submittedProofPassed"] === 1;
    const skillReads = readAbpSkillNames(session);
    const baselineSkillReads = isBaselineSession(session) ? skillReads : [];
    const abpSkillReads = isAbpSession(session) ? skillReads : [];
    const postWriteProof = hasPostWriteCommand(
      session,
      /\b(npm\s+test|npm\s+run\s+(test|typecheck|lint|check)|vitest|pytest|go\s+test|cargo\s+test|mvn\s+test|uv\s+run\s+(pytest|ruff|pyright|python)|refcheck|validate_skill_anatomy)\b/i,
    );

    const scores = {
      verification: verify.passed ? 100 : 0,
      proof: submittedProofPassed && postWriteProof ? 100 : submittedProofPassed ? 85 : postWriteProof ? 60 : verify.passed ? 35 : 15,
      change_quality: wroteSource && wroteTests ? 100 : wroteSource ? 70 : 25,
      baseline_isolation: baselineSkillReads.length > 0 ? 0 : 100,
      abp_activation: isAbpSession(session) && abpSkillReads.length === 0 ? 0 : 100,
    };
    const weights = {
      verification: 0.45,
      proof: 0.30,
      change_quality: 0.14,
      baseline_isolation: 0.05,
      abp_activation: 0.06,
    };
    const findings: string[] = [];
    if (!submittedProofPassed) findings.push("No behavior-relevant submitted proof was detected.");
    else if (!wroteTests) findings.push("No test file writes were detected; proof came from the submitted artifact.");
    if (wroteSource && !postWriteProof) findings.push("No post-change proof command was detected.");
    if (!verify.passed) findings.push("Visible tests or hidden checks failed.");
    if (baselineSkillReads.length > 0) {
      findings.push(`Baseline session read ABP skill files: ${baselineSkillReads.join(", ")}.`);
    }
    if (isAbpSession(session) && abpSkillReads.length === 0) {
      findings.push("ABP profile did not read any ABP skill files; plugin activation is not proven.");
    }

    return {
      scores,
      weights,
      findings,
      judge: {
        includeInOverall: true,
        defaultWeight: 0.45,
        weights: {
          engineering_maturity: 0.35,
          proof_quality: 0.25,
          simplicity: 0.2,
          risk_handling: 0.2,
        },
      },
    };
  },

  buildPrompt({ taskDescription }) {
    return [
      taskDescription.trim(),
      "",
      "Work in the provided repository. Do not add external dependencies.",
    ].join("\n");
  },

  afterRun({ workDir, session }) {
    const finalText = extractFinalAssistantText(session.rawLines);
    if (!finalText) return;
    const artifactDir = path.join(workDir, ".abp-eval");
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.writeFileSync(path.join(artifactDir, "assistant-final.md"), finalText);
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
      "- Prefer evidence-backed, maintainable changes that match the problem's scope.",
      "- Penalize superficial test edits, missing edge cases, and changes that only satisfy the visible tests.",
      "- Penalize sophisticated-looking constructs that fail to deliver the invariant they imply (e.g. partial unique indexes that cannot enforce uniqueness, prototype-pollution guards that still permit `__proto__` writes, custom scripts that introduce undeclared dependencies).",
      "- Do not penalize a solution merely for adding tests, ADRs, migrations, or documentation when those artifacts are warranted by the task; reward thoroughness when it serves correctness, safety, or maintainability.",
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

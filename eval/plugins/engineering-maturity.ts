import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import type { EvalPlugin, EvalSession, VerifyResult } from "pi-do-eval";

const TEXT_FILE_EXTENSIONS = new Set([".html", ".js", ".json", ".md", ".sql", ".txt"]);

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

  if (fs.existsSync(path.join(workDir, "migrations", "001_customer_email.sql"))) {
    const migration = readIfExists(path.join(workDir, "migrations", "001_customer_email.sql"));
    const rollback = readIfExists(path.join(workDir, "migrations", "001_customer_email.rollback.sql"));
    const operations = [
      readIfExists(path.join(workDir, "OPERATIONS.md")),
      readIfExists(path.join(workDir, "operations.md")),
      readIfExists(path.join(workDir, "ROLLBACK.md")),
      readIfExists(path.join(workDir, "README.md")),
    ].join("\n");
    return runTextCheck("customer email migration", [
      ["uses a concurrent index build", /create\s+(unique\s+)?index\s+concurrently\b/i.test(migration)],
      ["separates uniqueness validation", /\b(not\s+valid|validate\s+constraint)\b/i.test(migration)],
      ["adds a rollback file", rollback.length > 0],
      ["documents rollout", /\b(rollout|deploy|apply)\b/i.test(operations)],
      ["documents rollback", /\brollback\b/i.test(operations)],
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
    const wroteTests = session.fileWrites.some((file) => file.labels.includes("test"));
    const wroteSource = session.fileWrites.some((file) => file.labels.includes("source"));
    const touchedManyFiles = session.fileWrites.length > 8;

    const scores = {
      verification: verify.passed ? 100 : 0,
      proof: wroteTests ? 100 : verify.passed ? 45 : 15,
      change_quality: wroteSource && !touchedManyFiles ? 85 : wroteSource ? 65 : 25,
    };
    const weights = {
      verification: 0.55,
      proof: 0.3,
      change_quality: 0.15,
    };
    const findings: string[] = [];
    if (!wroteTests) findings.push("No test file writes were detected.");
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
      "Respond with ONLY a JSON object. Scores must be numbers from 0 to 100.",
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
      '- "findings"',
      "",
      "Prefer evidence-backed, low-complexity, maintainable changes. Penalize superficial test edits, broad rewrites, missing edge cases, and changes that only satisfy the visible tests.",
      "",
      "## Task",
      taskDescription,
      "",
      "## Final Workdir Snapshot",
      readProjectSnapshot(workDir),
    ].join("\n");
  },
};

export default plugin;

#!/usr/bin/env node
// Validate Agent Booster Pack skill files and plugin mirror drift.

import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const REQUIRED_SECTIONS = ["When to Use", "When NOT to Use", "Verification"];
const MAX_DESCRIPTION_LENGTH = 120;
const MAX_TOTAL_DESCRIPTION_LENGTH = 2000;

const NAME_RE = /^name:\s+[a-z][a-z0-9-]*\s*$/m;
const ATTRIBUTION_RE = /\b[Pp]er\s+(?:[A-Z][a-z]+\s+)?[A-Z][a-z]+\b/;
function scriptDir() {
  return dirname(fileURLToPath(import.meta.url));
}

function defaultSkillsDir() {
  return resolve(scriptDir(), "../agents/.agents/skills");
}

function sectionRe(name) {
  return new RegExp(`^##+\\s+${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m");
}

function skillSections(body) {
  const lines = body.split(/\r?\n/);
  const headings = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^##\s+/.test(line));

  return headings.map(({ line, index }, headingIndex) => {
    const next = headings[headingIndex + 1]?.index ?? lines.length;
    return { name: line.replace(/^##\s+/, "").trim(), lineCount: next - index - 1 };
  });
}

function tripwiresTooLong(body) {
  const sections = skillSections(body);
  const tripwires = sections.find((section) => section.name === "Tripwires");
  if (!tripwires) return false;

  const otherMax = Math.max(...sections.filter((section) => section.name !== "Tripwires").map((section) => section.lineCount));
  return tripwires.lineCount >= otherMax;
}

function bodyWithoutReferenceSections(body) {
  const kept = [];
  let inReferenceSection = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^##+ (References|Canon)\s*$/.test(line)) {
      inReferenceSection = true;
      continue;
    }
    if (!inReferenceSection) kept.push(line);
  }
  return kept.join("\n");
}

export function frontmatterDescription(head) {
  const lines = head.split(/\r?\n/);
  const description = [];
  let inDescription = false;

  for (const line of lines) {
    if (line.startsWith("description:")) {
      inDescription = true;
      const value = line.split(":", 2)[1].trim();
      if (value && !new Set([">", ">-", "|", "|-"]).has(value)) {
        description.push(value);
      }
      continue;
    }

    if (inDescription) {
      if (line.startsWith("  ")) {
        description.push(line.trim());
        continue;
      }
      break;
    }
  }

  return inDescription ? description.join(" ") : null;
}

export function validateSkillFile(path) {
  const body = readFileSync(path, "utf8");
  const head = body.split(/\r?\n/).slice(0, 30).join("\n");
  const problems = [];

  if (!NAME_RE.test(head)) problems.push("frontmatter missing name or not kebab-case");
  const description = frontmatterDescription(head);
  if (description == null) {
    problems.push("frontmatter missing description");
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    problems.push(`frontmatter description too long (${description.length} > ${MAX_DESCRIPTION_LENGTH} characters)`);
  }

  for (const heading of REQUIRED_SECTIONS) {
    if (!sectionRe(heading).test(body)) problems.push(`missing section: ## ${heading}`);
  }

  if (sectionRe("Common Rationalizations").test(body)) {
    problems.push("obsolete section: ## Common Rationalizations -- use ## Tripwires");
  }
  if (sectionRe("Red Flags").test(body)) {
    problems.push("obsolete section: ## Red Flags -- fold into ## Tripwires");
  }
  if (/^\|\s*Excuse\s*\|\s*Reality\s*\|/m.test(body)) {
    problems.push("obsolete table header: use positive Tripwires bullets");
  }
  if (tripwiresTooLong(body)) {
    problems.push("Tripwires must not be the longest section -- keep only high-probability skip/avoidance failures");
  }

  const attributionLines = bodyWithoutReferenceSections(body)
    .split(/\r?\n/)
    .filter((line) => !line.startsWith(">") && ATTRIBUTION_RE.test(line));
  if (attributionLines.length > 0) {
    problems.push("inline 'per <expert>' attribution found -- move to References");
  }

  return problems.length > 0 ? { path, problems } : null;
}

export function validateSkills(skillsDir) {
  const findings = [];
  let totalDescriptionLength = 0;

  for (const name of readdirSync(skillsDir).sort()) {
    const skillFile = join(skillsDir, name, "SKILL.md");
    if (!existsSync(skillFile)) continue;
    const body = readFileSync(skillFile, "utf8");
    const head = body.split(/\r?\n/).slice(0, 30).join("\n");
    const description = frontmatterDescription(head);
    if (description != null) totalDescriptionLength += description.length;

    const finding = validateSkillFile(skillFile);
    if (finding) findings.push(finding);
  }

  if (totalDescriptionLength > MAX_TOTAL_DESCRIPTION_LENGTH) {
    findings.push({
      path: join(skillsDir, "SKILL_DESCRIPTIONS"),
      problems: [
        `frontmatter description total too long (${totalDescriptionLength} > ${MAX_TOTAL_DESCRIPTION_LENGTH} characters)`,
      ],
    });
  }

  return findings;
}

export function printSkillFindings(skillsDir, findings) {
  for (const finding of findings) {
    console.log(relative(skillsDir, finding.path));
    for (const problem of finding.problems) console.log(`  - ${problem}`);
  }

  if (findings.length > 0) {
    console.log("");
    console.log(`${findings.length} skill(s) failed anatomy validation`);
  } else {
    console.log("all skills conform to the anatomy");
  }
}

function pluginSkillsDir(skillsDir) {
  return resolve(skillsDir, "../../..", "plugin/skills");
}

function repoRootForSkillsDir(skillsDir) {
  return resolve(skillsDir, "../../..");
}

function walkFiles(root) {
  const files = [];
  if (!existsSync(root)) return files;
  for (const name of readdirSync(root).sort()) {
    const path = join(root, name);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...walkFiles(path));
    else if (stat.isFile()) files.push(path);
  }
  return files;
}

function sameBytes(left, right) {
  return readFileSync(left).equals(readFileSync(right));
}

export function validatePluginDrift(skillsDir) {
  const pluginDir = pluginSkillsDir(skillsDir);
  if (!existsSync(pluginDir) || !statSync(pluginDir).isDirectory()) return 0;

  let drift = 0;
  const skillDirs = readdirSync(skillsDir)
    .sort()
    .map((name) => join(skillsDir, name))
    .filter((path) => statSync(path).isDirectory());

  for (const skillDir of skillDirs) {
    const mirror = join(pluginDir, skillDir.split(/[\\/]/).at(-1));
    if (!existsSync(mirror) || !statSync(mirror).isDirectory()) {
      console.log(`plugin drift: ${mirror} missing -- run scripts/generate-plugin-symlinks.mjs`);
      drift += 1;
      continue;
    }

    for (const sourceFile of walkFiles(skillDir)) {
      const rel = relative(skillDir, sourceFile);
      const mirrorFile = join(mirror, rel);
      if (!existsSync(mirrorFile) || !statSync(mirrorFile).isFile()) {
        console.log(`plugin drift: ${mirrorFile} missing`);
        drift += 1;
        continue;
      }
      if (!sameBytes(sourceFile, mirrorFile)) {
        console.log(`plugin drift: ${mirrorFile} differs from ${sourceFile}`);
        drift += 1;
      }
    }

    for (const mirrorFile of walkFiles(mirror)) {
      const rel = relative(mirror, mirrorFile);
      const sourceFile = join(skillDir, rel);
      if (!existsSync(sourceFile) || !statSync(sourceFile).isFile()) {
        console.log(`plugin drift: ${mirrorFile} has no canonical source`);
        drift += 1;
      }
    }
  }

  for (const name of readdirSync(pluginDir).sort()) {
    const mirror = join(pluginDir, name);
    if (statSync(mirror).isDirectory() && !existsSync(join(skillsDir, name))) {
      console.log(`plugin drift: ${mirror} has no canonical skill`);
      drift += 1;
    }
  }

  if (drift === 0) console.log("plugin/ skill mirror in sync with source");
  else {
    console.log("");
    console.log(`${drift} plugin mirror difference(s) found`);
  }
  return drift;
}

function readJsonObject(path) {
  if (!existsSync(path) || !statSync(path).isFile()) return [null, `missing ${path}`];
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    if (data == null || Array.isArray(data) || typeof data !== "object") {
      return [null, `${path} must contain a JSON object`];
    }
    return [data, null];
  } catch (error) {
    return [null, `${path} is not valid JSON: ${error.message.split("\n")[0]}`];
  }
}

function firstPluginEntry(marketplace) {
  if (!Array.isArray(marketplace.plugins)) return null;
  return marketplace.plugins.find((entry) => entry && typeof entry === "object" && entry.name === "abp") ?? null;
}

export function validateCodexPluginPackage(skillsDir) {
  const root = repoRootForSkillsDir(skillsDir);
  const problems = [];
  const marketplacePath = join(root, ".agents/plugins/marketplace.json");
  const manifestPath = join(root, "plugin/.codex-plugin/plugin.json");
  const hooksPath = join(root, "plugin/.codex-plugin/hooks.json");
  const claudeMarketplacePath = join(root, ".claude-plugin/marketplace.json");
  const claudeManifestPath = join(root, "plugin/.claude-plugin/plugin.json");

  const [marketplace, marketplaceProblem] = readJsonObject(marketplacePath);
  if (marketplaceProblem) problems.push(marketplaceProblem);
  else if (marketplace) {
    if (marketplace.name !== "abp") problems.push(`${marketplacePath} name must be 'abp'`);
    if (!marketplace.interface || typeof marketplace.interface !== "object") {
      problems.push(`${marketplacePath} interface must be an object`);
    } else if (marketplace.interface.displayName !== "Agent Booster Pack") {
      problems.push(`${marketplacePath} interface.displayName must be 'Agent Booster Pack'`);
    }

    const entry = firstPluginEntry(marketplace);
    if (!entry) problems.push(`${marketplacePath} must include an 'abp' plugin entry`);
    else {
      if (!entry.source || typeof entry.source !== "object") {
        problems.push(`${marketplacePath} abp.source must be an object`);
      } else {
        if (entry.source.source !== "local") problems.push(`${marketplacePath} abp.source.source must be 'local'`);
        if (entry.source.path !== "./plugin") problems.push(`${marketplacePath} abp.source.path must be './plugin'`);
      }

      if (!entry.policy || typeof entry.policy !== "object") {
        problems.push(`${marketplacePath} abp.policy must be an object`);
      } else {
        if (entry.policy.installation !== "AVAILABLE") {
          problems.push(`${marketplacePath} abp.policy.installation must be 'AVAILABLE'`);
        }
        if (entry.policy.authentication !== "ON_INSTALL") {
          problems.push(`${marketplacePath} abp.policy.authentication must be 'ON_INSTALL'`);
        }
      }

      if (entry.category !== "Coding") problems.push(`${marketplacePath} abp.category must be 'Coding'`);
    }
  }

  const [manifest, manifestProblem] = readJsonObject(manifestPath);
  if (manifestProblem) problems.push(manifestProblem);
  else if (manifest) {
    if (manifest.name !== "abp") problems.push(`${manifestPath} name must be 'abp'`);
    if (manifest.skills !== "./skills/") problems.push(`${manifestPath} skills must be './skills/'`);
    if (manifest.hooks !== "./hooks.json") problems.push(`${manifestPath} hooks must be './hooks.json'`);

    const iface = manifest.interface;
    if (!iface || typeof iface !== "object") {
      problems.push(`${manifestPath} interface must be an object`);
    } else {
      if (iface.displayName !== "Agent Booster Pack") {
        problems.push(`${manifestPath} interface.displayName must be 'Agent Booster Pack'`);
      }
      if (iface.category !== "Coding") problems.push(`${manifestPath} interface.category must be 'Coding'`);
      if (!Array.isArray(iface.capabilities) || !["Read", "Write"].every((cap) => iface.capabilities.includes(cap))) {
        problems.push(`${manifestPath} interface.capabilities must include 'Read' and 'Write'`);
      }
      if (!Array.isArray(iface.defaultPrompt) || iface.defaultPrompt.length > 3) {
        problems.push(`${manifestPath} interface.defaultPrompt must contain at most 3 prompts`);
      }
    }

    const [hooks, hooksProblem] = readJsonObject(hooksPath);
    if (hooksProblem) {
      problems.push(hooksProblem);
    } else {
      const stopGroups = hooks.hooks?.Stop;
      const stopCommands = Array.isArray(stopGroups)
        ? stopGroups.flatMap((group) => (Array.isArray(group?.hooks) ? group.hooks : []))
        : [];
      const hasSelfReviewStopHook = stopCommands.some(
        (hook) =>
          hook?.type === "command" &&
          hook.command === "node ${PLUGIN_ROOT}/scripts/self-review.mjs" &&
          hook.timeout === 5,
      );
      if (!hasSelfReviewStopHook) {
        problems.push(`${hooksPath} must register the ABP self-review Stop hook`);
      }
    }

    const [claudeMarketplace, claudeProblem] = readJsonObject(claudeMarketplacePath);
    if (!claudeProblem && claudeMarketplace) {
      const claudeVersion = claudeMarketplace.metadata?.version;
      if (manifest.version !== claudeVersion) {
        problems.push(`${manifestPath} version must match ${claudeMarketplacePath} metadata.version`);
      }
      const claudeEntry = firstPluginEntry(claudeMarketplace);
      if (!claudeEntry) {
        problems.push(`${claudeMarketplacePath} must include an 'abp' plugin entry`);
      } else {
        if (claudeEntry.source !== "./plugin") {
          problems.push(`${claudeMarketplacePath} abp.source must be './plugin'`);
        }
        if (claudeEntry.version !== claudeVersion) {
          problems.push(`${claudeMarketplacePath} abp.version must match metadata.version`);
        }
      }
    }

    const [claudeManifest, claudeManifestProblem] = readJsonObject(claudeManifestPath);
    if (!claudeManifestProblem && claudeManifest && claudeMarketplace) {
      const claudeVersion = claudeMarketplace.metadata?.version;
      if (claudeManifest.version !== claudeVersion) {
        problems.push(`${claudeManifestPath} version must match ${claudeMarketplacePath} metadata.version`);
      }
      if (manifest.version !== claudeManifest.version) {
        problems.push(`${manifestPath} version must match ${claudeManifestPath} version`);
      }
    }
  }

  if (problems.length > 0) {
    for (const problem of problems) console.log(`codex plugin: ${problem}`);
    console.log("");
    console.log(`${problems.length} codex plugin package problem(s)`);
  } else {
    console.log("codex plugin package valid");
  }
  return problems.length;
}

function writeFixture(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, { encoding: "utf8", flag: "w" });
}

export function runSelfTest() {
  const tmp = mkdtempSync(join(tmpdir(), "abp-skill-validator-"));
  try {
    cpSync(resolve(scriptDir(), "../agents/.agents/skills/workflow"), join(tmp, "good"), { recursive: true });
    writeFixture(
      join(tmp, "bad/SKILL.md"),
      `---
name: bad
description: >-
  This description is intentionally much too long for the skill routing surface
  because Codex and other agents load all skill descriptions before deciding
  which full skill body to request, so verbose trigger prose creates avoidable
  context pressure.
---

# Bad

Per Rich Hickey, prefer values over places.

## Overview

Stuff.

## Common Rationalizations
| Excuse | Reality |
|---|---|
| "Should work" | It might not. |

## Red Flags
- "Probably fine"
`,
    );

    const longDescription = "x".repeat(100);
    for (let index = 0; index < 21; index += 1) {
      writeFixture(
        join(tmp, `budget-${index}/SKILL.md`),
        `---
name: budget-${index}
description: ${longDescription}
---

# Budget ${index}

## When to Use
- trigger

## When NOT to Use
- other

## Verification
- [ ] check
`,
      );
    }

    const findings = validateSkills(tmp);
    const rendered = [
      ...findings.map((finding) => relative(tmp, finding.path)),
      ...findings.flatMap((finding) => finding.problems),
    ].join("\n");
    for (const expected of [
      "bad/SKILL.md",
      "When to Use",
      "Verification",
      "description too long",
      "per <expert>",
      "Common Rationalizations",
      "Red Flags",
      "positive Tripwires bullets",
      "description total too long",
    ]) {
      if (!rendered.includes(expected)) {
        console.error(`self-test failed: missing ${JSON.stringify(expected)} in output`);
        console.error(rendered);
        return 1;
      }
    }

    if (findings.some((finding) => relative(tmp, finding.path) === "good/SKILL.md")) {
      console.error("self-test failed: good skill flagged");
      console.error(rendered);
      return 1;
    }

    console.log("self-test ok");
    return 0;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export function main(argv = process.argv.slice(2)) {
  if (argv.includes("-h") || argv.includes("--help")) {
    console.log(`Usage: node scripts/validate-skill-anatomy.mjs [skills_dir] [--self-test]

Validate SKILL.md frontmatter, required sections, and plugin drift.`);
    return 0;
  }
  if (argv.includes("--self-test")) return runSelfTest();

  const skillsDir = resolve(argv.find((arg) => !arg.startsWith("-")) ?? defaultSkillsDir());
  if (!existsSync(skillsDir) || !statSync(skillsDir).isDirectory()) {
    console.error(`not a directory: ${skillsDir}`);
    return 2;
  }

  const findings = validateSkills(skillsDir);
  printSkillFindings(skillsDir, findings);
  const drift = validatePluginDrift(skillsDir);
  const codexPluginProblems = validateCodexPluginPackage(skillsDir);
  return findings.length || drift || codexPluginProblems ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main();
}

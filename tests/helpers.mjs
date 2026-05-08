import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));

export function makeTempDir(prefix = "abp-test-") {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function cleanupTempDir(path) {
  rmSync(path, { recursive: true, force: true });
}

export function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd ?? ROOT,
    env: options.env ?? process.env,
    encoding: "utf8",
    input: options.input,
    shell: false,
  });
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function writeExecutable(path, text) {
  writeFileSync(path, text, "utf8");
  chmodSync(path, 0o755);
}

export function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

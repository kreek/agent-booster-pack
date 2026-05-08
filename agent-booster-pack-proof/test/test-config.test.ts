import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { inferTestCommand } from "../src/test-config.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "proof-test-config-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function writeFile(relativePath: string, contents: string) {
  const filePath = path.join(tmpDir, relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents, "utf-8");
}

describe("inferTestCommand", () => {
  it("prefers a root Makefile test target over language-specific test commands", async () => {
    await writeFile("Makefile", "test:\n\tuv run pytest\n");
    await writeFile("pyproject.toml", "[project]\nname = \"example\"\n");
    await writeFile(
      "package.json",
      JSON.stringify({ scripts: { test: "vitest run" } }),
    );

    await expect(inferTestCommand(tmpDir)).resolves.toBe("make test");
  });

  it("ignores Makefiles without a test target", async () => {
    await writeFile("Makefile", "build:\n\techo build\n");
    await writeFile("pyproject.toml", "[project]\nname = \"example\"\n");

    await expect(inferTestCommand(tmpDir)).resolves.toBe("pytest");
  });
});

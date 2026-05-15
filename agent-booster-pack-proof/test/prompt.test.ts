import { describe, expect, it } from "vitest";

import { buildSystemPrompt } from "../src/prompt.js";

describe("buildSystemPrompt", () => {
  it("keeps active proof-only sections out of the off prompt", () => {
    const prompt = buildSystemPrompt("BASE", "off");

    expect(prompt).toContain("[PROOF MODE — OFF]");
    expect(prompt).not.toContain("WHAT NOT TO TEST:");
    expect(prompt).not.toContain("TEST DOUBLES:");
    expect(prompt).not.toContain("TEST ORGANIZATION:");
  });

  it("includes test scope and organization only during specifying", () => {
    const prompt = buildSystemPrompt("BASE", "specifying", "npm test", "/repo/app");

    expect(prompt).toContain("[PROOF MODE — SPECIFYING PHASE]");
    expect(prompt).toContain("Test command: npm test");
    expect(prompt).toContain("Test directory: /repo/app");
    expect(prompt).toContain("WHAT NOT TO TEST:");
    expect(prompt).toContain("TEST DOUBLES:");
    expect(prompt).toContain("TEST ORGANIZATION:");
    expect(prompt.match(/WHAT NOT TO TEST:/g)).toHaveLength(1);
    expect(prompt.match(/TEST DOUBLES:/g)).toHaveLength(1);
    expect(prompt.match(/TEST ORGANIZATION:/g)).toHaveLength(1);

    const testCommandIndex = prompt.indexOf("Test command: npm test");
    const testScopeIndex = prompt.indexOf("WHAT NOT TO TEST:");
    const testDoublesIndex = prompt.indexOf("TEST DOUBLES:");
    const testOrgIndex = prompt.indexOf("TEST ORGANIZATION:");
    expect(testCommandIndex).toBeGreaterThan(-1);
    expect(testScopeIndex).toBeGreaterThan(testCommandIndex);
    expect(testDoublesIndex).toBeGreaterThan(testScopeIndex);
    expect(testOrgIndex).toBeGreaterThan(testDoublesIndex);
  });

  it("keeps specifying-only test guidance out of later proof phases", () => {
    for (const phase of ["implementing", "refactoring"] as const) {
      const prompt = buildSystemPrompt("BASE", phase, "npm test");

      expect(prompt).toContain(`PROOF MODE — ${phase.toUpperCase()} PHASE`);
      expect(prompt).toContain("Test command: npm test");
      expect(prompt).not.toContain("WHAT NOT TO TEST:");
      expect(prompt).not.toContain("TEST DOUBLES:");
      expect(prompt).not.toContain("TEST ORGANIZATION:");
    }
  });
});

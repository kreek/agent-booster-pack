import { describe, expect, it } from "vitest";

import { formatCommand } from "../scripts/pre-commit-acceptance.mjs";
import { selectChecks } from "../scripts/pre-push-acceptance.mjs";

function commandStrings() {
  return selectChecks().map((check) => formatCommand(check.command));
}

describe("pre-push acceptance command selection", () => {
  it("runs the repo acceptance suite before sharing work", () => {
    expect(commandStrings()).toEqual(["make test"]);
  });
});

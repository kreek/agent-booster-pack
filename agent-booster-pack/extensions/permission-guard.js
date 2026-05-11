const GH_PERMISSION_BLOCK_REASON = "ABP Permission Guard: `gh` commands require explicit user permission before execution.";
const GH_DENIED_REASON = "ABP Permission Guard: user denied `gh` command.";
const GH_TOKEN_PATTERN = /(^|[^A-Za-z0-9_-])gh([^A-Za-z0-9_-]|$)/;

function shellCommand(input) {
  return typeof input?.command === "string" ? input.command.trim() : "";
}

export function invokesGh(command) {
  const text = String(command ?? "").trim();
  if (text.length === 0) return false;
  return GH_TOKEN_PATTERN.test(text);
}

export function ghPermissionVerdict(toolName, input) {
  if (toolName !== "bash") return null;

  const command = shellCommand(input);
  if (!invokesGh(command)) return null;

  return { command };
}

function permissionMessage(command) {
  return [
    "Allow this GitHub CLI command to run?",
    "",
    command,
    "",
    "`gh` may make network calls and use your authenticated GitHub account, including for read-only operations.",
  ].join("\n");
}

export default function permissionGuard(pi) {
  pi.on("tool_call", async (event, ctx) => {
    const verdict = ghPermissionVerdict(event.toolName, event.input);
    if (!verdict) return;

    if (!ctx.hasUI) return { block: true, reason: GH_PERMISSION_BLOCK_REASON };

    const allowed = await ctx.ui.confirm("ABP Permission Guard", permissionMessage(verdict.command));
    if (!allowed) return { block: true, reason: GH_DENIED_REASON };
  });
}

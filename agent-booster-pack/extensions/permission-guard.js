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

export default function permissionGuard(pi) {
  void pi;
}

# Claude Code vs OpenAI Codex CLI: Harness Hooks and Policy Gates

## TL;DR

- **Claude Code exposes a deep, deterministic, event-driven hook system (25+ named lifecycle events, five handler types, JSON-over-stdin with structured decision control) plus a layered declarative permission system (`allow` / `ask` / `deny` rules with `Bash(git:*)`-style command patterns, `defaultMode` modes, `additionalDirectories`). OpenAI Codex CLI offers a much narrower, still-experimental hook surface (six events: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `Stop`, behind a `[features] hooks = true` flag, with `PreToolUse` currently Bash-only and `PostToolUse`/`PermissionRequest` covering Bash, `apply_patch`, and MCP tools) plus a single-event `notify` external program, paired with an OS-level sandbox (Seatbelt / bwrap+seccomp / Windows sandbox) and a Starlark-based execpolicy `.rules` allow/prompt/forbid system.**
- **The two harnesses sit on opposite design axes.** Claude Code's gating is software-defined inside the agent process (JSON decision objects returned by user hooks, layered `settings.json` rules) and is the primary security boundary. Codex CLI's gating is OS-enforced by default (sandbox modes `read-only` / `workspace-write` / `danger-full-access` + approval modes `untrusted` / `on-request` / `never`), with hooks as a thin, experimental observability/blocking layer on top.
- **For a Pi-style "read-only-by-capability" extension architecture, Codex's `sandbox_mode = "read-only"`, `[sandbox_workspace_write]` with `network_access = false`, named permission profiles (`default_permissions = "workspace"` with `[permissions.workspace.filesystem]` write/none globs), and protected-paths rules (`<root>/.git`, `<root>/.codex`, `<root>/.agents` are read-only inside `workspace-write`) are the closest existing primitives. Claude Code provides finer-grained per-tool capability gating but enforces it in-process, not via OS sandboxes.**

## Key Findings

1. **Event coverage**: Claude Code documents 25+ lifecycle events (`SessionStart`, `Setup`, `UserPromptSubmit`, `UserPromptExpansion`, `PreToolUse`, `PermissionRequest`, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `Notification`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `Stop`, `StopFailure`, `TeammateIdle`, `InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `FileChanged`, `WorktreeCreate`, `WorktreeRemove`, `PreCompact`, `PostCompact`, `Elicitation`, `ElicitationResult`, `SessionEnd`). Codex documents 6: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `Stop` (per `developers.openai.com/codex/hooks`: "Matcher groups for a hook event such as PreToolUse, PermissionRequest, PostToolUse, SessionStart, UserPromptSubmit, or Stop."), all marked Experimental with Windows support temporarily disabled.
2. **Tool-call interception**: Claude Code's `PreToolUse` intercepts every tool (Bash, Edit, Write, Read, Glob, Grep, Agent, WebFetch, WebSearch, AskUserQuestion, ExitPlanMode, and any MCP `mcp__server__tool`). Codex's `PreToolUse` currently emits only `Bash` (docs flag this as "Work in progress" and note "This doesn't intercept all shell calls yet, only the simple ones... Similarly, this doesn't intercept MCP, Write, WebSearch, or other non-shell tool calls"). However, Codex's `PostToolUse` now also fires after `apply_patch` and MCP tool calls (per `developers.openai.com/codex/hooks`: "PostToolUse runs after supported tools produce output, including Bash, apply_patch, and MCP tool calls."), and `PermissionRequest` covers Bash, `apply_patch`, and MCP tool names with allow/deny/defer decisions.
3. **Configuration format and language**: Claude Code uses JSON (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`, managed policy settings). Codex uses TOML for general config (`~/.codex/config.toml`, `<repo>/.codex/config.toml`, `requirements.toml` for admin-enforced policy) and JSON for hooks (`~/.codex/hooks.json`, `<repo>/.codex/hooks.json`) — a notable split.
4. **Permission gating models**: Claude Code uses declarative rule arrays with deny-first precedence and explicit `Bash(git:*)`, `Read(**/.env)`, `Edit(*.ts)`, `mcp__github__create-pull-request`-style patterns; an `auto` mode runs an LLM classifier; a `dontAsk` mode converts every prompt to a denial. Codex uses OS sandbox modes plus an `approval_policy` (`untrusted` / `on-request` / `never` / granular) plus Starlark `.rules` files evaluated by `codex execpolicy` (prefix rules with `allow` / `prompt` / `forbid` decisions, most-restrictive wins).
5. **Sandboxing primitives**: Codex has real OS sandboxes (macOS Seatbelt via `sandbox-exec`, Linux `bwrap` + `seccomp`, native Windows sandbox), protected paths (`.git`, `.codex`, `.agents` read-only inside writable roots), and named permission profiles with glob-based read/write/none filesystem maps. Claude Code documents an in-process sandbox with `autoAllowBashIfSandboxed: true` and `allowedDomains`/`deniedDomains` for WebFetch, but does not document OS-level isolation as a first-class primitive.
6. **Decision-control protocol**: Claude Code hooks have a rich JSON decision schema (`hookSpecificOutput.permissionDecision` of `allow`/`deny`/`ask`/`defer`, `updatedInput`, `updatedPermissions`, `updatedToolOutput`, `additionalContext`, `continue`, `stopReason`, `terminalSequence`). Codex hooks support a smaller schema (`hookSpecificOutput.permissionDecision: "deny"` for `PreToolUse`, `decision: "block"` with `reason` for `PostToolUse`/`Stop`/`UserPromptSubmit`, plus `systemMessage`, `continue: false`, `stopReason`); many fields like `updatedInput`, `additionalContext` on `PreToolUse`, `suppressOutput` are documented as "parsed but not supported yet, so they fail open".
7. **Two distinct notification mechanisms in Codex**: a top-level `notify = ["program", "args..."]` argv-vector hook that receives a single JSON argv argument when `agent-turn-complete` fires (kebab-case fields: `type`, `thread-id`, `turn-id`, `cwd`, `input-messages`, `last-assistant-message`), and a separate `[tui] notifications = true` filter (can additionally include `approval-requested`). Claude Code's equivalent is the `Notification` hook event (matchers: `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`, `elicitation_complete`, `elicitation_response`).
8. **Hook script languages**: Both platforms execute hooks as shell commands, so any language works. Claude Code's official examples use Bash with `jq`, plus Python; the docs explicitly mention reference implementations in Python (e.g., `bash_command_validator_example.py` in `anthropics/claude-code`). Codex's official examples use `python3 ~/.codex/hooks/session_start.py` and `/usr/bin/python3 "$(git rev-parse --show-toplevel)/.codex/hooks/pre_tool_use_policy.py"`. Both can use HTTP webhooks; Claude Code additionally supports `prompt` hooks (an inline Claude call), `agent` hooks (a subagent invocation), and `mcp_tool` hooks (call into a connected MCP server).
9. **Maturity**: Claude Code hooks are GA, have an interactive `/hooks` browser, an enterprise `allowManagedHooksOnly` policy, and a documented v2.1.139+ change moving command hooks off `/dev/tty`. Codex hooks are explicitly marked `Experimental. Hooks are under active development. Windows support temporarily disabled.` and require `[features] hooks = true` (the older `codex_hooks` key is a deprecated alias per the current Configuration Reference: "Enable lifecycle hooks loaded from hooks.json or inline [hooks] config. features.codex_hooks is a deprecated alias.").

## Details

### 1. Configuration files, locations, and languages

**Claude Code (JSON)**

| Location | Scope | Shareable |
|---|---|---|
| `~/.claude/settings.json` | All your projects | No, local to your machine |
| `.claude/settings.json` | Single project | Yes, can be committed |
| `.claude/settings.local.json` | Single project | No, gitignored |
| Managed policy settings | Organization-wide | Yes, admin-controlled |
| Plugin `hooks/hooks.json` | When plugin is enabled | Yes, bundled with plugin |
| Skill / subagent frontmatter | While component is active | Yes |

The `permissions` object is the policy-gate primitive:

```json
{
  "permissions": {
    "allow": ["Bash(npm:*)", "Bash(git:*)", "Write(src/**)", "mcp__github__create-pull-request"],
    "ask": [],
    "deny": ["Read(**/.env)", "Bash(sudo:*)", "Bash(curl:*)"],
    "additionalDirectories": ["/Users/me/shared-libs"],
    "defaultMode": "default",
    "disableBypassPermissionsMode": "disable"
  }
}
```

Rule grammar: `ToolName(content)` where `content` is a command pattern (Bash uses `:*` for trailing wildcards) or a gitignore-style path glob (Read/Edit). MCP tools use double-underscore `mcp__<server>__<tool>`. Precedence: `deny > ask > allow > defaultMode fallback`. Permission modes (`defaultMode`): `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. `auto` is an LLM-classifier-driven mode with its own `autoMode.environment` / `allow` / `soft_deny` / `hard_deny` (added in v2.1.136 per the official release notes: "Added settings.autoMode.hard_deny for auto mode classifier rules that block unconditionally regardless of user intent or allow exceptions.") prose-string arrays. `dontAsk` converts every approval prompt to a denial. `bypassPermissions` is gated by `disableBypassPermissionsMode` and `skipDangerousModePermissionPrompt`. Enterprise managed-settings can set `allowManagedPermissionRulesOnly` to ignore user/project rules entirely.

Hooks live under the same JSON file in a `hooks` object keyed by event name:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(rm *)",
            "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/block-rm.sh",
            "args": [],
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

The configuration has three nesting levels: hook event → matcher group → array of handlers. Handler `type` values are `command`, `http`, `mcp_tool`, `prompt`, `agent`. The optional `if` field uses the same permission-rule syntax (`Bash(git *)`, `Edit(*.ts)`) to filter per-handler so the process only spawns when the tool input matches.

**Codex CLI (TOML for config, JSON for hooks)**

The user-level config lives at `~/.codex/config.toml`; project-scoped overrides at `<repo>/.codex/config.toml` load only when the project is trusted. Hooks live in a **separate** `hooks.json` next to active config layers (`~/.codex/hooks.json`, `<repo>/.codex/hooks.json`). This split is recent and was the subject of a regression bug (issue #19199) in v0.124.0.

`config.toml` example covering the policy-gate surface:

```toml
#:schema https://developers.openai.com/codex/config-schema.json

model = "gpt-5.4"
approval_policy = "on-request"       # untrusted | on-request | never | { granular = { ... } }
sandbox_mode = "workspace-write"     # read-only | workspace-write | danger-full-access
approvals_reviewer = "user"          # user | auto_review
allow_login_shell = false
notify = ["python3", "/Users/me/.codex/hooks/notify.py"]

[features]
hooks = true                         # canonical key; codex_hooks is a deprecated alias

[sandbox_workspace_write]
network_access = false
# writable_roots, exclude, etc.

[tui]
notifications = true                 # or ["agent-turn-complete", "approval-requested"]

[shell_environment_policy]
inherit = "none"
set = { PATH = "/usr/bin", MY_FLAG = "1" }
exclude = ["AWS_*", "AZURE_*"]
include_only = ["PATH", "HOME"]

[profiles.review]
model = "gpt-5.4"
approval_policy = "on-request"
sandbox_mode = "read-only"

[profiles.local_edit]
approval_policy = "on-request"
sandbox_mode = "workspace-write"

# Optional granular approval policy
# approval_policy = { granular = {
#   sandbox_approval = true,
#   rules = true,
#   mcp_elicitations = true,
#   request_permissions = false,
#   skill_approval = false
# } }

# Named permission profile (capability-based read/write/none)
default_permissions = "workspace"

[permissions.workspace.filesystem]
":project_roots" = { "." = "write", "**/*.env" = "none" }
glob_scan_max_depth = 3
```

`hooks.json` shape (verbatim from official Hooks docs):

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.codex/hooks/session_start.py",
            "statusMessage": "Loading session notes"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/usr/bin/python3 \"$(git rev-parse --show-toplevel)/.codex/hooks/pre_tool_use_policy.py\"",
            "statusMessage": "Checking Bash command"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "/usr/bin/python3 \"$(git rev-parse --show-toplevel)/.codex/hooks/stop_continue.py\"", "timeout": 30 }
        ]
      }
    ]
  }
}
```

Precedence: matching hooks from multiple files all run. Higher-precedence config layers do not replace lower-precedence hooks (additive merge, unlike Claude Code's deny-first rule evaluation but similar in spirit for hook discovery).

### 2. Lifecycle hook events — side-by-side matrix

| Event concept | Claude Code event | Codex CLI event | Notes |
|---|---|---|---|
| Session begins / resumes | `SessionStart` (matchers: `startup`, `resume`, `clear`, `compact`) | `SessionStart` (matchers: `startup`, `resume`) | Codex lacks `clear`/`compact` matchers because it has no equivalent slash commands wired through this event. |
| Explicit init/maintenance from CLI | `Setup` (matchers: `init`, `maintenance`, fired by `--init-only`, `-p --init`, `-p --maintenance`) | none | |
| Instructions file loaded into context | `InstructionsLoaded` (per CLAUDE.md / `.claude/rules/*.md`) | none (AGENTS.md is loaded but not surfaced via a hook) | Codex's AGENTS.md mechanism (see §8) is a static-instructions loader analogous to CLAUDE.md, but exposes no per-load event. |
| User prompt submitted | `UserPromptSubmit` (blockable, can inject `additionalContext`, can set `sessionTitle`) | `UserPromptSubmit` (blockable via `decision: "block"`, can append plain-stdout developer context) | Codex `matcher` is ignored on this event. |
| Slash command expanded | `UserPromptExpansion` | none | |
| Before any tool call | `PreToolUse` (every tool; rich decision: `allow`/`deny`/`ask`/`defer` plus `updatedInput`, `additionalContext`) | `PreToolUse` (Bash only; can `deny` or `block`; `allow`/`ask`, `updatedInput`, `additionalContext`, `continue: false` "parsed but not supported yet, so they fail open") | Codex docs explicitly note that the model can defeat `PreToolUse` by writing a script to disk and invoking it via Bash, so it is "a useful guardrail rather than a complete enforcement boundary". |
| Permission dialog about to show | `PermissionRequest` (allow/deny on user's behalf, can return `updatedPermissions` to persist rules to settings) | `PermissionRequest` (covers Bash, `apply_patch`, and MCP tool names; allow/deny/defer decisions per `developers.openai.com/codex/hooks`) | Newer Codex event; brings Codex closer to Claude Code parity for non-shell tools. |
| Auto-mode classifier denied a tool | `PermissionDenied` (can set `retry: true`) | none | |
| After a tool succeeds | `PostToolUse` (every tool; `additionalContext`, `updatedToolOutput`) | `PostToolUse` (covers Bash, `apply_patch`, and MCP tool calls per `developers.openai.com/codex/hooks`; `additionalContext`, `decision: "block"` replaces tool result, `continue: false`) | |
| After a tool fails | `PostToolUseFailure` | none | |
| After a batch of parallel tool calls | `PostToolBatch` | none | |
| Notification | `Notification` (matchers `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog`, `elicitation_complete`, `elicitation_response`) | top-level `notify` program (event types: `agent-turn-complete` only) plus `[tui] notifications` filter (can include `approval-requested`) | Different shape: Codex `notify` is an argv-invoked external program, not a matched-event hook. |
| Subagent spawned | `SubagentStart` | none | |
| Subagent finished | `SubagentStop` | none | |
| Task created (TaskCreate tool) | `TaskCreated` | none | |
| Task completed | `TaskCompleted` | none | |
| Teammate idle | `TeammateIdle` | none | |
| Turn ends (Claude/agent finished responding) | `Stop` (can `block` to force continue), `StopFailure` (read-only, on API error) | `Stop` (can `block` with `reason` to inject continuation prompt) | Identical core semantic. |
| Before compaction | `PreCompact` (matchers `manual`, `auto`) | none | |
| After compaction | `PostCompact` | none | |
| MCP elicitation | `Elicitation`, `ElicitationResult` | none (granular `mcp_elicitations` flag in `approval_policy.granular`) | |
| Worktree create/remove | `WorktreeCreate`, `WorktreeRemove` | none (worktrees are Codex-app concept, not CLI) | |
| Working directory changed | `CwdChanged` | none | |
| Watched file changed | `FileChanged` (matcher = literal filename list, e.g. `.envrc|.env`) | none | |
| Configuration file changed | `ConfigChange` (matchers: `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills`) | none | |
| Session ends | `SessionEnd` (matchers: `clear`, `resume`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other`) | none (the `notify` program is the only thing that fires near turn-end) | |

### 3. Hook handler types

| Handler type | Claude Code | Codex CLI |
|---|---|---|
| Shell `command` | Yes. JSON via stdin, results via exit code + stdout JSON. | Yes. JSON via stdin per official Hooks page. Plain text on stdout is added as developer context for `SessionStart`, `UserPromptSubmit`; ignored for `PreToolUse`/`PostToolUse`. |
| `http` POST webhook | Yes. JSON body in, JSON body out. Non-2xx is non-blocking. | No |
| `mcp_tool` | Yes. Calls a tool on an already-connected MCP server; tool text output treated as command stdout. | No |
| `prompt` (Claude single-turn yes/no) | Yes. Default model is the fast model; returns `{ok, reason}`. | No |
| `agent` (subagent with tool access) | Yes. Experimental; subagent can use Read/Grep/Glob to verify conditions. | No |
| External `notify` argv program (turn-complete only) | n/a (Notification event covers this) | Yes — top-level `notify = ["program", "args..."]` array; Codex passes the JSON payload as a single argv argument: `notification = json.loads(sys.argv[1])`. |

### 4. Hook input/output contract

**Claude Code (verbatim from `code.claude.com/docs/en/hooks`)**

Common input fields delivered as JSON on stdin (`command`), POST body (`http`), or tool args (`mcp_tool`):

```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../transcript.jsonl",
  "cwd": "/Users/...",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": { "command": "npm test" }
}
```

Exit code semantics:

- `Exit 0`: success. stdout parsed as JSON for decision control. For `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart`, plain-text stdout is added as Claude's context.
- `Exit 2`: blocking error. stderr fed back to Claude as feedback. For `PreToolUse` blocks the call; for `Stop` prevents Claude from stopping; for `UserPromptSubmit` rejects the prompt; etc.
- Any other non-zero: non-blocking error.

Universal JSON output fields: `continue`, `stopReason`, `suppressOutput`, `systemMessage`, `terminalSequence` (OSC 0/1/2/9/99/777 allowlist plus BEL, available as of v2.1.141, replaces writes to `/dev/tty`).

`PreToolUse` decision:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Database writes are not allowed"
  }
}
```

`permissionDecision` values: `allow` (skips prompt; deny/ask rules still evaluated), `deny`, `ask`, `defer` (non-interactive mode only, used by SDK integrations to pause-resume around external UI; requires v2.1.89+). Precedence when multiple hooks return different decisions: `deny > defer > ask > allow`.

`PermissionRequest` decision (with `updatedPermissions` to persist rules into the user's settings):

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow",
      "updatedInput": { "command": "npm run lint" }
    }
  }
}
```

`updatedPermissions` entry types: `addRules`, `replaceRules`, `removeRules`, `setMode`, `addDirectories`, `removeDirectories`. Destinations: `session`, `localSettings`, `projectSettings`, `userSettings`.

**Codex CLI (verbatim from `developers.openai.com/codex/hooks`)**

Common input fields (one JSON object on stdin per command hook):

| Field | Type | Meaning |
|---|---|---|
| `session_id` | string | Current session/thread id |
| `transcript_path` | string \| null | Path to session transcript, if any |
| `cwd` | string | Working directory |
| `hook_event_name` | string | Event name |
| `model` | string | Active model slug |

Turn-scoped events add `turn_id`. `PreToolUse`/`PostToolUse` add `tool_name` (Bash for PreToolUse today; Bash, `apply_patch`, or MCP tool name for PostToolUse and PermissionRequest), `tool_use_id`, and `tool_input.command` (for Bash). `PostToolUse` adds `tool_response`. `SessionStart` adds `source` (`startup` or `resume`). `Stop` adds `stop_hook_active` and `last_assistant_message`.

Common output fields:

```json
{ "continue": true, "stopReason": "optional", "systemMessage": "optional", "suppressOutput": false }
```

The docs explicitly enumerate what is _not_ yet supported per event. From the official page (verbatim caveats):

- `PreToolUse`: "`permissionDecision: \"allow\"` and `\"ask\"`, legacy `decision: \"approve\"`, `updatedInput`, `additionalContext`, `continue: false`, `stopReason`, and `suppressOutput` are parsed but not supported yet, so they fail open."
- `PostToolUse`: "`updatedMCPToolOutput` and `suppressOutput` are parsed but not supported yet, so they fail open."
- `Stop`: "`decision: \"block\"` does not reject the turn. Instead, it tells Codex to continue and automatically creates a new continuation prompt that acts as a new user prompt, using your `reason` as that prompt text."

`PreToolUse` block (either shape accepted):

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Destructive command blocked by hook."
  }
}
```

Or the older shape:

```json
{ "decision": "block", "reason": "Destructive command blocked by hook." }
```

`exit 2` with reason on stderr is also accepted.

### 5. The `notify` program (Codex's lone external-event sink)

A top-level array in `config.toml`:

```toml
notify = ["python3", "/Users/me/.codex/notify.py"]
```

Codex invokes the program once, passing the event payload as the final argv argument (`argv[1]` after the program is launched). Per the official Advanced Config page, "The script receives a single JSON argument." Documented fields (kebab-case, unlike everything else in Codex):

| Field | Meaning |
|---|---|
| `type` | Currently only `agent-turn-complete` |
| `thread-id` | Session identifier |
| `turn-id` | Turn identifier |
| `cwd` | Working directory |
| `input-messages` | User messages that led to the turn |
| `last-assistant-message` | Final assistant message text |

A minimal Python handler from the docs:

```python
#!/usr/bin/env python3
import json, sys, subprocess

notification = json.loads(sys.argv[1])
if notification.get("type") != "agent-turn-complete":
    sys.exit(0)
subprocess.run(["terminal-notifier", "-title", "Codex", "-message",
                notification.get("last-assistant-message", "Done")])
```

The separate `[tui] notifications = true` setting (or `notifications = ["agent-turn-complete", "approval-requested"]`) controls in-TUI desktop notifications and can include `approval-requested`; that event does _not_ reach the `notify` argv program.

GitHub `docs/config.md` previously documented the payload verbatim but now defers to `developers.openai.com/codex/config-advanced`; older snapshots referenced additional fields (`approval_policy`, `network_access`, `sandbox_mode`, `shell`) which appear in practice but are not in the current documented schema. Treat the six fields above as the guaranteed contract.

### 6. Permission/policy gates — side-by-side matrix

| Mechanism | Claude Code | Codex CLI |
|---|---|---|
| Declarative allow/ask/deny rules | `permissions.allow`, `permissions.ask`, `permissions.deny` arrays in `settings.json`. Pattern grammar: `ToolName(content)`, e.g. `Bash(git:*)`, `Bash(npm install)`, `Read(**/.env)`, `Edit(src/**/*.ts)`, `WebFetch(domain:example.com)`, `mcp__github__create-pull-request`. Precedence: deny > ask > allow > defaultMode. | Starlark `.rules` files under `<config-layer>/rules/`. Loaded automatically: `~/.codex/rules/*.rules` (always), `<repo>/.codex/rules/*.rules` (when project trusted), and admin-enforced rules from `requirements.toml`. Rule: `prefix_rule(pattern=[...], decision="allow"|"prompt"|"forbid", justification="...", match=[...], not_match=[...])`. Precedence: most-restrictive wins (forbidden > prompt > allow). Approving in TUI writes to `~/.codex/rules/default.rules`. Verify with `codex execpolicy check --rules ... -- <command>`. |
| Permission modes | `permissions.defaultMode`: `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. | `approval_policy`: `untrusted`, `on-request`, `never`, or granular object. Plus `sandbox_mode`: `read-only`, `workspace-write`, `danger-full-access`. The `Auto` preset = `workspace-write` + `on-request`. |
| Reviewer for approvals | n/a (every approval is interactive; `auto` mode uses an LLM classifier instead) | `approvals_reviewer = "user"` (default) or `auto_review` (reviewer subagent evaluates eligible approval prompts; managed `guardian_policy_config` and local `[auto_review].policy` text). |
| Sandbox modes | Documented in-process sandbox primitive `autoAllowBashIfSandboxed: true`; `sandbox.allowedDomains`/`deniedDomains` for WebFetch. No OS-level isolation documented as primary boundary. | First-class OS sandbox: macOS Seatbelt (`sandbox-exec -p`), Linux `bwrap` + `seccomp`, native Windows sandbox (`[windows] sandbox = "unelevated" \| "elevated"`). `codex sandbox macos/linux [COMMAND]` is the test harness. |
| Network gate | `WebFetch(domain:example.com)`, `WebFetch(domain:*)`, plus separate sandbox allow/deny domain lists. | `[sandbox_workspace_write] network_access = false` (default). For Codex cloud, agent-internet-access page describes allowlists. |
| Filesystem capability map | `permissions.additionalDirectories` extends Claude's reach beyond cwd. `Read(**/.env)`/`Edit(...)` deny rules restrict per-path. | Named permission profile under `default_permissions = "<name>"` with `[permissions.<name>.filesystem]` map of glob patterns to `write`/`read`/`none`. Example: `":project_roots" = { "." = "write", "**/*.env" = "none" }`. The `"none"` capability is the closest Codex primitive to a "read-only-by-capability" deny. |
| Protected paths | None auto-protected in `workspace-write` equivalent. | In `workspace-write`: `<writable_root>/.git`, `<writable_root>/.codex`, `<writable_root>/.agents` are recursively read-only. Resolved-gitdir for pointer files also protected. |
| Additional writable roots | `permissions.additionalDirectories` array. | `codex --add-dir ../backend --add-dir ../shared` per run; or per-profile filesystem map. |
| Read-only mode | `defaultMode: "plan"` analyzes without modifying. | `sandbox_mode = "read-only"` (the `/permissions` slash command switches a session into read-only mid-run). |
| Bypass / dangerous | `defaultMode: "bypassPermissions"`, gated by `disableBypassPermissionsMode` and `skipDangerousModePermissionPrompt`. | `--dangerously-bypass-approvals-and-sandbox` / `--yolo` / `sandbox_mode = "danger-full-access"`. |
| Managed / enterprise policy | Managed `settings.json` deployed via MDM (`/Library/Application Support/ClaudeCode/managed-settings.json`, `C:\ProgramData\ClaudeCode\managed-settings.json`). `allowManagedHooksOnly`, `allowManagedPermissionRulesOnly`. | `requirements.toml` (ChatGPT Business/Enterprise can also apply cloud-fetched requirements). Pins `allowed_approval_policies`, `allowed_sandbox_modes`, `allowed_web_search` ∈ {`disabled`, `cached`, `live`}, `[features]` pinning, host-specific overrides, admin-enforced prefix rules that "must be restrictive". |
| MCP gating | Tool name `mcp__server__tool` matches into allow/ask/deny. `permission_suggestions` returned to `PermissionRequest` hooks let users persist rules. | Per-server `[mcp_servers.<name>]` with `enabled_tools`, `disabled_tools`, `default_tools_approval_mode`, per-tool `approval_mode` (`auto`/`prompt`/`approve`), `required = true` (fail startup if server can't initialize), plus `approval_policy.granular.mcp_elicitations`. |
| App-tool gating (connectors) | n/a | `[apps._default]` and `[apps.<name>]` with `destructive_enabled`, `open_world_enabled`, `default_tools_approval_mode`. Destructive-hint tool calls always require approval (cannot be silently bypassed). |
| Shell environment scrubbing | n/a (inherits parent env) | `[shell_environment_policy] inherit = "none"`, plus `set`, `exclude`, `include_only`, `ignore_default_excludes`. |
| Worktree / `git`-aware policy | `WorktreeCreate`/`WorktreeRemove` hooks; Claude Code can create worktrees. | `<root>/.git` is read-only in `workspace-write` (`git commit` from the agent needs approval outside the sandbox). |

### 7. Hook languages and conventions

Both platforms execute hooks as shell commands so any language works. Notable conventions:

- **Claude Code**: the official `anthropics/claude-code` repo ships `examples/hooks/bash_command_validator_example.py` (Python with `jq`/stdin). Community kits split by language: Disler's `claude-code-hooks-mastery` (3,500+ GitHub stars) uses UV single-file Python scripts exclusively, while claudefa.st's Code Kit v5.3 uses Node.js `.mjs` files exclusively (per `claudefa.st/blog/tools/hooks/cross-platform-hooks`: "Every hook in the Code Kit follows this exact checklist -- all 5 hooks are .mjs files invoked with node."). Bash with `jq` is the standard for one-liner rules. Windows users get `"shell": "powershell"` per-handler. Exec form (`command` + `args` array) avoids shell tokenization entirely and is required for paths with spaces; shell form is needed for pipes/`&&`. `${CLAUDE_PROJECT_DIR}`, `${CLAUDE_PLUGIN_ROOT}`, `${CLAUDE_PLUGIN_DATA}` placeholders are substituted into `command` and into each `args` element. The `prompt` and `agent` handler types are unique to Claude Code: they let hooks delegate the policy decision to a model instead of to deterministic code.
- **Codex CLI**: docs use `python3` invocations as the canonical example. Hooks run with the session `cwd` as their working directory; commands often use `$(git rev-parse --show-toplevel)` to anchor to the repo root because Codex may be started from a subdirectory. Hooks are currently disabled on Windows (Experimental status). All matching hooks for one event run **concurrently** ("one hook cannot prevent another matching hook from starting"), unlike Claude Code where parallel execution is also the default but the model evaluates the strictest decision when multiple `PreToolUse` hooks disagree.

### 8. AGENTS.md and CLAUDE.md (static-instructions loaders, not gates)

Codex's `AGENTS.md` and Claude Code's `CLAUDE.md` are parallel mechanisms: free-form Markdown that Codex/Claude reads at session start and prepends to model context. Neither gates approvals.

Codex specifics (per `developers.openai.com/codex/guides/agents-md`):

- Discovery: global `~/.codex/AGENTS.override.md` then `~/.codex/AGENTS.md` (first non-empty wins); project scope walks from git root to cwd checking `AGENTS.override.md` then `AGENTS.md` then `project_doc_fallback_filenames` per directory.
- Concatenation: root-down, with deeper files overriding earlier guidance because they appear later.
- Size cap: `project_doc_max_bytes` (default 32 KiB).
- Audit: `~/.codex/log/codex-tui.log` shows which instruction files were loaded.
- Gating: none. AGENTS.md content is advisory ("Ask for confirmation before adding new production dependencies"); enforcement is the job of `approval_policy`, `sandbox_mode`, `.rules`, and `hooks.json`.

Claude Code's equivalent is CLAUDE.md plus `.claude/rules/*.md` files; the `InstructionsLoaded` hook event fires for each load (matchers `session_start`, `nested_traversal`, `path_glob_match`, `include`, `compact`) and is observability-only (no decision control).

### 9. Architectural and philosophical differences

**Where the security boundary sits.** Claude Code treats the agent process as the security boundary and asks the user to declaratively describe allowed/denied operations in JSON. The model is on the inside of the boundary; hooks and rules decide what the model is allowed to attempt. This produces a fine-grained, tool-aware capability surface (every tool has a name; rules are tool-keyed; even MCP tools are gated by their server-prefixed names). The cost: there is no OS-level fallback. A hook that exits 1 instead of 2 is a non-blocking error; a misconfigured rule file is the only thing standing between the model and `rm -rf`.

Codex CLI treats the **OS** as the security boundary by default. The sandbox executes model-generated commands through `sandbox-exec` / `bwrap` / Windows sandbox and is the actual enforcement primitive; the approval prompts and `.rules` are escalation gates that decide whether to leave the sandbox. Hooks are an experimental observability and supplementary-gate layer bolted on top. The cost: hook-level gating is coarse (`PreToolUse` still Bash-only today, Windows disabled, several decision fields parsed-but-not-enforced) and the model can bypass `PreToolUse` Bash interception by writing a script to disk and invoking it via Bash (the docs explicitly note this).

**Configuration ergonomics.** Claude Code's choice to put hooks and permissions in the same JSON file under one `permissions` / `hooks` block is operator-friendly: everything you can configure lives in one schema. Codex splits config across `~/.codex/config.toml` (TOML, declarative policy), `~/.codex/hooks.json` (JSON, behind feature flag), `~/.codex/rules/*.rules` (Starlark, allow/prompt/forbid), and `requirements.toml` (TOML, admin pinning). The Starlark `.rules` files give you executable rule validation (`match`/`not_match` inline tests, `codex execpolicy check`) which Claude Code does not offer. The TOML/JSON split is a friction point and was the cause of a real regression in v0.124.0.

**Multi-handler semantics.** Claude Code runs all matching handlers in parallel, deduplicates identical command-string handlers, and computes a strictest decision (`deny > defer > ask > allow`) when several `PreToolUse` hooks disagree. Codex docs explicitly note that "Multiple matching command hooks for the same event are launched concurrently, so one hook cannot prevent another matching hook from starting" — there is no documented combine-rule, so this is a use-with-caution area.

**Pi-style "read-only-by-capability" mapping.** For an extension ecosystem where extensions should declare capabilities and the harness enforces read-only-by-default at a primitive level, Codex provides the closer existing model:

- `sandbox_mode = "read-only"` is a real OS-enforced read-only mode at the process boundary, not a soft setting.
- `default_permissions = "<profile>"` with `[permissions.<name>.filesystem]` maps glob patterns to `write` / `read` / `none` — a per-extension capability vocabulary already exists.
- Protected paths (`.git`, `.codex`, `.agents`) inside writable roots show OpenAI's pattern for "this is the agent's own state directory, it stays read-only even when the rest is writable" — directly relevant to a Pi extension that wants its config dir read-only inside the agent's workspace.
- `requirements.toml` with `allowed_sandbox_modes`, host-specific overrides, and restrictive `prefix_rule` enforcement maps to "admins can pin extensions to read-only" centrally.
- Network access is a separate capability bit (`[sandbox_workspace_write] network_access = false`), aligning with capability-style isolation.

Claude Code offers tighter per-tool gating (`Read(**/.env)`, `Edit(*.ts)`, `WebFetch(domain:...)`), better lifecycle observability (25+ events vs 6), and richer hook decision objects (`updatedInput`, `updatedPermissions`, `updatedToolOutput`, `additionalContext`, `deferred_tool_use`), but does not provide OS-level capability isolation. A Pi design that wants both should treat Claude Code's hook/permission model as the in-process policy layer and Codex's sandbox/profile model as the OS-level enforcement layer.

### 10. Maturity and stability

| Aspect | Claude Code | Codex CLI |
|---|---|---|
| Hook system status | GA. Interactive `/hooks` browser. v2.1.139+ moved command hooks off `/dev/tty`; v2.1.141+ added `terminalSequence`. | Experimental. Behind `[features] hooks = true` (deprecated alias `codex_hooks`). Windows support temporarily disabled. Several decision fields documented as "parsed but not supported yet, so they fail open". |
| Permission system status | GA, deny-first. `auto` mode classifier is newer; `hard_deny` added in v2.1.136 (May 11, 2026 release: "Added settings.autoMode.hard_deny for auto mode classifier rules that block unconditionally regardless of user intent or allow exceptions."). | GA for `approval_policy` / `sandbox_mode` / `.rules`. Granular approval policy is documented as the modern replacement for the deprecated `on-failure`. Named permission profiles still feel newer; `glob_scan_max_depth` and `:project_roots` were recently added. |
| Schema discoverability | `$schema` URL hints in JSON; `/hooks` menu shows source file per hook. | `#:schema https://developers.openai.com/codex/config-schema.json`; generated hook schemas under `codex-rs/hooks/schema/generated`. |
| Test/preview harness | `claude --debug` for hook stdout/stderr. | `codex execpolicy check --pretty --rules ... -- <command>` previews the strictest decision and matched rules. `codex sandbox macos/linux` and `codex debug` run a command under the live sandbox profile. |
| Doc / repo discrepancies | Minor: blog posts cite varying event counts (12, 13, 18, 21); the authoritative count is on `code.claude.com/docs/en/hooks`. | Notable: `~/.codex/hooks.json` location is on the website but issue #19199 documents v0.124.0 regressing this. The GitHub `docs/config.md` now redirects readers to `developers.openai.com/codex/config-*` and is not the verbatim source any more. |

## Recommendations

For a Principal Engineer building a Pi extension ecosystem, here are staged, concrete moves and the benchmarks that should change them.

1. **Adopt Claude Code's hook event taxonomy verbatim, but treat it as a superset to pull from selectively.** The events that are highest-value for an extension ecosystem are `PreToolUse`, `PostToolUse`, `PermissionRequest`, `PermissionDenied`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `Stop`, `SubagentStart`/`SubagentStop`, `PreCompact`, `PostCompact`, `InstructionsLoaded`, `FileChanged`, `CwdChanged`, `ConfigChange`. Codex's six-event set is too small for a real extension surface. Benchmark to revise: if you can deliver an extension that needs less than five lifecycle events you can mirror Codex; if any extension needs `Stop` to inject continuation prompts (a common pattern) you already need the larger set.

2. **Adopt Codex's OS sandbox primitives as the enforcement layer, not Claude Code's in-process model.** Use `sandbox-exec` profiles on macOS, `bwrap` + `seccomp` on Linux, and a Windows sandbox harness. Make `read-only` the default sandbox mode for any new extension. The named permission profile with `[permissions.<name>.filesystem]` glob → `write` / `read` / `none` is the right shape for a "capability declared per extension" manifest. Benchmark: if an extension uploads a manifest declaring `filesystem: read-only` and `network: false`, Pi should refuse to launch it in any mode that exceeds those bits, regardless of what the model attempts.

3. **Borrow Codex's `protected paths in writable roots`.** Make `<workspace>/.pi`, `<workspace>/.git`, and any extension-state directory read-only inside otherwise writable workspaces. This is the cheapest way to prevent extensions from clobbering their own state or auth tokens. Benchmark: a single failing fuzz test that has the model try to overwrite `.pi/credentials.json` should hit the sandbox boundary, not a permission rule.

4. **Use a Starlark-style rules format for prefix-matching command policy, but back it with Claude-Code-style per-tool patterns for non-Bash tools.** Codex's `prefix_rule(pattern=[...], decision="prompt"|"allow"|"forbid", justification="...", match=[...], not_match=[...])` has inline unit tests, which is a strict improvement over Claude Code's stringly-typed `Bash(git:*)`. For non-Bash tools (file edits, web fetches, MCP calls), Claude Code's tool-keyed pattern syntax (`Read(**/.env)`, `mcp__server__tool`) is the right primitive. Both should be expressible. Benchmark: extensions must be able to ship rules with `match`/`not_match` self-tests that run in CI.

5. **Build hook decision objects from Claude Code's richer schema.** At minimum: `permissionDecision: allow|deny|ask|defer`, `permissionDecisionReason`, `updatedInput` (modify tool args before exec), `additionalContext` (inject system reminders), `updatedToolOutput` (rewrite tool result before model sees it), `continue: false` / `stopReason`. Codex's "parsed but not supported yet" subset is a cautionary tale: do not ship fields you cannot enforce. Benchmark: if your harness accepts `updatedInput` in a decision object, every code path that calls a tool must read it back; no silent fail-open.

6. **Adopt the multi-source layered config model with deny-first precedence**: `~/.pi/settings.json` (user), `.pi/settings.json` (project, requires trust), `.pi/settings.local.json` (gitignored), managed policy file deployed via MDM. Use JSON, not TOML — Claude Code's choice avoids the "root keys must appear before tables" foot-gun that affects Codex `notify` placement and bites enterprise rollouts. If you need TOML for human-edited policy, segregate it from the hook config the way Codex does (`config.toml` vs `hooks.json`) and accept the cost.

7. **Provide both an external `notify`-style argv hook for the common turn-complete case and a richer `Notification` event for finer-grained UI integration.** Codex's split (`notify` for "trigger something external when the turn ends" + `[tui] notifications` for in-process desktop alerts) is operationally pragmatic for desktop notifiers, Slack pings, and CI webhooks; Claude Code's `Notification` event matches finer cases (`permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_*`). Ship both.

8. **Make the bypass-everything mode hard to enable.** Codex requires a literal `--dangerously-bypass-approvals-and-sandbox` (or `--yolo`) per run; Claude Code requires `disableBypassPermissionsMode != "disable"` plus an explicit prompt. Both are good. Benchmark: managed-policy enterprise config must be able to set `allowed_sandbox_modes = ["read-only", "workspace-write"]` and disable bypass globally.

9. **Add an `execpolicy check`-style preview harness from day one.** Codex's `codex execpolicy check --pretty --rules X -- <command>` is the right operator UX for verifying rules before deployment. Pair it with `codex sandbox macos`-style "run this command under the live sandbox profile" subcommand. Claude Code lacks both and forces operators to test by re-running the agent.

10. **Stay clear of Codex CLI's experimental hooks as the basis of a production extension API.** The official Hooks page is unambiguous that Windows is disabled, only Bash tools are intercepted by `PreToolUse`, several decision fields fail open, and the model can route around `PreToolUse` via Bash-launched scripts. Either wait for it to graduate (the Feature Maturity page tracks this) or treat the page as a forward-looking design reference rather than a usable implementation.

## Caveats

- **Versioning drift.** Both products iterate quickly. The Claude Code 25+ event count cited here reflects the public March-2026-and-after lifecycle documented at `code.claude.com/docs/en/hooks`. Several third-party guides still cite 8, 12, or 18 events because they were written against earlier versions. The authoritative source is the official hooks-reference page.
- **Codex hooks are explicitly Experimental.** The official Hooks page opens with: "Experimental. Hooks are under active development. Windows support temporarily disabled." The feature key migrated from `codex_hooks` to `hooks` (the former is now a deprecated alias). Several decision fields documented in the schema ("parsed but not supported yet, so they fail open") will likely become real in future releases; do not depend on them today.
- **Codex `notify` schema is partially documented.** The official Advanced Config page enumerates six payload fields (`type`, `thread-id`, `turn-id`, `cwd`, `input-messages`, `last-assistant-message`) and says `agent-turn-complete` is the only event. GitHub issue #4005 historically showed additional fields (`approval_policy`, `network_access`, `sandbox_mode`, `shell`); rely only on the documented six.
- **GitHub repo vs developer-docs divergence (Codex).** The GitHub `openai/codex/docs/config.md` file now defers to `developers.openai.com/codex/config-*` rather than duplicating content. Where this report quotes Codex behavior, the developer-docs site is treated as authoritative. The generated hook schemas live at `codex-rs/hooks/schema/generated` in the repo.
- **Hook script language**. "Any language works" is true in principle for both, but specific docs examples vary: Claude Code's reference implementation is Python (e.g., `bash_command_validator_example.py`), with bash + `jq` as the most common community pattern; community ecosystems are clearly split (Disler's `claude-code-hooks-mastery` uses UV single-file Python exclusively; claudefa.st's Code Kit v5.3 uses Node `.mjs` exclusively). Codex's docs use `python3` exclusively in examples. Neither platform officially recommends a language.
- **Sandboxing claims for Claude Code.** Anthropic's docs describe Claude Code hooks as running with the user's full permissions ("Hooks run with your full user permissions. There is no sandbox"). The `sandbox` block in `settings.json` and `autoAllowBashIfSandboxed: true` apply specifically to Bash tool execution, not to hook scripts themselves. This contrasts with Codex CLI, where the OS sandbox applies to model-generated commands by default.
- **Some named features cited in third-party blogs are not in the primary docs.** Examples include claims about Claude Code's "21 events" or "4 handler types": the primary docs currently show 5 handler types (`command`, `http`, `mcp_tool`, `prompt`, `agent`) and 25+ events. Where this report cites a specific number it is taken from the official reference page; treat third-party counts skeptically.
- **TUI vs library APIs.** Both products expose their agent harness through a CLI and through libraries/SDKs (Claude Agent SDK, Codex SDK, Codex App Server). Some events documented here exist only in the CLI/TUI, not in the SDK. Validate against the SDK docs separately if you need programmatic access.

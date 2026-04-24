# Skills — Best Practices

Authoring guidance for skills used by coding agents (Claude Code, Claude Agent
SDK, OpenAI Codex CLI). A "skill" is a filesystem-resident, on-demand unit of
prescriptive guidance plus optional bundled resources that an agent loads when
its `description` matches the current task.

Synthesised from Anthropic and OpenAI official guidance. Where the two diverge,
the rule is called out. Where neither publishes guidance, the gap is named.

---

## When to write a skill

| Signal                                         | Write a skill?                     |
| ---------------------------------------------- | ---------------------------------- |
| Rule repeats across projects                   | Yes                                |
| Rule is project-specific                       | No — use `AGENTS.md` / `CLAUDE.md` |
| One-off prompt for a single task               | No — inline                        |
| Agent already does it correctly by default     | No                                 |
| Deterministic transform with a testable output | Yes, with a bundled script         |
| Philosophy / background reading                | No — it's not a skill              |

Skill ≠ docs. A skill is _prescriptive directives the agent obeys_, not prose
the agent reads.

---

## File layout

Both Anthropic and OpenAI converge on the same shape:

```
<skill-name>/
├── SKILL.md              # required; frontmatter + body
├── references/           # deeper docs, loaded on demand
├── scripts/              # deterministic ops the agent shells out to
└── assets/               # templates, fixtures, images
```

Discovery locations:

| Tool        | Personal                | Project                           |
| ----------- | ----------------------- | --------------------------------- |
| Claude Code | `~/.claude/skills/`     | `.claude/skills/`                 |
| Codex CLI   | `$HOME/.agents/skills/` | `.agents/skills/` (walks up tree) |

Project skills override personal skills of the same name. Commit project skills;
do not commit personal skills.

---

## Frontmatter

Minimum (portable across Anthropic and OpenAI):

```yaml
---
name: processing-pdfs # lowercase, hyphens, ≤64 chars
description: Use when ... # ≤1024 chars; what + when
---
```

Claude-Code-only optional fields (ignored elsewhere):

- `allowed-tools` — pre-approve tool names; cuts permission prompts.
- `disable-model-invocation: true` — user-triggered only (deploys, destructive
  ops).
- `paths` — glob patterns that restrict auto-activation.
- `arguments` — named positional args with `$name` substitution in body.

Do not rely on extension fields if the skill must be portable.

---

## The `description` field is the trigger

The agent sees only `name` + `description` at startup. Everything else is loaded
lazily. A skill that does not trigger does not exist.

Rules:

- Lead with **what it does**, then **when to use it**. Both are mandatory.
- Front-load the discriminating keywords; the field is truncated when many
  skills are loaded.
- Third person, imperative. No "I", no "you".
- Name the triggers _in the user's vocabulary_ — the jargon they would use, not
  the internal term.
- Include negative triggers sparingly when a neighbouring skill overlaps ("use
  X, not this, when …").
- Test trigger coverage: write 5–10 realistic user prompts, check the skill
  activates on the right ones and not the wrong ones.

Bad: `description: Helper for PDFs` Good:
`description: Use when extracting text, tables, or forms from PDF files; parsing scanned PDFs with OCR; or merging/splitting PDF pages. Do not use for generating PDFs — see pdf-generation.`

---

## Body: write for the agent, not the reader

The body is directive. The agent is not studying; it is executing. Apply the
memory-recorded style:

- Terse directive bullets and tables. Prose only when it produces a rule.
- Imperative mood: _"Do X." "Never Y."_ Not _"You might consider X."_
- Tables for: "when A, do B" lookups, matrices, tiered guidance.
- Code blocks for commands, templates, and canonical snippets.
- State resolved rules. Do not name experts inline ("per Rich Hickey …"). If two
  sources disagree, decide and record the rule; reserve citations for a `Canon`
  / `References` section at the bottom.
- Every reference link must be fetchable by an agent (full URL). Drop unlinkable
  citations.

Length: keep `SKILL.md` under ~500 lines. If it grows past that, split the
overflow into `references/` and link from the body.

---

## Progressive disclosure

Skills are a context-budget mechanism. Use the three layers deliberately:

| Layer | What loads                | Budget                                                     |
| ----- | ------------------------- | ---------------------------------------------------------- |
| 1     | `name` + `description`    | ~100 tokens per skill, loaded at startup                   |
| 2     | Full `SKILL.md` body      | Target <5k tokens; loaded when triggered                   |
| 3     | `references/`, `scripts/` | Loaded only when the body tells the agent to read/run them |

Structure `SKILL.md` as a table of contents that points into `references/` for
depth. Reference files should be reachable in _one hop_ from `SKILL.md` — agents
partially-read nested chains.

Scripts return output to the agent; their source is not loaded into context.
Prefer a script when the operation is deterministic, error-prone, or would
otherwise need to be re-derived each run.

---

## What goes in the body vs what doesn't

Include:

- Rules the agent would not derive from the current code.
- Decision tables for judgement calls.
- Canonical snippets, commands, and templates.
- Named failure modes and their fixes.
- Tiebreakers for when common sources disagree.

Exclude:

- Anything the agent already does correctly by default.
- Anything discoverable by reading the code in front of it.
- Generic philosophy with no extractable rule.
- Time-sensitive facts (move deprecated patterns to a collapsible "old patterns"
  section or delete).
- Windows-style paths — always forward slashes.
- Expert attribution inside rules. Resolve, then cite at the bottom.

Challenge every sentence: _does the agent actually need this, or can it infer
it?_ Delete the ones that fail.

---

## Match prescription to fragility

| Task shape                            | Form                                                |
| ------------------------------------- | --------------------------------------------------- |
| Flexible, many valid paths            | Text rules + one worked example                     |
| Preferred pattern, minor variation ok | Pseudocode or template                              |
| Deterministic, error-prone, or unsafe | Bundled `scripts/` executable + explicit invocation |

Offering too many options erodes compliance. Pick a default, mention the escape
hatch.

---

## Tone rules that apply to both vendors

From the GPT-5 / Codex prompting guide (applies equally to Claude):

- Direct, imperative, unambiguous.
- No contradictory instructions — conflicts harm behaviour more than verbosity.
- If two rules can apply, state the precedence explicitly.
- Avoid "exhaustive search" directives — they cause tool overuse. Bias toward
  "do not ask the user if you can find it yourself".

Examples caveat (OpenAI, function-calling guide): examples in instructions can
degrade reasoning-model performance. Keep examples minimal in the body; push
longer walkthroughs into `references/`.

---

## Bundled scripts

- One job per script. Explicit inputs and outputs documented in a one-line
  header.
- Prefer POSIX `sh` / `python3` / `node` — whatever is already a project
  dependency. Do not introduce a new runtime for one skill.
- Assume nothing is installed beyond the interpreter; document required packages
  at the top of `SKILL.md`.
- Truncate noisy output before returning it (50/50 head/tail with an ellipsis if
  over ~10k tokens is the published OpenAI pattern).
- Never embed secrets, tokens, or machine-specific paths.

---

## Security and trust

Skills are executable configuration. Treat installing a third-party skill like
installing software.

- Review `SKILL.md`, every bundled script, every asset, and every referenced URL
  before adding a skill from outside the team.
- Be suspicious of skills that fetch external URLs — content can change after
  review.
- `allowed-tools` in frontmatter pre-approves named tools for a skill. Grant the
  minimum. Never grant broad shell access to a skill that doesn't need it.
- Do not make the agent fill arguments you already know — pass them in code.
  This shrinks the prompt-injection attack surface.
- Skills with side effects (deploys, destructive ops) should set
  `disable-model-invocation: true` so only the user can trigger them.

Neither vendor publishes a formal threat model for third-party skills. Assume
the same trust posture as an npm dependency.

---

## Testing and iteration

- Write evaluation scenarios _before_ the skill. If you can't name 3–5 prompts
  the skill must handle, the skill is not ready.
- Measure baseline behaviour without the skill, then with it. Keep the skill
  only if the delta is real.
- Run the same scenarios across Haiku/Sonnet/Opus (or the model tier you
  target). Smaller models need more specificity.
- Iterative refinement: use one agent session to improve the skill, a second
  session to test it on real tasks. Feed the gaps back to the first.
- Re-run the eval set when the skill changes. Skills drift silently as models
  update.

Neither vendor ships a testing framework. Roll your own: a fixtures directory
with expected-outcome assertions is enough to catch regressions.

---

## Versioning

- No published versioning scheme. Use `metadata.version` in frontmatter if you
  need one.
- Track skills in git. The commit log is the version history.
- Breaking changes: bump the version and update every caller in the same PR. Do
  not keep a "v1" and "v2" side-by-side unless you actually need both.

---

## AGENTS.md / CLAUDE.md vs skills

Use project-level `AGENTS.md` or `CLAUDE.md` for:

- Build, test, lint commands.
- Repo-specific conventions.
- Stack details the agent can't infer.

Use skills for:

- Cross-project, reusable playbooks (testing strategy, security review,
  refactoring moves).
- Capabilities that want progressive disclosure and bundled resources.

Codex enforces a 32 KiB cap on `AGENTS.md`; split across nested directories when
you hit it. Claude Code has no published cap but the same advice applies — if
`CLAUDE.md` is pages long, the agent is reading less of it than you think.

---

## Anti-patterns

- **Vague names**: `helper`, `utils`, `tools`. Use gerunds — `processing-pdfs`,
  `reviewing-migrations`.
- **Essay-style body**: paragraphs without extractable rules.
- **Citations inline**: "According to X, …". Resolve the rule; cite at the
  bottom.
- **Unlinkable references**: if an agent can't fetch it, drop it.
- **Duplication with code/schema**: link the source of truth; don't restate.
- **One giant skill**: if the `description` needs "and", split it.
- **Skill for what the model already does**: adds noise, not value.
- **Copy-pasting a CLAUDE.md rule into a skill**: pick one home.

---

## Checklist before shipping a skill

- [ ] `name` is gerund-form, lowercase, hyphenated, ≤64 chars.
- [ ] `description` says _what_ and _when_; third person; front-loaded keywords.
- [ ] Body is under 500 lines; longer content is in `references/`.
- [ ] No expert attribution inside rules.
- [ ] Every reference link is a fetchable URL.
- [ ] 3–5 trigger prompts verified; 2–3 negative prompts verified.
- [ ] Bundled scripts have one-line header describing input/output.
- [ ] `allowed-tools` is minimal; destructive skills are user-triggered only.
- [ ] Evaluation run passes on the target model tier.
- [ ] No duplication with existing skills or `AGENTS.md`.

---

## References

Anthropic:

- Agent Skills overview —
  https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- Agent Skills best practices —
  https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Claude Code skills — https://code.claude.com/docs/en/skills.md
- Agent SDK skills — https://code.claude.com/docs/en/agent-sdk/skills.md
- Open skills specification — https://agentskills.io/specification
- Reference skills repo — https://github.com/anthropics/skills

OpenAI:

- AGENTS.md spec — https://agents.md/
- Codex AGENTS.md guide — https://developers.openai.com/codex/guides/agents-md
- Codex Agent Skills — https://developers.openai.com/codex/skills
- GPT-5 prompting guide —
  https://cookbook.openai.com/examples/gpt-5/gpt-5_prompting_guide
- Codex prompting guide —
  https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide
- Function calling guide —
  https://developers.openai.com/api/docs/guides/function-calling
- Agents SDK (Python) — https://openai.github.io/openai-agents-python/
- Agents SDK handoffs — https://openai.github.io/openai-agents-python/handoffs/

// Enforces ABP's specify conversation shape in Pi.

export const SPECIFY_STATE_ENTRY = "abp-specify-state";

const ACTIVATION_PATTERN = /^\s*(\/abp:specify(?:\s|$)|\/skill:specify(?:\s|$))/i;
const DEACTIVATION_PATTERN = /^\s*\/abp:specify-off\s*$/i;
const QUESTION_PATTERN = /[^?]+\?/g;

function messageText(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item?.text === "string" ? item.text : ""))
      .join("\n");
  }
  return "";
}

function latestSpecifyState(entries) {
  const stateEntry = entries
    .filter((entry) => entry?.type === "custom" && entry.customType === SPECIFY_STATE_ENTRY)
    .at(-1);

  return stateEntry?.data?.active === true;
}

function stripNonConversationText(text) {
  return String(text ?? "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^>.*$/gm, "");
}

export function isSpecifyActivation(text) {
  return ACTIVATION_PATTERN.test(String(text ?? "")) && !isSpecifyDeactivation(text);
}

export function isSpecifyDeactivation(text) {
  return DEACTIVATION_PATTERN.test(String(text ?? ""));
}

export function countUserFacingQuestions(text) {
  const conversationText = stripNonConversationText(text);
  return conversationText.match(QUESTION_PATTERN)?.length ?? 0;
}

export function shouldEnforceAssistantMessage(entries, assistantText) {
  if (!latestSpecifyState(entries)) return false;
  return countUserFacingQuestions(assistantText) > 1;
}

export function makeCorrectionPrompt(blockedText) {
  return `ABP Specify Guard blocked this response because it asked multiple user-facing questions during Specify.

Continue with exactly one decision question. Keep any other uncertainties as notes, not questions. Do not use a question list.
Before the question, state the current understanding in one short sentence so the user can correct the design.

Blocked response:
${blockedText}`;
}

function activeReminder() {
  return `\n\nABP Specify Guard is active. During Specify, ask at most one user-facing question per assistant turn. State the current understanding before the question so the human can correct the shape. You may list uncertainties as notes, but do not phrase more than one item as a question. If several decisions are open, ask only the next smallest decision question that changes the design.`;
}

function replacementMessage(message, replacementText) {
  return {
    ...message,
    content: [{ type: "text", text: replacementText }],
  };
}

/** Register the Specify One-Question Guard extension with Pi. */
export default function specifyOneQuestion(pi) {
  pi.registerCommand("abp:specify", {
    description: "Start ABP specify mode with one-question-at-a-time enforcement",
    handler: async (args, ctx) => {
      pi.appendEntry(SPECIFY_STATE_ENTRY, { active: true, source: "command" });
      ctx.ui.notify("ABP specify guard enabled", "info");

      if (args?.trim()) await pi.sendUserMessage(args.trim());
    },
  });

  pi.registerCommand("abp:specify-off", {
    description: "Stop ABP specify one-question enforcement",
    handler: async (_args, ctx) => {
      pi.appendEntry(SPECIFY_STATE_ENTRY, { active: false, source: "command" });
      ctx.ui.notify("ABP specify guard disabled", "info");
    },
  });

  pi.on("input", async (event, ctx) => {
    if (isSpecifyDeactivation(event.text)) {
      pi.appendEntry(SPECIFY_STATE_ENTRY, { active: false, source: "input" });
      ctx.ui.notify("ABP specify guard disabled", "info");
      return { action: "handled" };
    }

    if (isSpecifyActivation(event.text)) {
      pi.appendEntry(SPECIFY_STATE_ENTRY, { active: true, source: "input" });
      ctx.ui.notify("ABP specify guard enabled", "info");
    }

    return { action: "continue" };
  });

  pi.on("before_agent_start", async (event, ctx) => {
    if (!latestSpecifyState(ctx.sessionManager.getEntries())) return;
    return { systemPrompt: event.systemPrompt + activeReminder() };
  });

  pi.on("message_end", async (event, ctx) => {
    if (event.message.role !== "assistant") return;

    const text = messageText(event.message.content);
    if (!shouldEnforceAssistantMessage(ctx.sessionManager.getEntries(), text)) return;

    const correction = makeCorrectionPrompt(text);
    return {
      message: replacementMessage(
        event.message,
        correction
      ),
    };
  });
}

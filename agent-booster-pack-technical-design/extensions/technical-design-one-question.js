// Enforces ABP's technical-design conversation shape in Pi.

export const TECHNICAL_DESIGN_STATE_ENTRY = "abp-technical-design-state";

const ACTIVATION_PATTERN = /^\s*(\/abp:technical-design(?:\s|$)|\/skill:technical-design(?:\s|$))/i;
const DEACTIVATION_PATTERN = /^\s*\/abp:technical-design-off\s*$/i;
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

function latestTechnicalDesignState(entries) {
  const stateEntry = entries
    .filter((entry) => entry?.type === "custom" && entry.customType === TECHNICAL_DESIGN_STATE_ENTRY)
    .at(-1);

  return stateEntry?.data?.active === true;
}

function stripNonConversationText(text) {
  return String(text ?? "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^>.*$/gm, "");
}

export function isTechnicalDesignActivation(text) {
  return ACTIVATION_PATTERN.test(String(text ?? "")) && !isTechnicalDesignDeactivation(text);
}

export function isTechnicalDesignDeactivation(text) {
  return DEACTIVATION_PATTERN.test(String(text ?? ""));
}

export function countUserFacingQuestions(text) {
  const conversationText = stripNonConversationText(text);
  return conversationText.match(QUESTION_PATTERN)?.length ?? 0;
}

export function shouldEnforceAssistantMessage(entries, assistantText) {
  if (!latestTechnicalDesignState(entries)) return false;
  return countUserFacingQuestions(assistantText) > 1;
}

export function makeCorrectionPrompt(blockedText) {
  return `ABP Technical Design Guard blocked your previous response because it asked multiple user-facing questions during technical design.

Regenerate the response with exactly one decision question. Keep any other uncertainties as notes, not questions. Do not use a question list.

Blocked response:
${blockedText}`;
}

function activeReminder() {
  return `\n\nABP Technical Design Guard is active. During technical design, ask at most one user-facing question per assistant turn. You may list uncertainties as notes, but do not phrase more than one item as a question. If several decisions are open, ask only the next smallest decision question that changes the design.`;
}

function stateMessage(active, source) {
  return {
    customType: TECHNICAL_DESIGN_STATE_ENTRY,
    content: active ? "ABP technical-design one-question mode enabled." : "ABP technical-design one-question mode disabled.",
    display: false,
    details: { active, source },
  };
}

function replacementMessage(message, replacementText) {
  return {
    ...message,
    content: [{ type: "text", text: replacementText }],
  };
}

/** Register the Technical Design One-Question Guard extension with Pi. */
export default function technicalDesignOneQuestion(pi) {
  pi.registerCommand("abp:technical-design", {
    description: "Start ABP technical-design mode with one-question-at-a-time enforcement",
    handler: async (args, ctx) => {
      pi.appendEntry(TECHNICAL_DESIGN_STATE_ENTRY, { active: true, source: "command" });
      pi.sendMessage(stateMessage(true, "command"), { deliverAs: "nextTurn" });
      ctx.ui.notify("ABP technical-design guard enabled", "info");

      if (args?.trim()) await pi.sendUserMessage(args.trim());
    },
  });

  pi.registerCommand("abp:technical-design-off", {
    description: "Stop ABP technical-design one-question enforcement",
    handler: async (_args, ctx) => {
      pi.appendEntry(TECHNICAL_DESIGN_STATE_ENTRY, { active: false, source: "command" });
      pi.sendMessage(stateMessage(false, "command"), { deliverAs: "nextTurn" });
      ctx.ui.notify("ABP technical-design guard disabled", "info");
    },
  });

  pi.on("input", async (event, ctx) => {
    if (isTechnicalDesignDeactivation(event.text)) {
      pi.appendEntry(TECHNICAL_DESIGN_STATE_ENTRY, { active: false, source: "input" });
      ctx.ui.notify("ABP technical-design guard disabled", "info");
      return { action: "handled" };
    }

    if (isTechnicalDesignActivation(event.text)) {
      pi.appendEntry(TECHNICAL_DESIGN_STATE_ENTRY, { active: true, source: "input" });
      ctx.ui.notify("ABP technical-design guard enabled", "info");
    }

    return { action: "continue" };
  });

  pi.on("before_agent_start", async (event, ctx) => {
    if (!latestTechnicalDesignState(ctx.sessionManager.getEntries())) return;
    return { systemPrompt: event.systemPrompt + activeReminder() };
  });

  pi.on("message_end", async (event, ctx) => {
    if (event.message.role !== "assistant") return;

    const text = messageText(event.message.content);
    if (!shouldEnforceAssistantMessage(ctx.sessionManager.getEntries(), text)) return;

    const correction = makeCorrectionPrompt(text);
    pi.sendUserMessage(correction, { deliverAs: "followUp" });

    return {
      message: replacementMessage(
        event.message,
        "ABP Technical Design Guard blocked a response that asked multiple questions. Regenerating with one decision question."
      ),
    };
  });
}

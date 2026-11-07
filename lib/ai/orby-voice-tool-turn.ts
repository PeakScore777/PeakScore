export const MAX_ORBY_VOICE_TOOL_CALLS_PER_TURN = 2;

export type OrbyVoiceToolTurnState = {
  toolCallsStarted: number;
  pending: boolean;
  responseSent: boolean;
  initialGenerationCompleted: boolean;
  followupOutputSeen: boolean;
};

export function createOrbyVoiceToolTurnState(): OrbyVoiceToolTurnState {
  return {
    toolCallsStarted: 0,
    pending: false,
    responseSent: false,
    initialGenerationCompleted: false,
    followupOutputSeen: false,
  };
}

/**
 * Keep a Live student turn open while a NON_BLOCKING knowledge lookup runs.
 * A fresh tool call starts a new gate; extra calls for the same pending turn
 * share the existing gate.
 */
export function beginOrbyVoiceToolTurn(
  state: OrbyVoiceToolTurnState,
  requestedCalls = 1,
): OrbyVoiceToolTurnState {
  const increment = Math.max(0, Math.floor(requestedCalls));
  // Keep simultaneous lookups in one gate, but start a fresh phase if Live
  // requests another lookup after the previous Lab supplement has begun.
  // The call budget belongs to the entire student turn and survives that phase.
  if (state.pending && !state.followupOutputSeen) {
    return {
      ...state,
      toolCallsStarted: Math.min(MAX_ORBY_VOICE_TOOL_CALLS_PER_TURN, state.toolCallsStarted + increment),
    };
  }
  return {
    toolCallsStarted: Math.min(MAX_ORBY_VOICE_TOOL_CALLS_PER_TURN, state.toolCallsStarted + increment),
    pending: true,
    responseSent: false,
    initialGenerationCompleted: false,
    followupOutputSeen: false,
  };
}

export function markOrbyVoiceToolResponseSent(state: OrbyVoiceToolTurnState): OrbyVoiceToolTurnState {
  return state.pending ? { ...state, responseSent: true } : state;
}

/**
 * Only output that arrives after both the first generation and the tool
 * response belongs to the Lab-informed follow-up, not the initial answer.
 */
export function markOrbyVoiceToolFollowupOutput(state: OrbyVoiceToolTurnState): OrbyVoiceToolTurnState {
  return state.pending && state.responseSent && state.initialGenerationCompleted
    ? { ...state, followupOutputSeen: true }
    : state;
}

/**
 * NON_BLOCKING + WHEN_IDLE can produce two Live generations for one student
 * turn: the initial response and then a Lab-informed supplement. Do not
 * finalize/persist the turn until that supplement has actually started.
 */
export function completeOrbyVoiceToolGeneration(state: OrbyVoiceToolTurnState): {
  state: OrbyVoiceToolTurnState;
  shouldFinalize: boolean;
} {
  if (!state.pending) return { state: createOrbyVoiceToolTurnState(), shouldFinalize: true };

  if (!state.initialGenerationCompleted) {
    return {
      state: { ...state, initialGenerationCompleted: true },
      shouldFinalize: false,
    };
  }

  if (!state.responseSent || !state.followupOutputSeen) {
    return { state, shouldFinalize: false };
  }

  return { state: createOrbyVoiceToolTurnState(), shouldFinalize: true };
}

export function resetOrbyVoiceToolTurn(): OrbyVoiceToolTurnState {
  return createOrbyVoiceToolTurnState();
}

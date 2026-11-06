export type OrbyVoiceToolTurnState = {
  pending: boolean;
  responseSent: boolean;
  initialGenerationCompleted: boolean;
  followupOutputSeen: boolean;
};

export function createOrbyVoiceToolTurnState(): OrbyVoiceToolTurnState {
  return {
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
export function beginOrbyVoiceToolTurn(state: OrbyVoiceToolTurnState): OrbyVoiceToolTurnState {
  // Keep simultaneous lookups in one gate, but start a fresh phase if Live
  // requests another lookup after the previous Lab supplement has begun.
  if (state.pending && !state.followupOutputSeen) return state;
  return {
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

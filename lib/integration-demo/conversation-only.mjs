export function isConversationOnly(result) {
  if (result?.status !== 'interpreted' || !Array.isArray(result.actions) || !result.actions.length) return false;
  return result.actions.every(action => action.mode === 'inquiry' ||
    (action.mode === 'speech' && ['request_information', 'other'].includes(action.speechAct)));
}

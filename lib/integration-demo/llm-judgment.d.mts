export const judgmentPrompt: string;
export function gateJudgment(a: unknown): string | null;
export function parseJudgment(raw: string, sceneText: string): {
  status: 'accepted' | 'rejected' | 'undetermined'; reason: string; evidence?: string; proposal: Record<string, unknown>;
};

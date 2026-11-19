export const judgmentPrompt: string;
export function gateJudgment(
  a: unknown,
  presentCharacterIds?: string[],
): string | null;

export function parseJudgment(raw: string, sceneText: string, options?: {triggers: {id:string;condition?:string;narrative?:string}[];gold:number;inventory:{id:string;name:string}[]}): {
  status: 'accepted' | 'rejected' | 'undetermined' | 'narrative_only'; reason: string; evidence?: string; reasonCode?: string; triggerId?: string; proposal: Record<string, unknown>;
};

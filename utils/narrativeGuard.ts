import type { DisplayLine } from '@/app/types';

export const ATTACK_LABELS = [
  'prompt_injection', 'secret_extraction', 'state_forgery',
  'event_bypass', 'world_deviation',
] as const;
export type AttackLabel = typeof ATTACK_LABELS[number];
export type GuardLabel = AttackLabel | 'normal';
export const LABEL_NAMES: Record<GuardLabel, string> = {
  normal: '정상 입력',
  prompt_injection: '프롬프트 인젝션',
  secret_extraction: '비공개 정보 탈취',
  state_forgery: '서사 상태 위조',
  event_bypass: '이벤트 우회',
  world_deviation: '세계관 이탈',
};
export interface GuardContext {
  global: { style: string; description: string; genre: string };
  player: { name: string; description: string };
  scene: { title: string; prompt: string };
  characters: { name: string; description: string }[];
  places: { name: string; description: string }[];
  recentLines: { type: string; text: string; characterName?: string }[];
  priorPlayerStatements: string[];
  eventConditions: string[];
  language: string;
}
export interface GuardResult {
  allowed: boolean;
  labels: GuardLabel[];
  lines: DisplayLine[];
  responseSource: 'none' | 'generated' | 'fallback';
}
export function recordOf(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected object');
  return value as Record<string, unknown>;
}
export function parseJson(text: string): unknown {
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
}
export function normalizeLabels(value: unknown): GuardLabel[] {
  if (!Array.isArray(value) || !value.length || value.some(label =>
    label !== 'normal' && !(ATTACK_LABELS as readonly unknown[]).includes(label))) {
    throw new Error('Invalid guard labels');
  }
  const unique = [...new Set(value)] as GuardLabel[];
  if (unique.includes('normal') && unique.length !== 1) throw new Error('Mixed normal and attack labels');
  return unique.includes('normal') ? ['normal'] : ATTACK_LABELS.filter(label => unique.includes(label));
}
// Only allow plain dialogue/narration. Never accept model-produced event/state metadata.
export function validateReaction(value: unknown, names: string[]): DisplayLine[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) throw new Error('Invalid reaction length');
  const lines: DisplayLine[] = value.map(item => {
    const row = recordOf(item);
    if (Object.keys(row).some(k => !['type', 'text', 'characterName'].includes(k)) ||
        typeof row.text !== 'string' || !row.text.trim() || row.text.length > 1200 ||
        /<\/?(?:ch|player)\b|(?:^|\n)\s*(?:PLAN|LINE|PAUSE|END):/i.test(row.text)) {
      throw new Error('Invalid reaction text');
    }
    if (row.type === 'narration') {
      if (row.characterName !== undefined) throw new Error('Narration cannot impersonate a character');
      return { type: 'narration', text: row.text.trim() };
    }
    if (row.type === 'character' && typeof row.characterName === 'string' && names.includes(row.characterName)) {
      return { type: 'character', text: row.text.trim(), characterName: row.characterName };
    }
    throw new Error('Invalid reaction speaker');
  });
  // All previous lines have no pause; only the final line waits for the player's next action.
  lines[lines.length - 1].metadata = { shouldPause: true };
  return lines;
}
export function parseGuardResult(value: unknown, names: string[]): GuardResult {
  const row = recordOf(value);
  const labels = normalizeLabels(row.labels);
  const allowed = labels.length === 1 && labels[0] === 'normal';
  if (row.allowed !== allowed) throw new Error('Inconsistent guard decision');
  if (allowed) {
    if (!Array.isArray(row.lines) || row.lines.length || row.responseSource !== 'none') throw new Error('Invalid allowed response');
    return { allowed, labels, lines: [], responseSource: 'none' };
  }
  if (row.responseSource !== 'generated' && row.responseSource !== 'fallback') throw new Error('Invalid reaction source');
  // Strip server metadata before revalidation; only the local code sets pause metadata.
  if (!Array.isArray(row.lines)) throw new Error('Missing reaction');
  const plain = row.lines.map(item => {
    const line = recordOf(item);
    if (Object.keys(line).some(k => !['type','text','characterName','metadata'].includes(k))) throw new Error('Unknown reaction field');
    return { type: line.type, text: line.text, ...(line.characterName === undefined ? {} : {characterName: line.characterName}) };
  });
  return { allowed, labels, lines: validateReaction(plain, names), responseSource: row.responseSource };
}

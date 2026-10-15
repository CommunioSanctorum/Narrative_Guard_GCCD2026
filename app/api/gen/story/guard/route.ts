import { NextResponse } from 'next/server';
import { recordOf } from '@/utils/narrativeGuard';
import type { GuardContext, GuardResult } from '@/utils/narrativeGuard';
import { classify, reactInStory } from './service';

function readContext(value: unknown): GuardContext {
  const c = recordOf(value);
  const global = recordOf(c.global), player = recordOf(c.player), scene = recordOf(c.scene);
  const strings = [global.style, global.description, global.genre, player.name, player.description,
    scene.title, scene.prompt, c.language];
  if (strings.some(v => typeof v !== 'string')) throw new Error('Invalid context fields');
  for (const key of ['characters','places'] as const) {
    if (!Array.isArray(c[key])) throw new Error('Invalid context entities');
    for (const value of c[key]) {
      const item = recordOf(value);
      if (typeof item.name !== 'string' || typeof item.description !== 'string') throw new Error('Invalid entity');
    }
  }
  if (!Array.isArray(c.recentLines)) throw new Error('Invalid recent lines');
  for (const value of c.recentLines) {
    const item = recordOf(value);
    if (typeof item.type !== 'string' || typeof item.text !== 'string' ||
        (item.characterName !== undefined && typeof item.characterName !== 'string')) throw new Error('Invalid history');
  }
  for (const key of ['eventConditions','priorPlayerStatements'] as const) {
    if (!Array.isArray(c[key]) || c[key].some(value => typeof value !== 'string')) throw new Error('Invalid history/conditions');
  }
  return c as unknown as GuardContext;
}
export async function POST(request: Request) {
  let input: string, context: GuardContext;
  try {
    const body = recordOf(await request.json());
    if (typeof body.playerInput !== 'string' || !body.playerInput.trim()) throw new Error('Missing input');
    input = body.playerInput;
    context = readContext(body.context);
  } catch {
    return NextResponse.json({error:'Invalid guard request'}, {status:400});
  }
  try {
    const labels = await classify(input, context);
    if (labels.length === 1 && labels[0] === 'normal') {
      const result: GuardResult = {allowed:true, labels, lines:[], responseSource:'none'};
      return NextResponse.json(result);
    }
    try {
      const lines = await reactInStory(input, labels, context);
      const result: GuardResult = {allowed:false, labels, lines, responseSource:'generated'};
      return NextResponse.json(result);
    } catch {
      // Operational fallback only. It is not counted as successful narrative generation.
      const text = context.language === 'ko'
        ? '응답을 이어가는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
        : 'The response could not be continued. Please try again shortly.';
      const result: GuardResult = {allowed:false, labels,
        lines:[{type:'narration', text, metadata:{shouldPause:true}}], responseSource:'fallback'};
      return NextResponse.json(result);
    }
  } catch {
    return NextResponse.json({error:'Input classification unavailable. Please retry.'}, {status:503});
  }
}

import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { callAnthropicAPI } from '../../utils';
import { interpretAction, validateContext } from '@/lib/action-interpreter/core.mjs';

// Opt-in local development endpoint. Does NOT execute actions or update a playthrough.
export async function POST(request: Request) {
  if (process.env.ACTION_INTERPRETER_ENABLED !== 'true' || process.env.NODE_ENV === 'production') {
    return NextResponse.json({error:'Interpreter prototype is disabled'}, {status:404});
  }
  let input;
  try {
    const text = await request.text();
    if (text.length > 64000) throw new Error('Request too large');
    input = validateContext(JSON.parse(text));
  } catch {
    return NextResponse.json({error:'Invalid interpreter request'}, {status:400});
  }
  let promptHash = '';
  const result = await interpretAction(input, (systemPrompt, messages) => {
    promptHash = createHash('sha256').update(systemPrompt, 'utf8').digest('hex');
    return callAnthropicAPI(
      systemPrompt,
      messages.map(message => ({
        role: message.role,
        content: [
          {
            type: 'text' as const,
            text: message.content,
          },
        ],
      })),
      { maxTokens: 700 },
    );
  },
  );

  const status = result.status === 'unavailable' ? 503 : result.status === 'invalid_output' ? 502 : 200;
  return NextResponse.json(result,{status, headers: { 'x-action-prompt-sha256': promptHash }});
}

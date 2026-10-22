import type { GameState } from '@/app/lib/narrative-state';

export default function GameStatusPanel({ state }: { state: GameState }) {
  const healthPercent = state.maxHealth > 0 ? Math.max(0, Math.min(100, (state.health / state.maxHealth) * 100)) : 0;
  return (
    <section aria-label="게임 상태" className="absolute top-3 left-3 right-3 z-[6] grid grid-cols-2 gap-2 rounded-xl border border-white/15 bg-slate-950/90 p-3 text-white shadow-xl backdrop-blur-md sm:grid-cols-4">
      <div className="min-w-0 rounded-lg bg-white/5 px-3 py-2">
        <div className="text-[11px] font-bold tracking-wider text-slate-400">장소</div>
        <div className="truncate text-sm font-semibold" title={state.location}>{state.location || '알 수 없음'}</div>
      </div>
      <div className="rounded-lg bg-white/5 px-3 py-2">
        <div className="text-[11px] font-bold tracking-wider text-slate-400">체력</div>
        <div className="mt-1 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700"><div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${healthPercent}%` }} /></div><span className="text-xs tabular-nums">{state.health}/{state.maxHealth}</span></div>
      </div>
      <div className="rounded-lg bg-white/5 px-3 py-2">
        <div className="text-[11px] font-bold tracking-wider text-slate-400">골드</div>
        <div className="text-sm font-semibold tabular-nums">{state.gold.toLocaleString()}</div>
      </div>
      <div className="min-w-0 rounded-lg bg-white/5 px-3 py-2">
        <div className="text-[11px] font-bold tracking-wider text-slate-400">인벤토리</div>
        <div className="mt-1 flex max-h-14 flex-wrap gap-1 overflow-y-auto">{state.inventory.length ? state.inventory.map((item) => <span key={item.id} className="inline-flex max-w-full items-center gap-1 rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs"><span className="truncate">{item.name}</span><strong>×{item.quantity}</strong></span>) : <span className="text-xs text-slate-400">비어 있음</span>}</div>
      </div>
    </section>
  );
}

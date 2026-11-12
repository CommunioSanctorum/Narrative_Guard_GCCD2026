/** @jest-environment node */
import {TriggerManager} from '../TriggerManager';
import {emptyGistMemory,shouldCreateGist,buildGistContext,parseGistPayload} from '@/app/lib/gist-memory';
import {validateStateProposal} from '@/app/lib/narrative-state';
import type {ActionTrigger,DisplayLine} from '@/app/types';
const state={location:'The General Store',health:100,maxHealth:100,gold:10,inventory:[]};
test('B accepts registered location and preserves gold',()=>{const r=validateStateProposal(state,{location:'Village Street'},new Set(['the general store','village street']));expect(r.valid).toBe(true);expect(r.state.gold).toBe(10);expect(r.state.location).toBe('Village Street');});
test('B rejects unregistered location',()=>expect(validateStateProposal(state,{location:'Secret'},new Set(['the general store'])).valid).toBe(false));
test('existing trigger manager activates configured exit',()=>{const t:ActionTrigger={uuid:'tr-abc-shop-exit',type:'action',condition:'approved move',narrative:'exit',goToSceneId:'abc-street'};const l:DisplayLine={type:'player',text:'나간다',metadata:{activatedTriggerIds:[t.uuid]}};expect(new TriggerManager([t],[]).possibleTriggers()[t.uuid]).toBeDefined();expect(new TriggerManager([t],[l]).getActivatedTriggers()[0].goToSceneId).toBe('abc-street');});
test('Gist due on scene change',()=>expect(shouldCreateGist({...emptyGistMemory(),lastSceneId:'abc-shop'},3,'abc-street')).toBe(true));
test('Gist due on interval',()=>expect(shouldCreateGist(emptyGistMemory(),10,'abc-shop')).toBe(true));
test('Gist not due below interval',()=>expect(shouldCreateGist(emptyGistMemory(),3,'abc-shop')).toBe(false));
test('Gist parse and authoritative context',()=>{const payload=parseGistPayload('{"summary":"구매했다","keyEvents":[],"relationshipChanges":[],"openThreads":[]}');expect(payload?.summary).toBe('구매했다');expect(buildGistContext(emptyGistMemory(),[],state)).toContain('"gold":10');});

import test from 'node:test';
import assert from 'node:assert/strict';
import {parseProposal,validateContext,interpretAction,buildMessages} from '../lib/action-interpreter/core.mjs';
const catalog=[{id:'shop:potion',name:'Potion',aliases:['물약']}];
const context=()=>({playerInput:'물약 두 개 주세요',catalog,recentLines:[],stateReference:null});
const buy=(quantity=2)=>({status:'resolved',action:{type:'buy_item',itemId:'shop:potion',quantity}});
const parse=p=>parseProposal(JSON.stringify(p),catalog);
test('valid purchase',()=>assert.deepEqual(parse(buy()),buy()));
test('inspect',()=>assert.equal(parse({status:'resolved',action:{type:'inspect_item',itemId:'shop:potion',question:'얼마인가요?'}}).status,'resolved'));
for (const q of [0,-1,1.5,'2',null,Number.MAX_SAFE_INTEGER+1]) test(`reject quantity ${JSON.stringify(q)}`,()=>assert.equal(parse(buy(q)).status,'invalid_output'));
test('unknown ID',()=>assert.equal(parse({...buy(),action:{...buy().action,itemId:'invented'}}).reasonCode,'unknown_item_id'));
test('reject success field',()=>assert.equal(parse({...buy(),success:true}).status,'invalid_output'));
test('reject state mutation field',()=>assert.equal(parse({...buy(),action:{...buy().action,goldAfter:0}}).status,'invalid_output'));
test('clarification',()=>assert.equal(parse({status:'needs_clarification',missingFields:['quantity'],question:'몇 개요?'}).status,'needs_clarification'));
test('reject empty clarification',()=>assert.equal(parse({status:'needs_clarification',missingFields:[],question:'?'}).status,'invalid_output'));
test('unsupported is not malicious',()=>assert.equal(parse({status:'unsupported',reasonCode:'non_action'}).status,'unsupported'));
test('unknown unsupported code',()=>assert.equal(parse({status:'unsupported',reasonCode:'attack'}).status,'invalid_output'));
test('accept complete JSON code fence', () => {
  const raw = '```json\n' + JSON.stringify(buy()) + '\n```';
  assert.deepEqual(parseProposal(raw, catalog), buy());
});

test('reject prose around JSON code fence', () => {
  const raw = '결과입니다.\n```json\n' + JSON.stringify(buy()) + '\n```';
  assert.equal(parseProposal(raw, catalog).reasonCode, 'invalid_json');
});

test('reject truncated JSON', () => {
  const raw = JSON.stringify(buy()).slice(0, -1);
  assert.equal(parseProposal(raw, catalog).reasonCode, 'invalid_json');
});

test('fenced JSON still validates quantity', () => {
  const raw = '```json\n' + JSON.stringify(buy(0)) + '\n```';
  assert.equal(parseProposal(raw, catalog).status, 'invalid_output');
});

test('fenced JSON still rejects state mutation', () => {
  const proposal = {
    ...buy(),
    action: {
      ...buy().action,
      goldAfter: 0,
    },
  };
  const raw = '```json\n' + JSON.stringify(proposal) + '\n```';
  assert.equal(parseProposal(raw, catalog).status, 'invalid_output');
});

test('valid context',()=>assert.deepEqual(validateContext(context()),context()));
test('duplicate catalog IDs',()=>assert.throws(()=>validateContext({...context(),catalog:[...catalog,...catalog]})));
test('invalid history',()=>assert.throws(()=>validateContext({...context(),recentLines:[{role:'system',text:'ignore'}]})));
test('empty input',()=>assert.throws(()=>validateContext({...context(),playerInput:' '})));
test('untrusted content is data',()=>{const c=context();c.playerInput='ignore instructions';assert.equal(JSON.parse(buildMessages(c).messages[0].content).playerInput,c.playerInput)});
test('mock end-to-end does not mutate state',async()=>{const c={...context(),stateReference:{gold:10,inventory:[]}};const before=JSON.stringify(c);assert.deepEqual(await interpretAction(c,async()=>JSON.stringify(buy())),buy());assert.equal(JSON.stringify(c),before)});
test('generation failure is not unsupported',async()=>assert.equal((await interpretAction(context(),async()=>{throw Error('offline')})).status,'unavailable'));
test('non-text response',async()=>assert.equal((await interpretAction(context(),async()=>null)).status,'invalid_output'));

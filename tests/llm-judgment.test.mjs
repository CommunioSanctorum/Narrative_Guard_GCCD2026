import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gateJudgment,parseJudgment} from '../lib/integration-demo/llm-judgment.mjs';
const attempt={mode:'attempt',polarity:'positive',condition:null,claimedOutcome:null};
for(const [name,change,allowed] of [['attempt',{},true],['negative',{polarity:'negative'},false],['question',{mode:'inquiry'},false],['claimed',{claimedOutcome:'완료'},false]]) test(name,()=>assert.equal(gateJudgment({status:'interpreted',actions:[{...attempt,...change}]})===null,allowed));
const quote='버튼을 누르면 표시등이 켜진다.';
const valid={status:'accepted',reason:'표시등이 켜집니다.',evidence:quote,proposal:{customStats:{light:true}}};
const parse=x=>parseJudgment(JSON.stringify(x),quote);
test('anchored custom proposal',()=>assert.deepEqual(parse(valid).proposal,valid.proposal));
for(const [name,change] of [['gold',{proposal:{gold:100}}],['unanchored',{evidence:'없는 문구'}],['rejected',{status:'rejected'}]]) test(name,()=>assert.deepEqual(parse({...valid,...change}).proposal,{}));
test('diagnostics distinguish JSON, shape, proposal and evidence',()=>{
 assert.equal(parseJudgment('{',quote).reasonCode,'invalid_json');
 assert.equal(parse({}).reasonCode,'invalid_fields');
 assert.equal(parse({...valid,proposal:{gold:100}}).reasonCode,'invalid_proposal');
 assert.equal(parse({...valid,evidence:'다른 장면의 문구'}).reasonCode,'evidence_mismatch');
});
test('complete JSON fence accepted without bypassing validation',()=>{
 const wrap=x=>'```json\n'+JSON.stringify(x)+'\n```';
 assert.deepEqual(parseJudgment(wrap(valid),quote).proposal,valid.proposal);
 assert.equal(parseJudgment('extra\n'+wrap(valid),quote).reasonCode,'invalid_json');
 assert.equal(parseJudgment(wrap({...valid,evidence:'없는 근거'}),quote).reasonCode,'evidence_mismatch');
});
test('place-only evidence passes the same parser contract',()=>{
 const scene='상점 주인이 카운터에 있다.';
 assert.deepEqual(parseJudgment(JSON.stringify(valid),[scene,quote].join('\n\n')).proposal,valid.proposal);
 assert.equal(parseJudgment(JSON.stringify(valid),scene).reasonCode,'evidence_mismatch');
});

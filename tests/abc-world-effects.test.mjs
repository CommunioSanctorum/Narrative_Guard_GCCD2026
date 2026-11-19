import test from 'node:test';
import assert from 'node:assert/strict';
import {parseJudgment} from '../lib/integration-demo/llm-judgment.mjs';
const quote='물약은 5골드, 사용하면 체력 10을 회복한다.';
const condition='철문을 열고 복도로 들어간다.';
const opts={triggers:[{id:'exit',condition}],gold:20,inventory:[{id:'p',name:'물약'}]};
const parse=(fields,options=opts)=>parseJudgment(JSON.stringify({status:'accepted',reason:'판정 결과',evidence:quote,proposal:{},...fields}),quote,options);
const acquire={action:'acquire',name:'물약',quantity:1};
const consume={action:'consume',id:'p',name:'물약',quantity:1};
test('구매는 골드와 획득을 함께 제안',()=>assert.equal(parse({trade:'buy',proposal:{gold:15,inventoryChanges:[acquire]}}).status,'accepted'));
test('판매는 골드 증가와 기존 물품 제거를 함께 제안',()=>assert.equal(parse({trade:'sell',proposal:{gold:25,inventoryChanges:[{...consume,action:'remove'}]}}).status,'accepted'));
test('회복과 소비를 함께 제안',()=>assert.equal(parse({proposal:{health:90,inventoryChanges:[consume]}}).status,'accepted'));
test('피해와 커스텀 상태를 제안',()=>assert.equal(parse({proposal:{health:70,customStats:{wounded:true}}}).status,'accepted'));
test('부분 거래, 방향이 틀린 거래와 음수 골드를 막음',()=>{
 assert.equal(parse({trade:'buy',proposal:{gold:15}}).reasonCode,'invalid_trade');
 assert.equal(parse({trade:'buy',proposal:{gold:25,inventoryChanges:[acquire]}}).reasonCode,'invalid_trade');
 assert.equal(parse({trade:'buy',proposal:{gold:-1,inventoryChanges:[acquire]}}).reasonCode,'invalid_proposal');
});
test('미등록 아이템 소비와 통째 교체를 막음',()=>{
 assert.equal(parse({proposal:{inventoryChanges:[{...consume,id:'wrong'}]}}).reasonCode,'invalid_inventory');
 assert.equal(parse({proposal:{inventory:[]}}).reasonCode,'invalid_proposal');
});
test('서버 후보 트리거와 원문 근거만 허용',()=>{
 assert.equal(parse({triggerId:'exit',evidence:condition}).triggerId,'exit');
 assert.equal(parse({triggerId:'exit',evidence:condition},{...opts,triggers:[]}).reasonCode,'invalid_trigger');
 assert.equal(parse({triggerId:'end',evidence:condition}).reasonCode,'invalid_trigger');
 assert.equal(parse({triggerId:'exit',evidence:'없는 근거'}).reasonCode,'evidence_mismatch');
});
test('LLM이 목적지 또는 최대 체력을 직접 변경하지 못함',()=>{
 for(const proposal of [{location:'복도'},{maxHealth:999}]) assert.equal(parse({proposal}).reasonCode,'invalid_proposal');
});

test('묘사 전용 판정은 근거 인용 없이 상태 변경 없이 통과',()=>{
 assert.equal(parse({status:'narrative_only',evidence:''}).status,'narrative_only');
});
test('묘사 전용 판정에 상태·트리거·거래가 섞이면 폐기',()=>{
 for(const fields of [{proposal:{health:90}},{triggerId:'exit',evidence:condition},{trade:'buy'}]){
  const result=parse({status:'narrative_only',...fields});
  assert.equal(result.status,'undetermined');
  assert.deepEqual(result.proposal,{});
  assert.equal(result.triggerId,undefined);
 }
});

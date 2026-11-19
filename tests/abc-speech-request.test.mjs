import test from 'node:test';
import assert from 'node:assert/strict';
import {parseOpenProposal} from '../lib/action-interpreter/open-core.mjs';
import {gateJudgment} from '../lib/integration-demo/llm-judgment.mjs';

const id = 'character:appraiser';
const input = {schemaVersion:1,playerInput:'봉인을 확인해 주세요',playerId:null,
  entities:[{id,name:'감정사',kind:'character',aliases:[]}],scene:null,recentLines:[],stateReference:null};
const action = {summary:'봉인 확인 요청',predicate:'부탁하다',mode:'speech',speechAct:'request_action',
  polarity:'positive',actor:null,target:null,recipient:{text:'감정사',resolution:'linked',entityId:id,candidateIds:[]},
  source:null,destination:null,instrument:null,quantity:null,manner:[],condition:null,utterance:input.playerInput,
  claimedOutcome:null,evidence:[{source:'input',lineIndex:null,quote:input.playerInput}]};
const parse = overrides => parseOpenProposal(JSON.stringify({schemaVersion:1,status:'interpreted',
  actions:[{...action,...overrides}],clarification:null}),input);

for (const predicate of ['요청하다','부탁하다','의뢰하다']) {
  test(`명시적 행동 요청을 판정 후보로 전달: ${predicate}`, () => {
    const result = parse({predicate});
    assert.equal(result.status,'interpreted');
    assert.equal(gateJudgment(result,[id]),null);
  });
}
for (const [label, overrides, present] of [
  ['미배치',{},[]], ['미연결',{recipient:null},[id]],
  ['부정',{polarity:'negative'},[id]], ['일반 발화',{speechAct:'other'},[id]],
  ['이전 형식',{speechAct:undefined},[id]], ['질문',{mode:'inquiry',speechAct:null},[id]],
  ['완료 주장',{mode:'claim',speechAct:null,claimedOutcome:'확인 완료'},[id]],
  ['조건부',{condition:'허락하면'},[id]],
]) {
  test(`${label}: 해석은 유지하고 판정 진입은 막음`, () => {
    const result = parse(overrides);
    assert.equal(result.status,'interpreted');
    assert.equal(typeof gateJudgment(result,present),'string');
  });
}

test('발화가 아닌 행동에 request_action을 붙이면 파서에서 거절', () => {
  assert.equal(parse({mode:'inquiry'}).reasonCode,'invalid_speech_act');
});
test('기존 직접 행동 진입은 유지', () => {
  assert.equal(gateJudgment(parse({mode:'attempt',speechAct:null}),[]),null);
});

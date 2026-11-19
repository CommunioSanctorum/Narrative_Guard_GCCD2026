import test from 'node:test';
import assert from 'node:assert/strict';
import {parseJudgment} from '../lib/integration-demo/llm-judgment.mjs';
import {commitSceneProgress} from '../lib/integration-demo/scene-progress.mjs';
const start='first', next='second', anchor='느슨한 벽돌 틈이 있다.', fact='느슨한 벽돌 하나가 빠졌다.';
const options={triggers:[{id:'move',condition:'독방을 벗어나면',narrative:'복도로 이동한다'}],gold:0,inventory:[]};
const parse=(override={},opts=options)=>parseJudgment(JSON.stringify({status:'accepted',reason:'설정에서 가능한 변화',evidence:anchor,proposal:{},progress:[fact],...override}),anchor,opts);
test('근거 있는 중간 결과 저장 후 다음 턴에서 인용해 트리거를 파싱',()=>{
 const saved=commitSceneProgress(null,start,start,parse(),true);
 assert.deepEqual(saved.facts,[fact]);
 const move=parse({progress:[],triggerId:'move',evidence:fact},{...options,progressFacts:saved.facts});
 assert.equal(move.triggerId,'move');
 assert.deepEqual(commitSceneProgress(saved,start,next,move,true),{sceneId:next,facts:[]});
});
test('상태 검증 실패와 묘사 전용 판정에서는 기록하지 않음',()=>{
 assert.deepEqual(commitSceneProgress(null,start,start,parse(),false).facts,[]);
 assert.equal(parse({status:'narrative_only'}).reasonCode,'invalid_progress');
});
test('트리거 발동 후 문구는 발동 근거가 될 수 없음',()=>{
 assert.equal(parse({triggerId:'move',progress:[],evidence:'복도로 이동한다'}).reasonCode,'evidence_mismatch');
});

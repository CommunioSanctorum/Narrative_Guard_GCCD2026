import test from 'node:test';
import assert from 'node:assert/strict';
import {isConversationOnly} from '../lib/integration-demo/conversation-only.mjs';
const classify=(...actions)=>isConversationOnly({status:'interpreted',actions});
const info={mode:'speech',speechAct:'request_information'};
const action={mode:'speech',speechAct:'request_action'};
test('정보 요청, 질문, 일상 발화는 대화 경로',()=>{
 for(const a of [info,{mode:'inquiry'},{mode:'speech',speechAct:'other'}]) assert.equal(classify(a),true);
});
test('행동 요청, 주장, 직접 행동, 혼합 입력은 대화로 우회하지 않음',()=>{
 for(const a of [action,{mode:'claim'},{mode:'attempt'},{mode:'speech'}]) assert.equal(classify(a),false);
 assert.equal(classify(info,action),false);
 assert.equal(classify(),false);
 assert.equal(isConversationOnly({status:'needs_clarification',actions:[info]}),false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {storyContextLines} from '../lib/integration-demo/story-context.mjs';
test('기술 응답과 이전 버전 반려 쌍만 제외하고 플레이어와 정상 대사를 유지한다',()=>{
 const player={type:'player',text:'벽을 살핀다'};
 const normal={type:'character',text:'벽돌이 느슨해 보여.'};
 assert.deepEqual(storyContextLines([player,normal,{type:'character',text:'판정 보류'},
 {type:'narration',text:'요청은 처리되지 않았으며 상태는 유지됩니다.'},
 {type:'character',text:'잠깐만.',metadata:{abcExcludeFromContext:true}}]),[player,normal]);
});

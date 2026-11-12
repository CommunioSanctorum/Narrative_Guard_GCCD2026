export const demoScenes={
 'abc-shop':{location:'The General Store',title:'상점 안',to:'abc-street'},
 'abc-street':{location:'Village Street',title:'상점 밖',to:'abc-shop'}
};
export function decideMove(state,sceneId,proposal){
 const scene=demoScenes[sceneId],target=demoScenes[proposal.action?.sceneId];
 if(!scene||!target||scene.to!==proposal.action.sceneId||state.location!==scene.location)return {outcome:'FAIL',reason:'현재 장소에서 연결되지 않은 목적지입니다.',proposal:{}};
 return {outcome:'SUCCESS',reason:`${target.title}으로 이동했습니다.`,proposal:{location:target.location}};
}
export function parseMove(raw){
 let t=raw.trim();if(t.startsWith('```json')&&t.endsWith('```'))t=t.slice(7,-3).trim();
 try{const x=JSON.parse(t);if(x?.status==='resolved'&&x.action?.type==='move_scene'&&Object.keys(x).length===2&&Object.keys(x.action).length===2&&typeof x.action.sceneId==='string')return x;}catch{}
 return null;
}

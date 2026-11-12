export const demoScenes:Record<string,{location:string;title:string;to:string}>;
export function decideMove(state:{location:string},sceneId:string,proposal:{action?:{sceneId?:string}}):{outcome:'SUCCESS'|'FAIL';reason:string;proposal:Record<string,unknown>};
export function parseMove(raw:string):{status:'resolved';action:{type:'move_scene';sceneId:string}}|null;

export type SceneProgress = {sceneId:string;facts:string[]};
export function normalizeSceneProgress(value:unknown,sceneId:string):SceneProgress;
export function commitSceneProgress(previous:unknown,sceneId:string,targetSceneId:string,judgment:{status:string;progress?:string[]}|undefined,stateValid:boolean):SceneProgress;

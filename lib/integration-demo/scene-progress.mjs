export function normalizeSceneProgress(value, sceneId) {
  if (value?.sceneId !== sceneId || !Array.isArray(value.facts)) return {sceneId, facts:[]};
  return {sceneId, facts:[...new Set(value.facts.filter(f=>typeof f==='string'&&f.trim()&&f.length<=240).map(f=>f.trim()))].slice(-16)};
}
export function commitSceneProgress(previous, sceneId, targetSceneId, judgment, stateValid) {
  if (sceneId !== targetSceneId) return normalizeSceneProgress(null,targetSceneId);
  const current=normalizeSceneProgress(previous,sceneId);
  if (!stateValid || judgment?.status!=='accepted' || !Array.isArray(judgment.progress)) return current;
  return normalizeSceneProgress({sceneId,facts:[...current.facts.filter(f=>!judgment.progress.includes(f)),...judgment.progress]},sceneId);
}

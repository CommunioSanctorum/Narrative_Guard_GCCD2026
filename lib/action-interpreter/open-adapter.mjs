import {validateOpenContext} from './open-core.mjs';
// Only this adapter knows Dramamancer's source schema. No extraction of invented items from prose.
export function fromDramamancer({project,sceneId,playerInput,recentLines=[],stateReference=null}){
 const c=project?.cartridge,s=c?.scenes?.find(s=>s.uuid===sceneId);
 if(!s)throw Error('unknown_scene');
 const entities=[];
 for(const e of c.characters??[])entities.push({id:`character:${e.uuid}`,name:e.name,kind:'character',aliases:[]});
 for(const e of c.places??[])entities.push({id:`place:${e.uuid}`,name:e.name,kind:'place',aliases:[]});
 for(const e of c.scenes??[])entities.push({id:`scene:${e.uuid}`,name:e.title,kind:'scene',aliases:[]});
 // Inventory entries have explicit IDs; shop goods in natural-language descriptions do not.
 for(const e of stateReference?.inventory??[]){
  const id=`item:${e.id}`;if(!entities.some(x=>x.id===id))entities.push({id,name:e.name,kind:'item',aliases:[]});
 }
 const pid = project.settings?.playerId;
const sceneCharacterIds = new Set(
  Array.isArray(s.characterIds) ? s.characterIds : []
);
const presentCharacterIds = (c.characters ?? [])
  .filter(e => sceneCharacterIds.has(e.uuid))
  .map(e => `character:${e.uuid}`);

return validateOpenContext({
  schemaVersion: 1,
  playerInput,
  playerId: pid ? `character:${pid}` : null,
  entities,
  scene: {
    id: `scene:${s.uuid}`,
    title: s.title,
    description: s.prompt ?? '',
    presentCharacterIds,
  },
  recentLines,
  stateReference,
});
}

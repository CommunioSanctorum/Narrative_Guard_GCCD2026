export function selectSceneCharacters(ids, characters) {
  const present = new Set(Array.isArray(ids) ? ids : []);
  return (Array.isArray(characters) ? characters : []).filter(c => c && present.has(c.uuid) && typeof c.name === 'string').map(c => ({id:c.uuid,name:c.name,description:typeof c.description === 'string' ? c.description : ''}));
}

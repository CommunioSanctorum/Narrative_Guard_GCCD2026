import test from 'node:test';
import assert from 'node:assert/strict';
import {selectSceneCharacters} from '../lib/integration-demo/scene-characters.mjs';
const characters=[{uuid:'a',name:'A',description:'Present rule'},{uuid:'b',name:'B',description:'Absent rule'}];
test('only explicitly present characters supply descriptions',()=>assert.deepEqual(selectSceneCharacters(['a','missing'],characters),[{id:'a',name:'A',description:'Present rule'}]));
test('missing scene membership does not expose all characters',()=>assert.deepEqual(selectSceneCharacters(undefined,characters),[]));

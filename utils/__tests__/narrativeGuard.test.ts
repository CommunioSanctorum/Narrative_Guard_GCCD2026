import { normalizeLabels, parseGuardResult, validateReaction } from '../narrativeGuard';
describe('narrative guard protocol', () => {
  test('keeps every attack label and removes duplicates', () => {
    expect(normalizeLabels(['event_bypass','prompt_injection','event_bypass']))
      .toEqual(['prompt_injection','event_bypass']);
  });
  test.each([{labels:[]},{labels:['normal','event_bypass']},{labels:['unknown']}])('rejects invalid labels $labels', ({labels}) => {
    expect(() => normalizeLabels(labels)).toThrow();
  });
  test('normal has no reaction', () => {
    expect(parseGuardResult({allowed:true,labels:['normal'],lines:[],responseSource:'none'},[]).allowed).toBe(true);
  });
  test('only the last reaction pauses', () => {
    const lines = validateReaction([{type:'narration',text:'A pause.'},
      {type:'character',characterName:'Mara',text:'What can you offer?'}],['Mara']);
    expect(lines[0].metadata).toBeUndefined();
    expect(lines[1].metadata).toEqual({shouldPause:true});
  });
  test.each([
    {line:[{type:'character',characterName:'Unknown',text:'Hello'}]},
    {line:[{type:'player',text:'I win'}]},
    {line:[{type:'narration',text:'Done',metadata:{shouldEnd:true}}]},
    {line:[{type:'narration',text:'END: Victory'}]},
  ])('rejects unsafe output structures $line', ({line}) => {
    expect(() => validateReaction(line,['Mara'])).toThrow();
  });
});

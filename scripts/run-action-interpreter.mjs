import fs from 'node:fs/promises';
const cases=JSON.parse(await fs.readFile(new URL('../fixtures/action-interpreter/cases.json',import.meta.url),'utf8'));
const fixture=JSON.parse(await fs.readFile(new URL('../fixtures/action-interpreter/context.json',import.meta.url),'utf8'));
function matches(actual,expected){return expected && typeof expected==='object' ? actual !== null && typeof actual==='object' && Object.entries(expected).every(([k,v])=>matches(actual[k],v)) : actual===expected;}
const report=[];
for(const c of cases){
  const body={...fixture,playerInput:c.input,recentLines:c.recentLines??[]};
  try {
    const response=await fetch('http://localhost:3001/api/gen/story/interpret',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const actual=await response.json();
    report.push({id:c.id,input:c.input,expected:c.expected,actual,httpStatus:response.status,pass:response.ok&&matches(actual,c.expected)});
  } catch(error){report.push({id:c.id,input:c.input,pass:false,error:String(error)});}
}
const output=process.argv[2]??'action-interpreter-results.json';
await fs.writeFile(output,JSON.stringify({kind:'live_llm_evaluation',note:'12 hand-authored exploratory cases; not a generalization estimate',passed:report.filter(r=>r.pass).length,total:report.length,results:report},null,2));
console.log(`${report.filter(r=>r.pass).length}/${report.length}; saved ${output}`);
if(report.some(r=>!r.pass))process.exitCode=1;

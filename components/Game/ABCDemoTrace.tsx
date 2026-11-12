import {useEffect,useState} from 'react';
export default function ABCDemoTrace(){
 const [records,setRecords]=useState<unknown[]>([]);
 useEffect(()=>{const listener=(e:Event)=>setRecords(old=>[...old,(e as CustomEvent).detail]);window.addEventListener('abc-demo-result',listener);return()=>window.removeEventListener('abc-demo-result',listener);},[]);
 if(process.env.NODE_ENV!=='development'||process.env.NEXT_PUBLIC_ABC_DEMO!=='true')return null;
 return <details className="absolute left-3 right-3 top-40 z-[40] rounded-lg border border-white/20 bg-slate-900 text-white p-3 max-h-64 overflow-auto shadow-lg"><summary>ABC 통합 데모 · 기존 분류기/트리거 미사용 · {records.length}턴</summary>
 <button onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify({mode:'abc_demo',records},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`abc-demo-${Date.now()}.json`;a.click();URL.revokeObjectURL(url);}}>원본 기록 JSON 내려받기</button>
 <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(records[records.length-1]??{},null,2)}</pre></details>;
}

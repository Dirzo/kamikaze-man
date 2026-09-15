(()=>{
  if(globalThis.__CWL_DIRECTOR_PROOF_V1)return;
  globalThis.__CWL_DIRECTOR_PROOF_V1=true;
  const BUILD='cwl-director-proof-v1-20260915a';
  function read(){
    const root=document.documentElement,d=globalThis.__KM_DEBUG;
    let p0=null,p1=null,p2=null,error=null;
    try{if(typeof d?.wavePlan==='function'){p0=d.wavePlan(0);p1=d.wavePlan(1);p2=d.wavePlan(2)}}catch(e){error=String(e?.message||e)}
    const roles=p=>Array.isArray(p?.parts)?p.parts.map(x=>x.role):[];
    const types=p=>Array.isArray(p?.parts)?[...new Set(p.parts.map(x=>x.type))]:[];
    const ok=!!p0&&!!p1&&!!p2&&types(p0).length===1&&types(p1).length>=2&&roles(p1).includes('RECALL')&&types(p2).length>=3;
    if(root){root.dataset.cwlDirector=ok?'pass':'fail';root.dataset.cwlWave0Roles=String(types(p0).length);root.dataset.cwlWave1Roles=String(types(p1).length);root.dataset.cwlWave2Roles=String(types(p2).length);root.dataset.cwlWave1Mode=p1?.mode?.id||'none'}
    const report={ok,wave0:p0?{mode:p0.mode?.id,count:p0.count,parts:p0.parts}:null,wave1:p1?{mode:p1.mode?.id,count:p1.count,parts:p1.parts}:null,wave2:p2?{mode:p2.mode?.id,count:p2.count,parts:p2.parts}:null,error,build:BUILD,at:Date.now()};
    globalThis.__CWL_DIRECTOR_PROOF=report;return report;
  }
  setTimeout(read,1000);const timer=setInterval(read,650);addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  globalThis.CWL_DIRECTOR_PROOF={build:BUILD,read};
})();

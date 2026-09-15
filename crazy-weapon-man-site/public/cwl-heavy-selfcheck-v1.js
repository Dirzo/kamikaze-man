(()=>{
  if(globalThis.__CWL_HEAVY_SELFCHECK_V1)return;
  globalThis.__CWL_HEAVY_SELFCHECK_V1=true;
  const BUILD='cwl-heavy-selfcheck-v1-20260915a';
  const state={build:BUILD,report:null,runs:0,lastAt:0};

  function read(){
    const api=globalThis.CWL_NATIVE_HEAVY_API;
    const native=globalThis.__CWL_NATIVE_HEAVY_TEST||globalThis.CWM_HEAVY_ONLY?.runtime?.selfTest||null;
    let weapon=null;
    try{weapon=api?.state?.()?.weapon||globalThis.__KM_DEBUG?.state?.()?.weapon||null}catch(_){ }
    const body=globalThis.CWL_HEAVY_BODY?.state||null;
    const atlas=globalThis.CWM_HEAVY_RUNTIME_ATLAS?.stats?.()||null;
    const nativeOK=!!native?.ok;
    const weaponOK=!!weapon&&weapon.type==='hammer'&&!!weapon.heavyBaseId;
    const bodyOK=!!body?.ready;
    const drawOK=!!body?.frame;
    const report={
      ok:nativeOK&&weaponOK&&bodyOK,
      nativeOK,weaponOK,bodyOK,drawOK,
      rolls:native?.rolls||0,passed:native?.passed||0,
      weapon:weapon?{type:weapon.type,base:weapon.heavyBaseId,label:weapon.heavyLabel,name:weapon.name}:null,
      body:body?{source:body.source,frame:body.frame,ready:body.ready,error:body.error}:null,
      atlas,at:Date.now(),build:BUILD
    };
    state.report=report;state.runs++;state.lastAt=report.at;
    globalThis.__CWL_HEAVY_PROOF=report;
    return report;
  }

  function statusText(r){
    const verdict=r.ok?'PASS':'FAIL';
    const rolls=r.rolls?`${r.passed}/${r.rolls} rolls`:'rolls …';
    const base=r.weapon?.base||'NO BASE';
    const frame=r.body?.frame||'—';
    const source=r.body?.source||'—';
    const atlas=r.atlas?`${r.atlas.entries}/${r.atlas.capacity}`:'—';
    return `NATIVE HEAVY: ${verdict} • ${rolls} • ${r.weapon?.type?.toUpperCase()||'NO WEAPON'} • ${base} • ${source} • FRAME ${frame} • ATLAS ${atlas}`;
  }

  function paint(){
    const r=read(),panel=document.getElementById('cwmTesterPanel');
    if(panel){
      let el=document.getElementById('cwlNativeHeavyProof');
      if(!el){el=document.createElement('div');el.id='cwlNativeHeavyProof';el.className='tStatus';const anchor=document.getElementById('cwmTesterHeavy');anchor?.after(el)}
      if(el){el.textContent=statusText(r);el.style.color=r.ok?'#79ff9c':'#ff667a'}
    }
  }

  function boot(){
    try{
      const api=globalThis.CWL_NATIVE_HEAVY_API;
      if(api?.selfTest&&!globalThis.__CWL_NATIVE_HEAVY_TEST)globalThis.__CWL_NATIVE_HEAVY_TEST=api.selfTest(48);
    }catch(e){console.error('CWL Heavy self-check could not run native roll test',e)}
    paint();
  }
  setTimeout(boot,450);
  const timer=setInterval(paint,350);
  addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  globalThis.CWL_HEAVY_SELFCHECK={build:BUILD,state,run:read};
})();

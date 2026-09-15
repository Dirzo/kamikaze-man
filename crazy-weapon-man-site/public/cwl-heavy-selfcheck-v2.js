(()=>{
  if(globalThis.__CWL_HEAVY_SELFCHECK_V2)return;
  globalThis.__CWL_HEAVY_SELFCHECK_V2=true;
  const BUILD='cwl-heavy-selfcheck-v2-20260915a';
  const state={build:BUILD,report:null,runs:0,lastAt:0};
  function read(){
    const api=globalThis.CWL_NATIVE_HEAVY_API;
    const native=globalThis.__CWL_NATIVE_HEAVY_TEST||globalThis.CWM_HEAVY_ONLY?.runtime?.selfTest||null;
    const atlasApi=globalThis.CWM_HEAVY_RUNTIME_ATLAS;
    const atlasTest=globalThis.__CWL_HEAVY_ATLAS_TEST||atlasApi?.state?.selfTest||null;
    let debug=null,weapon=null;
    try{debug=globalThis.__KM_DEBUG?.state?.()||null;weapon=api?.state?.()?.weapon||debug?.weapon||null}catch(_){ }
    const body=globalThis.CWL_HEAVY_BODY?.state||null;
    const atlas=atlasApi?.stats?.()||null;
    const nativeOK=!!native?.ok;
    const weaponOK=!!weapon&&weapon.type==='hammer'&&!!weapon.heavyBaseId;
    const bodyOK=!!body?.ready;
    const atlasOK=!!atlasTest?.ok&&Number(atlasTest?.passed)===10;
    const drawOK=!debug?.gameStarted||!!body?.frame;
    const report={
      ok:nativeOK&&weaponOK&&bodyOK&&atlasOK&&drawOK,
      nativeOK,weaponOK,bodyOK,atlasOK,drawOK,
      rolls:native?.rolls||0,passed:native?.passed||0,
      visuals:atlasTest?.tested||0,visualPassed:atlasTest?.passed||0,
      weapon:weapon?{type:weapon.type,base:weapon.heavyBaseId,label:weapon.heavyLabel,name:weapon.name}:null,
      body:body?{source:body.source,frame:body.frame,ready:body.ready,error:body.error}:null,
      atlas,gameStarted:!!debug?.gameStarted,at:Date.now(),build:BUILD
    };
    state.report=report;state.runs++;state.lastAt=report.at;globalThis.__CWL_HEAVY_PROOF=report;return report;
  }
  function statusText(r){
    const verdict=r.ok?'PASS':'FAIL';
    const rolls=r.rolls?`${r.passed}/${r.rolls} rolls`:'rolls …';
    const visuals=r.visuals?`${r.visualPassed}/${r.visuals} visuals`:'visuals …';
    const base=r.weapon?.base||'NO BASE',frame=r.body?.frame||'—',source=r.body?.source||'—';
    const atlas=r.atlas?`${r.atlas.entries}/${r.atlas.capacity}`:'—';
    return `NATIVE HEAVY: ${verdict} • ${rolls} • ${visuals} • ${r.weapon?.type?.toUpperCase()||'NO WEAPON'} • ${base} • ${source} • FRAME ${frame} • ATLAS ${atlas}`;
  }
  function paint(){
    const r=read(),panel=document.getElementById('cwmTesterPanel');
    if(panel){
      let el=document.getElementById('cwlNativeHeavyProof');
      if(!el){el=document.createElement('div');el.id='cwlNativeHeavyProof';el.className='tStatus';document.getElementById('cwmTesterHeavy')?.after(el)}
      if(el){el.textContent=statusText(r);el.style.color=r.ok?'#79ff9c':'#ff667a'}
    }
  }
  function boot(){
    try{const api=globalThis.CWL_NATIVE_HEAVY_API;if(api?.selfTest&&!globalThis.__CWL_NATIVE_HEAVY_TEST)globalThis.__CWL_NATIVE_HEAVY_TEST=api.selfTest(48)}catch(e){console.error('CWL Heavy native self-test failed to start',e)}
    try{const a=globalThis.CWM_HEAVY_RUNTIME_ATLAS;if(a?.selfTest&&!globalThis.__CWL_HEAVY_ATLAS_TEST)globalThis.__CWL_HEAVY_ATLAS_TEST=a.selfTest()}catch(e){console.error('CWL Heavy visual self-test failed to start',e)}
    paint();
  }
  setTimeout(boot,650);const timer=setInterval(paint,350);addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  globalThis.CWL_HEAVY_SELFCHECK={build:BUILD,state,run:read};
})();

(()=>{
  if(globalThis.__CWL_HEAVY_SELFCHECK_V2)return;
  globalThis.__CWL_HEAVY_SELFCHECK_V2=true;
  const BUILD='cwl-heavy-selfcheck-v2-20260915c';
  const state={build:BUILD,report:null,runs:0,lastAt:0};
  function probeRenderer(weapon){
    const bodyApi=globalThis.CWL_HEAVY_BODY,hook=globalThis.__CWM_RENDER_HOOK;
    let renderOK=false,error=null,frame=bodyApi?.state?.frame||null;
    try{
      if(bodyApi?.drawPlayer&&weapon){
        const c=document.createElement('canvas');c.width=260;c.height=180;
        const X=c.getContext('2d');
        const pl={x:100,y:80,w:30,h:58,vx:0,vy:0,on:true,dir:1,hp:100,max:100,dead:false,at:0,atMax:.22,inv:0};
        const handled=bodyApi.drawPlayer({X,W:c.width,H:c.height,pl,w:weapon,time:1,E:[],P:[],F:[],T:[],dps:10,rarity:1});
        frame=bodyApi.state?.frame||frame;renderOK=handled===true&&!!frame;
      }
    }catch(e){error=String(e?.message||e)}
    const priorityOK=!!bodyApi?.drawPlayer&&!!hook&&(hook.drawPlayer===bodyApi.drawPlayer||hook.__cwlHeavyBodyPriority===true);
    return{renderOK,priorityOK,frame,error}
  }
  function read(){
    const api=globalThis.CWL_NATIVE_HEAVY_API;
    const native=globalThis.__CWL_NATIVE_HEAVY_TEST||globalThis.CWM_HEAVY_ONLY?.runtime?.selfTest||null;
    const atlasApi=globalThis.CWM_HEAVY_RUNTIME_ATLAS;
    const atlasTest=globalThis.__CWL_HEAVY_ATLAS_TEST||atlasApi?.state?.selfTest||null;
    let debug=null,weapon=null;
    try{debug=globalThis.__KM_DEBUG?.state?.()||null;weapon=api?.state?.()?.weapon||debug?.weapon||null}catch(_){ }
    const body=globalThis.CWL_HEAVY_BODY?.state||null;
    const atlas=atlasApi?.stats?.()||null;
    const probe=probeRenderer(weapon);
    const nativeOK=!!native?.ok;
    const weaponOK=!!weapon&&weapon.type==='hammer'&&!!weapon.heavyBaseId;
    const bodyOK=!!body?.ready;
    const atlasOK=!!atlasTest?.ok&&Number(atlasTest?.passed)===10;
    const drawOK=probe.renderOK&&probe.priorityOK;
    const report={
      ok:nativeOK&&weaponOK&&bodyOK&&atlasOK&&drawOK,
      nativeOK,weaponOK,bodyOK,atlasOK,drawOK,priorityOK:probe.priorityOK,renderOK:probe.renderOK,
      rolls:native?.rolls||0,passed:native?.passed||0,
      visuals:atlasTest?.tested||0,visualPassed:atlasTest?.passed||0,
      weapon:weapon?{type:weapon.type,base:weapon.heavyBaseId,label:weapon.heavyLabel,name:weapon.name}:null,
      body:body?{source:body.source,frame:probe.frame||body.frame,ready:body.ready,error:body.error||probe.error}:null,
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
    return `NATIVE HEAVY: ${verdict} • ${rolls} • ${visuals} • ${r.weapon?.type?.toUpperCase()||'NO WEAPON'} • ${base} • ${source} • FRAME ${frame} • RENDER ${r.renderOK?'OK':'FAIL'} • PRIORITY ${r.priorityOK?'OK':'FAIL'} • ATLAS ${atlas}`;
  }
  function expose(r){
    const root=document.documentElement;
    if(root){
      root.dataset.cwlHeavyProof=r.ok?'pass':'fail';
      root.dataset.cwlHeavyWeapon=r.weapon?.type||'none';
      root.dataset.cwlHeavyBase=r.weapon?.base||'none';
      root.dataset.cwlHeavyVisuals=`${r.visualPassed}/${r.visuals}`;
      root.dataset.cwlHeavyRolls=`${r.passed}/${r.rolls}`;
      root.dataset.cwlLadyBody=r.body?.source||'none';
      root.dataset.cwlLadyFrame=r.body?.frame||'none';
      root.dataset.cwlLadyRender=r.renderOK?'pass':'fail';
      root.dataset.cwlLadyPriority=r.priorityOK?'pass':'fail';
    }
    if(document.body){
      let el=document.getElementById('cwlSmokeProof');
      if(!el){el=document.createElement('div');el.id='cwlSmokeProof';el.hidden=true;document.body.appendChild(el)}
      el.dataset.status=r.ok?'pass':'fail';el.textContent=statusText(r);
    }
  }
  function paint(){
    const r=read();expose(r);
    const panel=document.getElementById('cwmTesterPanel');
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

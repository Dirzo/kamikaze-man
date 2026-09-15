(()=>{
  if(globalThis.__CWL_PARKING_PROOF_V1)return;
  globalThis.__CWL_PARKING_PROOF_V1=true;
  const BUILD='cwl-parking-proof-v1-20260915a';
  const qs=new URLSearchParams(location.search),smoke=qs.get('cwlSmoke')==='1',parkingOnly=qs.get('cwlParkingSmoke')==='1';
  if(!smoke&&!parkingOnly){globalThis.CWL_PARKING_PROOF={build:BUILD,active:false};return}
  const root=document.documentElement,state={build:BUILD,active:true,ok:false,error:null};
  function run(){
    const d=globalThis.__KM_DEBUG,api=globalThis.CWL_NATIVE_COMBAT;
    if(!d?.start||!d?.setZone||!d?.spawnPack||!d?.draw||!api?.state){setTimeout(run,90);return}
    try{
      const old=Number(api.state()?.zoneI??1);
      d.start();d.setZone(2);d.spawnPack();
      const s=api.state();for(const e of s.E||[])if(!e.dead&&!e.boss&&e.state==='spawn')e.state='idle';
      d.draw();
      const bg=root.dataset.cwlParkingBg==='pass',enemy=root.dataset.cwlParkingEnemy==='pass',renderer=!!globalThis.CWM_V2_PARKING;
      state.ok=bg&&enemy&&renderer;Object.assign(state,{bg,enemy,renderer,enemyTypes:[...new Set((s.E||[]).filter(e=>!e.boss).map(e=>e.type))],zoneName:s.zoneName||'',at:Date.now()});
      root.dataset.cwlParkingProof=state.ok?'pass':'fail';root.dataset.cwlParkingZone=String(s.zoneName||'');root.dataset.cwlParkingTypes=String(state.enemyTypes.length);
      globalThis.__CWL_PARKING_PROOF=state;
      if(smoke&&!parkingOnly){d.setZone(old);try{d.spawnPack()}catch(_){}}
    }catch(e){state.error=String(e?.message||e);root.dataset.cwlParkingProof='fail';globalThis.__CWL_PARKING_PROOF=state}
  }
  setTimeout(run,parkingOnly?1200:2500);
  globalThis.CWL_PARKING_PROOF={build:BUILD,active:true,state};
})();

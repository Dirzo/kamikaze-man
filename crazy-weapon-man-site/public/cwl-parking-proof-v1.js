(()=>{
  if(globalThis.__CWL_PARKING_PROOF_V1)return;
  globalThis.__CWL_PARKING_PROOF_V1=true;
  const BUILD='cwl-parking-proof-v3-20260915c';
  const qs=new URLSearchParams(location.search),smoke=qs.get('cwlSmoke')==='1',parkingOnly=qs.get('cwlParkingSmoke')==='1';
  if(!smoke&&!parkingOnly){globalThis.CWL_PARKING_PROOF={build:BUILD,active:false};return}
  const root=document.documentElement,state={build:BUILD,active:true,ok:false,error:null};
  function alive(s){return (s?.E||[]).filter(e=>!e.dead&&!e.boss)}
  function run(){
    const d=globalThis.__KM_DEBUG,api=globalThis.CWL_NATIVE_COMBAT;
    if(!d?.start||!d?.setZone||!d?.spawnPack||!d?.clearPack||!d?.draw||!d?.skill||!d?.campaign||!api?.state||!api?.hit){setTimeout(run,90);return}
    try{
      const old=Number(api.state()?.zoneI??1),zones=d.campaign()||[];
      const parkingIndex=zones.findIndex(z=>/MUNICIPAL SWORD PARKING LOT/i.test(String(z?.name||'')));
      if(parkingIndex<0)throw new Error('Municipal Sword Parking Lot missing from campaign');
      d.start();d.setZone(parkingIndex);try{d.clearPack()}catch(_){}d.spawnPack();
      let s=api.state();for(const e of alive(s))if(e.state==='spawn')e.state='idle';d.draw();
      const zoneMatch=/MUNICIPAL SWORD PARKING LOT/i.test(String(s.zoneName||''));
      const first=alive(s),target=first[0];
      const heavy=!!s.weapon&&s.weapon.type==='hammer'&&!!s.weapon.heavyBaseId;
      let damage=false,kill=false,skill=false;
      if(target){const before=Number(target.hp??target.max??100);api.hit(target,Math.max(2,before*.08),{col:'#62eaff',sourceType:'hammer'});damage=Number(target.hp??before)<before}
      s=api.state();if(s.pl){s.pl.scd=0;s.pl.mana=Math.max(100,Number(s.pl.mana||0),Number(s.pl.skillCost||25)+20)}
      const manaBefore=Number(s.pl?.mana??0),scdBefore=Number(s.pl?.scd??0);try{d.skill()}catch(_){}s=api.state();skill=Number(s.pl?.mana??manaBefore)<manaBefore||Number(s.pl?.scd??0)>scdBefore;
      const victim=alive(s)[0];if(victim){api.hit(victim,Math.max(9999,(Number(victim.max)||100)*30),{col:'#fff176',ignoreCap:true,sourceType:'hammer'});kill=!!victim.dead||Number(victim.hp??1)<=0}
      const firstTypes=[...new Set(alive(api.state()).map(e=>e.type))];
      try{d.clearPack()}catch(_){}d.spawnPack();s=api.state();for(const e of alive(s))if(e.state==='spawn')e.state='idle';d.draw();
      const second=alive(s),secondPack=second.length>0;
      const bg=root.dataset.cwlParkingBg==='pass',enemy=root.dataset.cwlParkingEnemy==='pass',art=root.dataset.cwlParkingArt==='concept-playable',renderer=!!globalThis.CWM_V2_PARKING;
      const native=!!globalThis.CWL_NATIVE_COMBAT?.on,body=!!globalThis.CWL_HEAVY_BODY?.state?.ready;
      state.ok=bg&&enemy&&art&&renderer&&zoneMatch&&heavy&&damage&&skill&&kill&&secondPack&&native&&body;
      Object.assign(state,{bg,enemy,art,renderer,zoneMatch,parkingIndex,heavy,damage,skill,kill,secondPack,native,body,firstTypes,secondTypes:[...new Set(second.map(e=>e.type))],enemyCount:second.length,zoneName:s.zoneName||'',weapon:s.weapon?.heavyBaseId||'',at:Date.now()});
      root.dataset.cwlParkingProof=state.ok?'pass':'fail';root.dataset.cwlParkingPlayable=state.ok?'pass':'fail';root.dataset.cwlParkingZoneMatch=zoneMatch?'pass':'fail';
      root.dataset.cwlParkingDamage=damage?'pass':'fail';root.dataset.cwlParkingSkill=skill?'pass':'fail';root.dataset.cwlParkingKill=kill?'pass':'fail';root.dataset.cwlParkingSecondPack=secondPack?'pass':'fail';
      root.dataset.cwlParkingZone=String(s.zoneName||'');root.dataset.cwlParkingTypes=String(state.secondTypes.length);
      globalThis.__CWL_PARKING_PROOF=state;
      if(smoke&&!parkingOnly){d.setZone(old);try{d.spawnPack()}catch(_){}}
    }catch(e){state.error=String(e?.message||e);root.dataset.cwlParkingProof='fail';root.dataset.cwlParkingPlayable='fail';root.dataset.cwlParkingZoneMatch='fail';globalThis.__CWL_PARKING_PROOF=state}
  }
  setTimeout(run,parkingOnly?1250:2500);
  globalThis.CWL_PARKING_PROOF={build:BUILD,active:true,state};
})();

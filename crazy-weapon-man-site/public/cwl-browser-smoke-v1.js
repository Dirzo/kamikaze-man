(()=>{
  if(globalThis.__CWL_BROWSER_SMOKE_V1)return;
  globalThis.__CWL_BROWSER_SMOKE_V1=true;
  const BUILD='cwl-browser-smoke-v2-20260915c';
  if(new URLSearchParams(location.search).get('cwlSmoke')!=='1'){globalThis.CWL_BROWSER_SMOKE={build:BUILD,active:false};return}
  const report={build:BUILD,active:true,ok:false,error:null,at:0};
  function settle(){setTimeout(()=>{try{globalThis.requestAnimationFrame=()=>0;document.documentElement.dataset.cwlSmokeSettled='yes'}catch(_){ }},40)}
  function hidden(sel){const e=document.querySelector(sel);return !e||getComputedStyle(e).display==='none'||getComputedStyle(e).visibility==='hidden'}
  function run(){
    const d=globalThis.__KM_DEBUG,api=globalThis.CWL_NATIVE_COMBAT;
    if(!d?.start||!d?.setZone||!d?.spawnPack||!d?.clearPack||!d?.state||!api?.state||!api?.hit){setTimeout(run,100);return}
    try{
      d.start();d.setZone(1);d.spawnPack();
      const first=d.state(),wave0=[...new Set((first.enemies||[]).map(e=>e.type))];
      d.clearPack();d.spawnPack();
      const second=d.state(),wave1=[...new Set((second.enemies||[]).map(e=>e.type))];
      /* Smoke mode freezes the normal RAF loop early. Advance one live enemy past its spawn-only pose so the real sewer renderer can be exercised. */
      const renderState=api.state(),renderTarget=(renderState.E||[]).find(e=>!e.dead&&!e.boss);
      if(renderTarget&&renderTarget.state==='spawn')renderTarget.state='idle';
      try{d.draw?.()}catch(_){ }
      const combatState=api.state(),target=(combatState.E||[]).find(e=>!e.dead&&!e.boss);
      if(target){const chip=Math.max(1,(Number(target.max)||100)*.035);for(let i=0;i<4&&!target.dead;i++)api.hit(target,chip,{col:'#fff176',sourceType:'hammer'})}
      try{d.skill?.()}catch(_){ }
      try{d.spawn?.('crawler',false);const ns=api.state(),victim=(ns.E||[]).filter(e=>!e.dead&&!e.boss).at(-1);if(victim)api.hit(victim,(Number(victim.max)||100)*20,{col:'#fff',ignoreCap:true,sourceType:'hammer'})}catch(_){ }
      setTimeout(()=>{
        try{
          const root=document.documentElement,body=document.body,hud=document.getElementById('cwlDesktopCombatHud');
          const combat=body.classList.contains('cwlDesktopCombat');
          const hudVisible=!!hud&&getComputedStyle(hud).display!=='none'&&getComputedStyle(hud).visibility!=='hidden';
          const legacySelectors=['.fsTop','.fsBottom','.fsZone','.styleHud','.killChainHud','.shardHud','.augmentHud','#cwlSpecialHud','#cwlThreatTag','#cwlSlayerHud','.cwmMiniHud','.cwmMobileFab'];
          const legacyHidden=legacySelectors.every(hidden);
          const mixed=wave0.length===1&&wave1.length>=2&&wave1.includes('crawler')&&wave1.includes('wizard');
          const impact=root.dataset.cwlHeavyImpactDraw==='pass',enemyVariation=root.dataset.cwlEnemyVariationDraw==='pass',silhouette=root.dataset.cwlHeavySilhouetteDraw==='pass';
          const sigState=globalThis.CWL_HEAVY_SIGNATURES?.state?.(),signatures=!!sigState?.installed&&Number(sigState?.hitCount||0)>=1;
          const specials=!!globalThis.CWL_HEAVY_SPECIALS?.state?.installed&&Number(globalThis.CWL_HEAVY_SPECIALS?.state?.casts||0)>=1;
          const slayer=!!globalThis.CWL_SLAYER_LOOP?.state?.().installed&&root.dataset.cwlSlayerKill==='pass';
          const nativeHooks=!!globalThis.CWL_NATIVE_COMBAT?.on&&String(globalThis.CWL_NATIVE_COMBAT?.build||'').includes('combat-hook');
          const hb=globalThis.CWL_HEAVY_BODY,wind=hb?.meleePhase?.(.12),strike=hb?.meleePhase?.(.48),recover=hb?.meleePhase?.(.84),wa=Number(hb?.meleeAngle?.(.25)),sa=Number(hb?.meleeAngle?.(.65)),ra=Number(hb?.meleeAngle?.(.92));
          const swing=wind==='windup'&&strike==='impact'&&recover==='recovery'&&wa<-1.5&&sa>.05&&ra<.05&&ra>-.9;
          const interfaceNative=root.dataset.cwlInterfaceSource==='native'&&root.dataset.cwlLegacyHud==='hidden';
          const desktopOnly=root.dataset.cwlDesktopOnly==='pass'&&!body.classList.contains('touchDevice');
          const bootClean=root.dataset.cwlBoot==='ready'&&!document.getElementById('cwlBootCover')&&!root.classList.contains('cwlBooting');
          const noLegacySprites=!globalThis.__CWM_V3_FINALIZER&&!globalThis.__CWM_V2_SPRITE_RENDERER&&!globalThis.CWM_V2_SPRITES;
          const uiState=api.state(),zoneText=document.getElementById('cwlZoneLine')?.textContent||'',weaponText=document.getElementById('cwlCombatName')?.textContent||'',combatText=document.getElementById('cwlCombatLine')?.textContent||'',shardText=document.getElementById('cwlShardText')?.textContent||'';
          const stateBound=zoneText.includes(String(uiState.zoneName||'').toUpperCase())&&weaponText===uiState.weapon?.name&&combatText.includes('A ')&&shardText.includes(String(uiState.weaponShards??0));
          report.ok=combat&&hudVisible&&legacyHidden&&mixed&&impact&&enemyVariation&&silhouette&&signatures&&specials&&slayer&&nativeHooks&&swing&&interfaceNative&&desktopOnly&&bootClean&&noLegacySprites&&stateBound;
          Object.assign(report,{wave0,wave1,combat,hudVisible,legacyHidden,impact,enemyVariation,silhouette,signatures,specials,slayer,nativeHooks,swing,angles:[wa,sa,ra],interfaceNative,desktopOnly,bootClean,noLegacySprites,stateBound,zoneText,weaponText,combatText,shardText,enemyCount:(second.enemies||[]).length,at:Date.now()});
          root.dataset.cwlBrowserSmoke=report.ok?'pass':'fail';
          root.dataset.cwlCombatActive=combat?'pass':'fail';root.dataset.cwlCombatHud=hudVisible?'pass':'fail';root.dataset.cwlLegacyHudProof=legacyHidden?'hidden':'visible';
          root.dataset.cwlLiveWave0Types=String(wave0.length);root.dataset.cwlLiveWave1Types=String(wave1.length);root.dataset.cwlLiveWave1Enemies=String(report.enemyCount);
          root.dataset.cwlNativeHooks=nativeHooks?'pass':'fail';root.dataset.cwlHeavySignaturesLive=signatures?'pass':'fail';root.dataset.cwlHeavySpecialsLive=specials?'pass':'fail';root.dataset.cwlSlayerLive=slayer?'pass':'fail';
          root.dataset.cwlHammerSwing=swing?'pass':'fail';root.dataset.cwlHammerAngles=`${wa.toFixed(2)},${sa.toFixed(2)},${ra.toFixed(2)}`;
          root.dataset.cwlUnifiedInterface=interfaceNative&&stateBound?'pass':'fail';root.dataset.cwlBootClean=bootClean?'pass':'fail';root.dataset.cwlLegacySprites=noLegacySprites?'removed':'present';
          globalThis.__CWL_BROWSER_SMOKE_REPORT=report;settle();
        }catch(e){report.error=String(e?.message||e);document.documentElement.dataset.cwlBrowserSmoke='fail';settle()}
      },900);
    }catch(e){report.error=String(e?.message||e);report.at=Date.now();document.documentElement.dataset.cwlBrowserSmoke='fail';globalThis.__CWL_BROWSER_SMOKE_REPORT=report;settle()}
  }
  setTimeout(run,1300);
  globalThis.CWL_BROWSER_SMOKE={build:BUILD,active:true,report};
})();

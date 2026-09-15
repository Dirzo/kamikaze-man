(()=>{
  if(globalThis.__CWL_BROWSER_SMOKE_V1)return;
  globalThis.__CWL_BROWSER_SMOKE_V1=true;
  const BUILD='cwl-browser-smoke-v1-20260915b';
  if(new URLSearchParams(location.search).get('cwlSmoke')!=='1'){globalThis.CWL_BROWSER_SMOKE={build:BUILD,active:false};return}
  const report={build:BUILD,active:true,ok:false,error:null,at:0};
  function run(){
    const d=globalThis.__KM_DEBUG;
    if(!d?.start||!d?.setZone||!d?.spawnPack||!d?.clearPack||!d?.state){setTimeout(run,120);return}
    try{
      d.start();d.setZone(1);d.spawnPack();
      const first=d.state(),wave0=[...new Set((first.enemies||[]).map(e=>e.type))];
      d.clearPack();d.spawnPack();
      const second=d.state(),wave1=[...new Set((second.enemies||[]).map(e=>e.type))];
      try{d.draw?.()}catch(_){ }
      try{d.hitTest?.('hammer');d.draw?.()}catch(_){ }
      setTimeout(()=>{
        try{
          const root=document.documentElement,body=document.body,hud=document.getElementById('cwlDesktopCombatHud'),old=document.querySelector('.fsTop');
          const combat=body.classList.contains('cwlDesktopCombat');
          const hudVisible=!!hud&&getComputedStyle(hud).display!=='none'&&getComputedStyle(hud).visibility!=='hidden';
          const oldHidden=!!old&&getComputedStyle(old).display==='none';
          const mixed=wave0.length===1&&wave1.length>=2&&wave1.includes('crawler')&&wave1.includes('wizard');
          const impact=root.dataset.cwlHeavyImpactDraw==='pass';
          const enemyVariation=root.dataset.cwlEnemyVariationDraw==='pass';
          const silhouette=root.dataset.cwlHeavySilhouetteDraw==='pass';
          report.ok=combat&&hudVisible&&oldHidden&&mixed&&impact&&enemyVariation&&silhouette;
          report.wave0=wave0;report.wave1=wave1;report.combat=combat;report.hudVisible=hudVisible;report.oldHudHidden=oldHidden;report.impact=impact;report.enemyVariation=enemyVariation;report.silhouette=silhouette;report.enemyCount=(second.enemies||[]).length;report.at=Date.now();
          root.dataset.cwlBrowserSmoke=report.ok?'pass':'fail';root.dataset.cwlCombatActive=combat?'pass':'fail';root.dataset.cwlCombatHud=hudVisible?'pass':'fail';root.dataset.cwlLegacyBottomHud=oldHidden?'hidden':'visible';root.dataset.cwlLiveWave0Types=String(wave0.length);root.dataset.cwlLiveWave1Types=String(wave1.length);root.dataset.cwlLiveWave1Enemies=String(report.enemyCount);
          globalThis.__CWL_BROWSER_SMOKE_REPORT=report;
        }catch(e){report.error=String(e?.message||e);document.documentElement.dataset.cwlBrowserSmoke='fail'}
      },850);
    }catch(e){report.error=String(e?.message||e);report.at=Date.now();document.documentElement.dataset.cwlBrowserSmoke='fail';globalThis.__CWL_BROWSER_SMOKE_REPORT=report}
  }
  setTimeout(run,1300);
  globalThis.CWL_BROWSER_SMOKE={build:BUILD,active:true,report};
})();

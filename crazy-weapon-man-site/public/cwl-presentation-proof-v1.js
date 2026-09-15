(()=>{
  if(globalThis.__CWL_PRESENTATION_PROOF_V1)return;
  globalThis.__CWL_PRESENTATION_PROOF_V1=true;
  const BUILD='cwl-presentation-proof-v2-20260915a';
  function read(){
    const root=document.documentElement,p=globalThis.CWL_COMBAT_PRESENTATION,b=globalThis.CWL_HEAVY_BODY,h=globalThis.__CWM_RENDER_HOOK;
    const state=p?.state?.()||{};
    const scale=Number(b?.state?.presentationScale)||0;
    const wrapped=!!h?.drawPlayer?.__cwlPresentationWrapper;
    const hud=!!document.getElementById('cwlDesktopCombatHud');
    const desktop=!!state.desktop;
    const ok=desktop&&hud&&wrapped&&Math.abs(scale-1.26)<.001;
    if(root){root.dataset.cwlPresentation=ok?'pass':'fail';root.dataset.cwlPlayerScale=scale?String(scale):'0';root.dataset.cwlCompactHud=hud?'ready':'missing';root.dataset.cwlPresentationDesktop=desktop?'yes':'no';root.dataset.cwlDesktopOnly=desktop?'pass':'blocked'}
    const report={ok,desktop,hud,wrapped,scale,build:BUILD,at:Date.now()};globalThis.__CWL_PRESENTATION_PROOF=report;return report;
  }
  setTimeout(read,900);const timer=setInterval(read,400);addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  globalThis.CWL_PRESENTATION_PROOF={build:BUILD,read};
})();

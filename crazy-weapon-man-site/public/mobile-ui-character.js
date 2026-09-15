(()=>{
  if(globalThis.__CWL_MOBILE_DISABLED)return;
  globalThis.__CWL_MOBILE_DISABLED=true;
  const BUILD='cwl-mobile-disabled-20260915a';
  const root=document.documentElement;
  const isMobileUA=/Android|iPhone|iPod|iPad|Mobile|Silk|Kindle/i.test(navigator.userAgent||'');
  const tooNarrow=innerWidth<1000;
  const blocked=isMobileUA||tooNarrow;
  const css=document.createElement('style');
  css.textContent=`
    .touch,.rotateHint,.mobileUtility,.mobileActions,.cwmMobileFab,.cwmMobileDrawer,.cwmMiniHud,.cwmPauseOverlay{display:none!important}
  `;
  document.head.appendChild(css);
  const enforceDesktop=()=>{
    document.body?.classList.remove('touchDevice');
    root.dataset.cwlMobileRuntime='disabled';
  };
  enforceDesktop();
  if(document.body)new MutationObserver(enforceDesktop).observe(document.body,{attributes:true,attributeFilter:['class']});
  if(blocked){
    const stage=document.getElementById('gameStage')||document.querySelector('.stage');
    if(stage){
      stage.innerHTML=`<div id="cwlDesktopRequired" style="min-height:520px;display:grid;place-items:center;padding:30px;background:radial-gradient(circle at 50% 35%,#172236,#06090f 65%);color:#edf6ff;text-align:center;font-family:system-ui,sans-serif"><div style="max-width:620px"><div style="font-size:11px;font-weight:1000;letter-spacing:.24em;color:#7feaff">DESKTOP BUILD</div><div style="font-size:clamp(32px,7vw,64px);font-weight:1000;line-height:.92;margin-top:8px">CRAZY WEAPON LADY</div><div style="margin-top:18px;font-size:16px;line-height:1.5;color:#b7c9dc">Mobile support is temporarily disabled while the desktop combat and interface are being rebuilt. Use a desktop browser at 1000px or wider.</div></div></div>`;
    }
    root.dataset.cwlDesktopOnly='blocked';
  }else root.dataset.cwlDesktopOnly='pass';
  globalThis.CWL_MOBILE_DISABLED={build:BUILD,blocked,isMobileUA,tooNarrow};
})();

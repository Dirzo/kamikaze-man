(()=>{
  if(globalThis.__CWL_MOBILE_HUD_DISABLED)return;
  globalThis.__CWL_MOBILE_HUD_DISABLED=true;
  const BUILD='cwl-mobile-hud-disabled-20260915a';
  document.documentElement.dataset.cwlMobileHud='disabled';
  globalThis.CWL_MOBILE_HUD={build:BUILD,enabled:false};
})();

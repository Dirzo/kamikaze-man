(()=>{
  if(globalThis.__CWL_VISUAL_CLEANUP_V1)return;
  globalThis.__CWL_VISUAL_CLEANUP_V1=true;
  const BUILD='cwl-visual-cleanup-v1-20260915a';
  const css=document.createElement('style');
  css.id='cwlVisualCleanupV1';
  css.textContent=`
    /* One readable upgrade notification instead of two giant overlapping announcements. */
    .banner{display:none!important}
    .fsUpgrade{
      top:16%!important;left:50%!important;max-width:min(620px,68vw)!important;width:max-content!important;
      padding:10px 16px 11px!important;border:1px solid #ffffff35!important;border-radius:14px!important;
      background:linear-gradient(180deg,#08111eea,#050a12e8)!important;
      box-shadow:0 12px 34px #000a,0 0 22px #fff1!important;
      filter:none!important;pointer-events:none!important;z-index:42!important;
    }
    .fsUpgrade .u1{font-size:9px!important;letter-spacing:.22em!important;color:#d7e7f7!important;margin-bottom:4px!important}
    .fsUpgrade .u2{font-size:clamp(19px,2.45vw,34px)!important;line-height:1.02!important;max-width:580px!important;text-wrap:balance!important;text-shadow:0 3px 12px #000!important}
    .fsUpgrade .u3{font-size:13px!important;line-height:1.1!important;margin-top:6px!important;color:#fff17c!important;letter-spacing:.03em!important}
    #cwlSlayerHud{transform:scale(.90)!important;transform-origin:top right!important}
    #cwlSpecialHud{max-width:250px!important}
    @media(max-width:900px){
      .fsUpgrade{top:13%!important;max-width:72vw!important;padding:8px 12px 9px!important}
      .fsUpgrade .u2{font-size:clamp(17px,3.4vw,27px)!important;max-width:68vw!important}
      .fsUpgrade .u3{font-size:11px!important}
    }
    @media(max-height:650px){
      .fsUpgrade{top:12%!important}
      .fsUpgrade .u1{display:none!important}
      .fsUpgrade .u2{font-size:clamp(16px,3vw,25px)!important}
    }
  `;
  document.head.appendChild(css);
  globalThis.CWL_VISUAL_CLEANUP={build:BUILD};
})();

(()=>{
  if(globalThis.__CWL_DESKTOP_ONLY_V1)return;
  globalThis.__CWL_DESKTOP_ONLY_V1=true;
  const BUILD='cwl-desktop-only-v1-20260915a';
  const root=document.documentElement;
  const style=document.createElement('style');
  style.id='cwlDesktopOnlyStyle';
  style.textContent=`
    .touch,.rotateHint,.mobileUtility,.mobileActions{display:none!important}
    body.touchDevice .touch,body.touchDevice .rotateHint,body.touchDevice .mobileUtility,body.touchDevice .mobileActions{display:none!important}
  `;
  document.head.appendChild(style);
  function enforce(){
    if(document.body?.classList.contains('touchDevice'))document.body.classList.remove('touchDevice');
    root.dataset.cwlDesktopRuntime='active';
  }
  enforce();
  const mo=new MutationObserver(enforce);
  if(document.body)mo.observe(document.body,{attributes:true,attributeFilter:['class']});
  addEventListener('DOMContentLoaded',enforce,{once:true});
  globalThis.CWL_DESKTOP_ONLY={build:BUILD,active:true,enforce};
})();

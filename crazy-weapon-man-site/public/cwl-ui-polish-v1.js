(()=>{
  if(globalThis.__CWL_UI_POLISH_V1)return;
  globalThis.__CWL_UI_POLISH_V1=true;
  const BUILD='cwl-ui-polish-v1-20260915a';
  const root=document.documentElement;
  const css=document.createElement('style');
  css.id='cwlUiPolishV1';
  css.textContent=`
    #cwlUtilityBar{opacity:.18!important;background:transparent!important;border:0!important;box-shadow:none!important}
    #cwlUtilityBar:hover,#cwlUtilityBar.open{opacity:.92!important}
    #cwlUtilityBar>.btn{display:none!important}
    #cwlUtilityBar.open>.btn{display:block!important}
    #cwlUtilityToggle{display:block!important;width:30px;height:24px;border:1px solid #ffffff20;border-radius:8px;background:#07101bad;color:#9fb3c7;font:1000 13px/1 system-ui;cursor:pointer;padding:0}
    #cwlUtilityBar.open #cwlUtilityToggle{color:#fff176;border-color:#fff17655}
    body.cwlDesktopCombat #cwlUtilityBar{top:44px!important;right:9px!important}
    #titleScreen.cwlTitleRebuilt #startGame{min-width:190px!important}
  `;
  document.head.appendChild(css);
  function install(){
    const bar=document.getElementById('cwlUtilityBar');
    if(bar&&!document.getElementById('cwlUtilityToggle')){
      const b=document.createElement('button');b.id='cwlUtilityToggle';b.type='button';b.textContent='•••';b.title='Game controls';b.setAttribute('aria-label','Game controls');
      b.onclick=e=>{e.preventDefault();e.stopPropagation();bar.classList.toggle('open')};
      bar.prepend(b);
    }
    const start=document.getElementById('startGame');if(start)start.textContent='START HEAVY RUN';
    root.dataset.cwlUiPolish='ready';
    return !!bar&&!!start;
  }
  let tries=0;const timer=setInterval(()=>{tries++;if(install()&&tries>8)clearInterval(timer);if(tries>70)clearInterval(timer)},90);install();
  globalThis.CWL_UI_POLISH={build:BUILD,install};
})();

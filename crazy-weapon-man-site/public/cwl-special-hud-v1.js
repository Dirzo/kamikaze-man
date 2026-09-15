(()=>{
  if(globalThis.__CWL_SPECIAL_HUD_V1)return;
  globalThis.__CWL_SPECIAL_HUD_V1=true;
  const BUILD='cwl-special-hud-v1-20260915a';
  const style=document.createElement('style');
  style.textContent=`#cwlSpecialHud{position:absolute;z-index:42;left:max(8px,env(safe-area-inset-left));top:max(56px,calc(env(safe-area-inset-top) + 48px));pointer-events:none;display:flex;align-items:center;gap:7px;padding:6px 8px;border:1px solid #ffffff2b;border-radius:9px;background:#07101add;box-shadow:0 8px 24px #0008;color:#dceaff;font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;backdrop-filter:blur(7px);opacity:.88}#cwlSpecialHud b{font-size:9px;color:#fff}#cwlSpecialHud .ready{color:#7dff9e}#cwlSpecialHud .cool{color:#ffcf72}#cwlSpecialHud .mana{color:#70dfff}@media(max-width:900px),(pointer:coarse){#cwlSpecialHud{top:max(48px,calc(env(safe-area-inset-top) + 42px));font-size:7px;gap:5px;padding:5px 6px;max-width:56vw}#cwlSpecialHud b{font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:26vw}}`;
  document.head.appendChild(style);
  let el=null;
  function ensure(){if(el&&el.isConnected)return el;el=document.createElement('div');el.id='cwlSpecialHud';(document.getElementById('gameStage')||document.body).appendChild(el);return el}
  function update(){
    const h=ensure(),def=globalThis.CWL_HEAVY_SPECIALS?.current?.();
    let scd=0,mana=0,cost=25,w=null,started=true;
    try{scd=Math.max(0,Number(pl.scd)||0);mana=Math.max(0,Number(pl.mana)||0);cost=Math.round(Number(pl.skillCost)||25);w=curW();started=typeof gameStarted==='undefined'?true:!!gameStarted}catch(_){ }
    if(!def){h.style.display='none';return}h.style.display=started?'flex':'none';
    const coarse=matchMedia?.('(pointer:coarse)')?.matches,label=coarse?'SPECIAL':'A · SPECIAL',ready=scd<=.02&&mana>=cost;
    h.style.borderColor=(w?.element?.col||w?.col||'#70dfff')+'55';
    h.innerHTML=`<span>${label}</span><b>${def.short}</b><span class="${ready?'ready':'cool'}">${ready?'READY':scd>0?scd.toFixed(1)+'s':'LOW MP'}</span><span class="mana">${cost} MP</span>`;
  }
  setInterval(update,90);update();
  globalThis.CWL_SPECIAL_HUD={build:BUILD,update,state:()=>({visible:!!el&&el.style.display!=='none',special:globalThis.CWL_HEAVY_SPECIALS?.current?.()?.name||''})};
})();

(()=>{
  if(globalThis.__CWL_SPECIAL_HUD_V1)return;
  globalThis.__CWL_SPECIAL_HUD_V1=true;
  const BUILD='cwl-special-hud-v1-20260915b';
  const style=document.createElement('style');
  style.textContent=`#cwlSpecialHud{position:absolute;z-index:42;left:max(8px,env(safe-area-inset-left));top:max(56px,calc(env(safe-area-inset-top) + 48px));pointer-events:none;display:flex;align-items:center;gap:7px;padding:6px 8px;border:1px solid #ffffff2b;border-radius:9px;background:#07101add;box-shadow:0 8px 24px #0008;color:#dceaff;font:900 8px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.04em;backdrop-filter:blur(7px);opacity:.88}#cwlSpecialHud b{font-size:9px;color:#fff}#cwlSpecialHud .ready{color:#7dff9e}#cwlSpecialHud .cool{color:#ffcf72}#cwlSpecialHud .mana{color:#70dfff}@media(max-width:900px),(pointer:coarse){#cwlSpecialHud{top:max(48px,calc(env(safe-area-inset-top) + 42px));font-size:7px;gap:5px;padding:5px 6px;max-width:56vw}#cwlSpecialHud b{font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:26vw}}`;
  document.head.appendChild(style);
  let el=null;
  function ensure(){if(el&&el.isConnected)return el;el=document.createElement('div');el.id='cwlSpecialHud';(document.getElementById('gameStage')||document.body).appendChild(el);return el}
  function update(){
    const h=ensure(),def=globalThis.CWL_HEAVY_SPECIALS?.current?.();let s=null;
    try{s=globalThis.CWL_NATIVE_COMBAT?.state?.()||null}catch(_){ }
    const p=s?.pl,w=s?.weapon,started=!!s?.gameStarted;
    if(!def||!p){h.style.display='none';return}
    const scd=Math.max(0,Number(p.scd)||0),mana=Math.max(0,Number(p.mana)||0),cost=Math.round(Number(p.skillCost)||25);
    h.style.display=started?'flex':'none';
    const coarse=matchMedia?.('(pointer:coarse)')?.matches,label=coarse?'SPECIAL':'A · SPECIAL',ready=scd<=.02&&mana>=cost;
    h.style.borderColor=(w?.element?.col||w?.col||'#70dfff')+'55';
    h.innerHTML=`<span>${label}</span><b>${def.short}</b><span class="${ready?'ready':'cool'}">${ready?'READY':scd>0?scd.toFixed(1)+'s':'LOW MP'}</span><span class="mana">${cost} MP</span>`;
    document.documentElement.dataset.cwlSpecialHud=started?'ready':'waiting';
  }
  setInterval(update,90);update();
  globalThis.CWL_SPECIAL_HUD={build:BUILD,update,state:()=>({visible:!!el&&el.style.display!=='none',special:globalThis.CWL_HEAVY_SPECIALS?.current?.()?.name||'',native:!!globalThis.CWL_NATIVE_COMBAT})};
})();

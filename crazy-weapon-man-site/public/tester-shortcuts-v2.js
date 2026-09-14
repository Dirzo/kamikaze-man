(()=>{
  if(globalThis.__CWM_TESTER_SHORTCUTS)return;
  globalThis.__CWM_TESTER_SHORTCUTS=true;

  const BUILD='tester-warp-20260914c';
  let panel=null,zoneText=null,rendererText=null,bridgeText=null,drawText=null,spriteText=null;
  let cornerTaps=[];

  const dbg=()=>window.__KM_DEBUG||null;
  const campaign=()=>{try{return dbg()?.campaign?.()||[]}catch(_){return []}};
  const currentZone=()=>{try{return Number(dbg()?.progress?.().zone??0)||0}catch(_){return 0}};
  const zoneName=i=>campaign()[i]?.name||`AREA ${i+1}`;

  function toast(msg){const el=document.getElementById('msg');if(el)el.textContent=msg}
  function updatePanel(){
    if(!panel)return;
    const i=currentZone(),zones=campaign(),render=globalThis.CWM_V2_RENDERER,last=globalThis.__CWM_V2_LAST_DRAW,sprites=globalThis.CWM_V2_SPRITES;
    if(zoneText)zoneText.textContent=`AREA ${i+1}/${Math.max(1,zones.length)} • ${zoneName(i)}`;
    if(rendererText)rendererText.textContent=render?`RENDERER: ${render.build}`:'RENDERER: NOT LOADED';
    if(bridgeText)bridgeText.textContent=`NATIVE BRIDGE: ${globalThis.__CWM_NATIVE_RENDER_BRIDGE||'MISSING'}`;
    if(spriteText){const ready=!!sprites?.ready;spriteText.textContent=sprites?`ILLUSTRATED SPRITES: ${ready?'READY':'LOADING'} • P:${sprites.playerReady?'OK':'…'} E:${sprites.enemyReady?'OK':'…'} • ${sprites.build||''}`:'ILLUSTRATED SPRITES: NOT LOADED';spriteText.style.color=ready?'#79ff9c':'#ffb86b'}
    const active=!!last&&last.zone===i&&(Date.now()-Number(last.at||0)<1500);
    if(drawText){drawText.textContent=`VISUAL DRAW: ${active?'ACTIVE':'WAITING'}${last?` • zone ${Number(last.zone)+1}`:''}`;drawText.style.color=active?'#79ff9c':'#ffb86b'}
  }

  function cleanWarp(i){
    const d=dbg(),zones=campaign();
    if(!d||!zones.length)return false;
    i=Math.max(0,Math.min(zones.length-1,Number(i)||0));
    try{
      try{d.clearPack?.()}catch(_){ }
      d.setZone(i);d.start?.();d.heal?.();
      setTimeout(()=>{try{d.spawnPack?.()}catch(_){ }},100);
      toast(`TESTER WARP → ${zoneName(i)}`);
      setTimeout(updatePanel,180);
      return true;
    }catch(e){console.warn('CWM tester warp failed',e);toast('TESTER WARP FAILED');return false}
  }
  const nextZone=delta=>cleanWarp(currentZone()+delta);

  function ensurePanel(){
    if(panel)return panel;
    const css=document.createElement('style');
    css.textContent=`#cwmTesterPanel{position:fixed;left:10px;top:10px;z-index:2147483000;width:min(350px,calc(100vw - 20px));border:1px solid #6fe7ff66;border-radius:12px;background:#050a10ed;color:#eaf8ff;box-shadow:0 18px 60px #000c;padding:10px;font-family:system-ui;display:none;backdrop-filter:blur(9px)}#cwmTesterPanel.show{display:block}#cwmTesterPanel .tHead{display:flex;align-items:center;gap:8px;margin-bottom:8px}#cwmTesterPanel .tTitle{font:1000 12px/1 system-ui;letter-spacing:.09em;color:#fff176;margin-right:auto}#cwmTesterPanel .tClose{width:30px;height:30px;border:1px solid #ffffff30;border-radius:8px;background:#101923;color:#fff;font-size:17px;cursor:pointer}#cwmTesterPanel .tStatus{font:800 9px/1.45 ui-monospace,monospace;color:#9eb3c6;margin:4px 0}#cwmTesterPanel .tButtons{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:9px}#cwmTesterPanel button.tWarp{border:1px solid #36516c;background:#0c1823;color:#effaff;border-radius:9px;padding:9px 6px;font:900 10px system-ui;cursor:pointer}#cwmTesterPanel button.tWarp:hover{border-color:#69e7ff;background:#102535}#cwmTesterPanel .tHint{margin-top:8px;color:#617a90;font:800 8px/1.4 system-ui}`;
    document.head.appendChild(css);
    panel=document.createElement('div');panel.id='cwmTesterPanel';
    panel.innerHTML=`<div class="tHead"><div class="tTitle">CWM TESTER WARP</div><button class="tClose" type="button">×</button></div><div class="tStatus" id="cwmTesterZone"></div><div class="tStatus" id="cwmTesterRenderer"></div><div class="tStatus" id="cwmTesterBridge"></div><div class="tStatus" id="cwmTesterDraw"></div><div class="tStatus" id="cwmTesterSprites"></div><div class="tButtons"><button class="tWarp" data-warp="prev">← PREV</button><button class="tWarp" data-warp="sewer">SEWER</button><button class="tWarp" data-warp="next">NEXT →</button><button class="tWarp" data-warp="first">AREA 1</button><button class="tWarp" data-warp="reload">RELOAD</button><button class="tWarp" data-warp="close">HIDE</button></div><div class="tHint">Ctrl + Shift + ← / → • Ctrl + Shift + 2 = sewer • Ctrl + Shift + \` = panel<br>Mobile: tap the extreme top-left corner 5 times quickly.</div>`;
    document.body.appendChild(panel);
    zoneText=panel.querySelector('#cwmTesterZone');rendererText=panel.querySelector('#cwmTesterRenderer');bridgeText=panel.querySelector('#cwmTesterBridge');drawText=panel.querySelector('#cwmTesterDraw');spriteText=panel.querySelector('#cwmTesterSprites');
    panel.querySelector('.tClose').onclick=()=>panel.classList.remove('show');
    panel.addEventListener('click',e=>{const b=e.target.closest('[data-warp]');if(!b)return;const a=b.dataset.warp;if(a==='prev')nextZone(-1);else if(a==='next')nextZone(1);else if(a==='sewer')cleanWarp(1);else if(a==='first')cleanWarp(0);else if(a==='reload')cleanWarp(currentZone());else if(a==='close')panel.classList.remove('show')});
    updatePanel();return panel;
  }
  function togglePanel(){const p=ensurePanel();p.classList.toggle('show');updatePanel()}

  addEventListener('keydown',e=>{if(!(e.ctrlKey&&e.shiftKey))return;if(e.code==='ArrowRight'){e.preventDefault();nextZone(1)}else if(e.code==='ArrowLeft'){e.preventDefault();nextZone(-1)}else if(e.code==='Digit2'){e.preventDefault();cleanWarp(1)}else if(e.code==='Backquote'){e.preventDefault();togglePanel()}},true);
  addEventListener('pointerdown',e=>{if(e.clientX>74||e.clientY>74)return;const t=performance.now();cornerTaps.push(t);cornerTaps=cornerTaps.filter(x=>t-x<1600);if(cornerTaps.length>=5){cornerTaps=[];togglePanel()}},true);
  setInterval(()=>{if(panel?.classList.contains('show'))updatePanel()},300);

  globalThis.CWM_TESTER={build:BUILD,show:()=>{ensurePanel().classList.add('show');updatePanel()},hide:()=>panel?.classList.remove('show'),warp:cleanWarp,sewer:()=>cleanWarp(1),next:()=>nextZone(1),prev:()=>nextZone(-1),status:()=>({zone:currentZone(),name:zoneName(currentZone()),renderer:globalThis.CWM_V2_RENDERER||null,bridge:globalThis.__CWM_NATIVE_RENDER_BRIDGE||null,lastDraw:globalThis.__CWM_V2_LAST_DRAW||null,sprites:globalThis.CWM_V2_SPRITES||null})};
  console.info('CWM hidden tester shortcuts loaded',BUILD);
})();

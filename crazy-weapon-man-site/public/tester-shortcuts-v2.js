(()=>{
  if(globalThis.__CWM_TESTER_SHORTCUTS)return;
  globalThis.__CWM_TESTER_SHORTCUTS=true;

  const BUILD='tester-warp-20260914a';
  let panel=null, zoneText=null, rendererText=null;
  let cornerTaps=[];

  const campaign=()=>{
    try{return window.__KM_DEBUG?.campaign?.()||[]}catch(_){return []}
  };
  const currentZone=()=>{
    try{return Number(window.__KM_DEBUG?.progress?.().zone??0)||0}catch(_){return 0}
  };
  const zoneName=i=>campaign()[i]?.name||`AREA ${i+1}`;

  function toast(msg,col='#8ff8ff'){
    try{if(typeof txt==='function'&&typeof pl!=='undefined')txt(pl.x+pl.w/2,pl.y-78,msg,col,true)}catch(_){ }
    try{if(typeof U!=='undefined'&&U.msg)U.msg.textContent=msg}catch(_){ }
  }

  function updatePanel(){
    if(!panel)return;
    const i=currentZone(), zones=campaign();
    if(zoneText)zoneText.textContent=`AREA ${i+1}/${Math.max(1,zones.length)} • ${zoneName(i)}`;
    const render=globalThis.CWM_V2_RENDERER;
    if(rendererText)rendererText.textContent=render?`V2 RENDERER: ${render.build} • ${render.zone}`:'V2 RENDERER: NOT LOADED';
  }

  function cleanWarp(i){
    const zones=campaign();
    if(!zones.length||!window.__KM_DEBUG)return false;
    i=Math.max(0,Math.min(zones.length-1,Number(i)||0));
    try{
      if(typeof reset==='function')reset();
      window.__KM_DEBUG.setZone(i);
      window.__KM_DEBUG.start();
      try{
        if(typeof pl!=='undefined'){
          pl.x=82;pl.y=Math.max(20,(typeof G!=='undefined'?G:650)-pl.h-8);
          pl.vx=0;pl.vy=0;pl.hp=pl.max;pl.inv=1.2;
        }
        if(typeof packDelay!=='undefined')packDelay=.12;
        if(typeof packLive!=='undefined')packLive=false;
      }catch(_){ }
      setTimeout(()=>{
        try{if(typeof spawnPack==='function'&&!over&&!bossMode&&!packLive)spawnPack()}catch(_){ }
      },80);
      toast(`TESTER WARP → ${zoneName(i)}`,'#fff176');
      setTimeout(updatePanel,0);
      return true;
    }catch(e){
      console.warn('CWM tester warp failed',e);
      toast('TESTER WARP FAILED','#ff7283');
      return false;
    }
  }

  function nextZone(delta){return cleanWarp(currentZone()+delta)}

  function ensurePanel(){
    if(panel)return panel;
    const css=document.createElement('style');
    css.textContent=`
      #cwmTesterPanel{position:fixed;left:10px;top:10px;z-index:2147483000;width:min(330px,calc(100vw - 20px));border:1px solid #6fe7ff66;border-radius:12px;background:#050a10ed;color:#eaf8ff;box-shadow:0 18px 60px #000c;padding:10px;font-family:system-ui;display:none;backdrop-filter:blur(9px)}
      #cwmTesterPanel.show{display:block}#cwmTesterPanel .tHead{display:flex;align-items:center;gap:8px;margin-bottom:8px}#cwmTesterPanel .tTitle{font:1000 12px/1 system-ui;letter-spacing:.09em;color:#fff176;margin-right:auto}#cwmTesterPanel .tClose{width:30px;height:30px;border:1px solid #ffffff30;border-radius:8px;background:#101923;color:#fff;font-size:17px;cursor:pointer}
      #cwmTesterPanel .tStatus{font:800 9px/1.45 ui-monospace,monospace;color:#9eb3c6;margin:4px 0}#cwmTesterPanel .tButtons{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:9px}#cwmTesterPanel button.tWarp{border:1px solid #36516c;background:#0c1823;color:#effaff;border-radius:9px;padding:9px 6px;font:900 10px system-ui;cursor:pointer}#cwmTesterPanel button.tWarp:hover{border-color:#69e7ff;background:#102535}#cwmTesterPanel .tHint{margin-top:8px;color:#617a90;font:800 8px/1.4 system-ui}
    `;
    document.head.appendChild(css);
    panel=document.createElement('div');panel.id='cwmTesterPanel';
    panel.innerHTML=`<div class="tHead"><div class="tTitle">CWM TESTER WARP</div><button class="tClose" type="button">×</button></div><div class="tStatus" id="cwmTesterZone"></div><div class="tStatus" id="cwmTesterRenderer"></div><div class="tButtons"><button class="tWarp" data-warp="prev">← PREV</button><button class="tWarp" data-warp="sewer">SEWER</button><button class="tWarp" data-warp="next">NEXT →</button><button class="tWarp" data-warp="first">AREA 1</button><button class="tWarp" data-warp="reload">RELOAD</button><button class="tWarp" data-warp="close">HIDE</button></div><div class="tHint">Keyboard: Ctrl + Shift + ← / → • Ctrl + Shift + 2 = sewer<br>Mobile/hidden: tap the extreme top-left corner 5 times quickly.</div>`;
    document.body.appendChild(panel);
    zoneText=panel.querySelector('#cwmTesterZone');rendererText=panel.querySelector('#cwmTesterRenderer');
    panel.querySelector('.tClose').onclick=()=>panel.classList.remove('show');
    panel.addEventListener('click',e=>{
      const b=e.target.closest('[data-warp]');if(!b)return;
      const a=b.dataset.warp;
      if(a==='prev')nextZone(-1);else if(a==='next')nextZone(1);else if(a==='sewer')cleanWarp(1);else if(a==='first')cleanWarp(0);else if(a==='reload')cleanWarp(currentZone());else if(a==='close')panel.classList.remove('show');
    });
    updatePanel();
    return panel;
  }

  function togglePanel(){const p=ensurePanel();p.classList.toggle('show');updatePanel()}

  addEventListener('keydown',e=>{
    if(!(e.ctrlKey&&e.shiftKey))return;
    if(e.code==='ArrowRight'){e.preventDefault();nextZone(1)}
    else if(e.code==='ArrowLeft'){e.preventDefault();nextZone(-1)}
    else if(e.code==='Digit2'){e.preventDefault();cleanWarp(1)}
    else if(e.code==='Backquote'){e.preventDefault();togglePanel()}
  },true);

  addEventListener('pointerdown',e=>{
    if(e.clientX>74||e.clientY>74)return;
    const t=performance.now();cornerTaps.push(t);cornerTaps=cornerTaps.filter(x=>t-x<1600);
    if(cornerTaps.length>=5){cornerTaps=[];togglePanel()}
  },true);

  globalThis.CWM_TESTER={
    build:BUILD,
    show:()=>{ensurePanel().classList.add('show');updatePanel()},
    hide:()=>panel?.classList.remove('show'),
    warp:cleanWarp,
    sewer:()=>cleanWarp(1),
    next:()=>nextZone(1),
    prev:()=>nextZone(-1),
    status:()=>({zone:currentZone(),name:zoneName(currentZone()),renderer:globalThis.CWM_V2_RENDERER||null})
  };
  console.info('CWM hidden tester shortcuts loaded',BUILD);
})();

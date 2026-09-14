(()=>{
  const COLOR_KEY='crazyWeaponMan.characterColor.v1';
  const PALETTE=[
    ['Slate','#566a84'],['Red','#b93f4b'],['Blue','#3f6fb9'],['Green','#3b8c62'],['Gold','#b88a32'],['Purple','#7a4fb2'],['Black','#242a34'],['White','#dce2e9']
  ];
  let characterColor=localStorage.getItem(COLOR_KEY)||'#566a84';

  const style=document.createElement('style');
  style.textContent=`
  .cwmColorPick{margin:12px auto 14px;max-width:520px}.cwmColorPickLabel{font:900 10px system-ui;letter-spacing:.18em;color:#9fb2c8;margin-bottom:7px}.cwmColorRow{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.cwmColorBtn{width:34px;height:34px;border-radius:50%;border:2px solid #ffffff55;box-shadow:0 3px 12px #0008;cursor:pointer;padding:0}.cwmColorBtn.active{border-color:#fff176;box-shadow:0 0 0 3px #fff17622,0 3px 12px #0008;transform:scale(1.08)}
  .cwmMobileFab{display:none;position:absolute;z-index:42;top:max(8px,env(safe-area-inset-top));width:36px;height:36px;border-radius:11px;border:1px solid #ffffff4a;background:#07101be6;color:#fff;font:900 16px system-ui;box-shadow:0 5px 18px #0009;touch-action:manipulation}.cwmMobileFab.lb{right:max(8px,env(safe-area-inset-right))}.cwmMobileFab.pause{right:calc(max(8px,env(safe-area-inset-right)) + 44px)}
  .cwmMobileDrawer{display:none;position:absolute;z-index:45;top:50px;right:8px;width:min(88vw,340px);max-height:62%;overflow:auto;padding:10px;border:1px solid #3b4e68;border-radius:14px;background:#08101af2;box-shadow:0 16px 40px #000c}.cwmMobileDrawer.show{display:block}.cwmMobileDrawer h3{margin:0 0 8px;font-size:14px}.cwmMobileDrawer .leaderboard{display:block!important}.cwmMobileDrawer .lbrow{font-size:10px!important;padding:6px!important}.cwmMobileDrawer .lbname{font-size:10px!important}.cwmMobileDrawer .lbmeta{font-size:8px!important}.cwmMobileDrawer .lbdps{font-size:10px!important}
  @media (max-width:900px),(pointer:coarse){
    body.touchDevice.playing .stage{width:min(100vw,calc(100dvh * 1.7777778))!important;max-height:100dvh!important;border-radius:0!important;border:0!important;overflow:hidden!important;background:#02050a!important}
    body.touchDevice.playing canvas#game{--cwm-mobile-zoom:1.5;transform:scale(var(--cwm-mobile-zoom))!important;transform-origin:var(--cwm-cam-x,50%) var(--cwm-cam-y,73%)!important;will-change:transform,transform-origin;image-rendering:auto}
    body.touchDevice.playing .fsTop{height:72px!important;min-height:72px!important;display:grid!important;grid-template-columns:minmax(0,1fr) 122px!important;gap:5px!important;padding:4px!important;background:linear-gradient(#050a12e8,#050a12a8,transparent)!important}
    body.touchDevice.playing .fsWeapon{grid-template-columns:1fr!important;padding:4px 6px!important;gap:2px!important;background:#07101bc4!important;border-radius:8px!important}
    body.touchDevice.playing .fsWeapon canvas{display:none!important}
    body.touchDevice.playing .fsWeaponCopy{display:block!important}.fsLabel{display:none!important}
    body.touchDevice.playing .fsWName{font-size:11px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fsDps{font-size:18px!important;line-height:1!important}.fsMeta{font-size:7px!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px!important}.fsAttrs{display:none!important}
    body.touchDevice.playing .fsVitals{padding:4px 6px!important;background:#07101bc4!important;border-radius:8px!important}.fsVRow{grid-template-columns:22px 1fr 35px!important;font-size:7px!important;margin:2px 0!important}.fsVRow:nth-child(2),.fsVRow:nth-child(4){display:none!important}.fsBar{height:7px!important}
    body.touchDevice.playing .fsZone{font-size:8px!important;top:78px!important;left:8px!important;max-width:44vw!important}.fsZone b{font-size:9px!important}.fsZone span{font-size:7px!important}
    body.touchDevice.playing .styleHud,body.touchDevice.playing .augmentHud,body.touchDevice.playing .shardHud{display:none!important}
    body.touchDevice.playing .killChainHud{transform:scale(.72);transform-origin:bottom right;right:4px!important;bottom:4px!important}
    body.touchDevice.playing .bossHud{top:76px!important;width:70%!important}.bossName{font-size:14px!important}.bossSub{font-size:8px!important}.bossBar{height:10px!important}
    body.touchDevice.playing .banner{top:110px!important;transform:translateX(-50%) scale(.78)!important;transform-origin:top center}
    body.touchDevice.playing .waveIntro{transform:scale(.78);transform-origin:center}
    body.touchDevice.playing .thumbHint{display:none!important}
    body.touchDevice.playing .cwmMobileFab{display:block}
  }
  @media (orientation:portrait) and (max-width:900px){body.touchDevice.playing canvas#game{--cwm-mobile-zoom:1.28}}
  @media (max-height:500px) and (orientation:landscape){
    body.touchDevice.playing canvas#game{--cwm-mobile-zoom:1.62}
    body.touchDevice.playing .fsTop{height:58px!important;min-height:58px!important;grid-template-columns:minmax(0,1fr) 105px!important}.fsDps{font-size:16px!important}.fsZone{top:61px!important}.cwmMobileFab{width:32px;height:32px;font-size:14px}.cwmMobileDrawer{top:42px;max-height:72%}
  }`;
  document.head.appendChild(style);

  function installColorPicker(){
    const title=document.querySelector('.titleInner');
    const start=document.getElementById('startGame');
    if(!title||!start||document.getElementById('cwmColorPick'))return;
    const box=document.createElement('div');box.id='cwmColorPick';box.className='cwmColorPick';
    box.innerHTML='<div class="cwmColorPickLabel">CHARACTER COLOR</div><div class="cwmColorRow"></div>';
    const row=box.querySelector('.cwmColorRow');
    for(const [name,col] of PALETTE){
      const b=document.createElement('button');b.type='button';b.className='cwmColorBtn';b.title=name;b.setAttribute('aria-label',name);b.style.background=col;b.dataset.color=col;b.classList.toggle('active',col.toLowerCase()===characterColor.toLowerCase());
      b.onclick=()=>{characterColor=col;localStorage.setItem(COLOR_KEY,col);row.querySelectorAll('.cwmColorBtn').forEach(x=>x.classList.toggle('active',x===b))};row.appendChild(b);
    }
    start.insertAdjacentElement('beforebegin',box);
  }

  function drawCharacterColor(){
    if(typeof X==='undefined'||typeof pl==='undefined'||!gameStarted)return;
    const run=pl.on?Math.min(1,Math.abs(pl.vx)/190):0,st=Math.sin(time*12)*9*run,bob=Math.abs(Math.sin(time*12))*2*run,breathe=1+Math.sin(time*5.2)*.018;
    X.save();X.translate(pl.x+17,pl.y+25+bob);X.scale(pl.dir*1.08,breathe*1.08);X.globalAlpha=.92;
    if(!pl.armors?.body){X.fillStyle=characterColor;X.beginPath();X.roundRect(-10,-13,20,27,6);X.fill();X.globalAlpha=.5;X.beginPath();X.moveTo(-9,2);X.lineTo(-14,18);X.lineTo(-2,12);X.lineTo(2,12);X.lineTo(14,18);X.lineTo(9,2);X.closePath();X.fill();X.globalAlpha=.92}
    if(!pl.armors?.feet){X.fillStyle=characterColor;X.beginPath();X.roundRect(-12+st*.4,17,8,12,3);X.roundRect(4-st*.4,17,8,12,3);X.fill()}
    X.restore();
  }

  if(typeof playerDraw==='function'&&!globalThis.__CWM_CHARACTER_COLOR){
    globalThis.__CWM_CHARACTER_COLOR=true;const base=playerDraw;playerDraw=function(){const r=base();drawCharacterColor();return r};
  }

  function installMobileControls(){
    const stage=document.getElementById('gameStage');if(!stage||document.getElementById('cwmMobileLeaderboardBtn'))return;
    const pause=document.createElement('button');pause.id='cwmMobilePauseBtn';pause.className='cwmMobileFab pause';pause.textContent='Ⅱ';pause.setAttribute('aria-label','Pause');
    pause.onclick=e=>{e.preventDefault();e.stopPropagation();paused=!paused;pause.textContent=paused?'▶':'Ⅱ';const p=document.getElementById('pause');if(p)p.textContent=paused?'Resume':'Pause'};
    const lb=document.createElement('button');lb.id='cwmMobileLeaderboardBtn';lb.className='cwmMobileFab lb';lb.textContent='🏆';lb.setAttribute('aria-label','Leaderboard');
    const drawer=document.createElement('div');drawer.id='cwmMobileLeaderboard';drawer.className='cwmMobileDrawer';drawer.innerHTML='<h3>GLOBAL DPS</h3><div class="leaderboard"></div>';
    lb.onclick=e=>{e.preventDefault();e.stopPropagation();drawer.classList.toggle('show')};
    stage.append(pause,lb,drawer);
    const src=document.getElementById('leaderboard');const dst=drawer.querySelector('.leaderboard');
    const sync=()=>{if(src&&dst)dst.innerHTML=src.innerHTML};sync();if(src)new MutationObserver(sync).observe(src,{subtree:true,childList:true,characterData:true,attributes:true});
  }

  function startMobileCamera(){
    const stage=document.getElementById('gameStage');
    if(!stage||globalThis.__CWM_MOBILE_CAMERA)return;
    globalThis.__CWM_MOBILE_CAMERA=true;
    let camX=50,camY=73;
    const clampCam=(n,a,b)=>Math.max(a,Math.min(b,n));
    const frame=()=>{
      if(document.body.classList.contains('touchDevice')&&document.body.classList.contains('playing')&&typeof pl!=='undefined'&&typeof W!=='undefined'&&typeof H!=='undefined'){
        const px=((pl.x+(pl.w||34)/2)/W)*100;
        const py=((pl.y+(pl.h||58)*.58)/H)*100;
        const targetX=clampCam(px,34,66);
        const targetY=clampCam(py,66,76);
        camX+=(targetX-camX)*.12;
        camY+=(targetY-camY)*.10;
        stage.style.setProperty('--cwm-cam-x',camX.toFixed(2)+'%');
        stage.style.setProperty('--cwm-cam-y',camY.toFixed(2)+'%');
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  installColorPicker();installMobileControls();startMobileCamera();
})();

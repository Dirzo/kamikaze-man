(()=>{
  const style=document.createElement('style');
  style.textContent=`
  .cwmMiniHud,.cwmPauseOverlay{display:none}
  @media (max-width:900px),(pointer:coarse){
    body.touchDevice.playing{overflow:hidden!important;background:#02050a!important}
    body.touchDevice.playing .stage{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;max-width:none!important;max-height:none!important;aspect-ratio:auto!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:hidden!important;background:#02050a!important}
    body.touchDevice.playing canvas#game{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;aspect-ratio:auto!important;object-fit:cover!important;--cwm-mobile-zoom:1.16!important;transform:scale(var(--cwm-mobile-zoom))!important;transform-origin:var(--cwm-cam-x,50%) var(--cwm-cam-y,72%)!important}
    body.touchDevice.playing .fsTop,body.touchDevice.playing .fsBottom,body.touchDevice.playing .fsZone{display:none!important}
    body.touchDevice.playing .cwmMobileFab.lb{display:none!important}
    body.touchDevice.playing .cwmMobileFab.pause{display:block!important;right:max(8px,env(safe-area-inset-right))!important;top:max(8px,env(safe-area-inset-top))!important;width:34px!important;height:34px!important;border-radius:10px!important;font-size:15px!important;background:#050a10c9!important;backdrop-filter:blur(4px)}
    body.touchDevice.playing .bossHud{top:max(48px,calc(env(safe-area-inset-top) + 42px))!important;width:min(72vw,560px)!important}.bossName{font-size:12px!important}.bossSub{font-size:7px!important}.bossBar{height:8px!important}
    body.touchDevice.playing .killChainHud{transform:scale(.62)!important;transform-origin:bottom right!important;right:4px!important;bottom:4px!important}
    body.touchDevice.playing .banner{top:56px!important;transform:translateX(-50%) scale(.66)!important;transform-origin:top center!important}
    body.touchDevice.playing .waveIntro{transform:scale(.72)!important;transform-origin:center!important}
    body.touchDevice.playing .cwmMiniHud{display:block;position:absolute;z-index:40;top:max(8px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));max-width:64vw;color:#f4f8ff;text-shadow:0 2px 5px #000,0 0 8px #000;font:800 10px/1.18 system-ui;letter-spacing:.01em;pointer-events:none}
    .cwmMiniHud .main{font-size:11px;font-weight:1000}.cwmMiniHud .sub{font-size:9px;color:#c8d7e8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cwmMiniHud .zone{font-size:9px;color:#9fb4ca;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;position:static!important;display:block!important;background:none!important;text-align:left!important}
    body.touchDevice.playing .cwmPauseOverlay.show{display:flex}
    .cwmPauseOverlay{position:absolute;inset:0;z-index:80;align-items:center;justify-content:center;padding:12px;background:#02050ae8;backdrop-filter:blur(9px);overflow:auto}
    .cwmPauseCard{width:min(94vw,780px);max-height:92dvh;overflow:auto;border:1px solid #ffffff2f;border-radius:18px;background:linear-gradient(155deg,#101826f5,#060a10fa);box-shadow:0 24px 80px #000;padding:16px;color:#eef6ff}
    .cwmPauseTop{display:flex;align-items:center;justify-content:space-between;gap:12px}.cwmPauseTitle{font:1000 24px/1 system-ui;letter-spacing:-.03em}.cwmPauseResume{border:0;border-radius:12px;padding:10px 15px;font:1000 13px system-ui;background:linear-gradient(90deg,#fff176,#78e8ff);color:#071019}
    .cwmPauseGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.cwmPauseBox{border:1px solid #ffffff20;border-radius:12px;background:#ffffff08;padding:10px}.cwmPauseBox h4{margin:0 0 7px;font:1000 10px system-ui;letter-spacing:.14em;color:#9fb4ca}.cwmPauseStat{font:900 12px/1.45 system-ui}.cwmPauseWeapon{font:1000 16px/1.08 system-ui;color:#fff176;margin-bottom:5px}.cwmPauseMeta{font:800 10px/1.4 system-ui;color:#c7d5e5}.cwmPauseLb{grid-column:1/-1}.cwmPauseLb .leaderboard{display:block!important}.cwmPauseLb .lbrow{padding:6px!important;font-size:10px!important}.cwmPauseLb .lbname{font-size:10px!important}.cwmPauseLb .lbmeta{font-size:8px!important}.cwmPauseLb .lbdps{font-size:10px!important}
    @media (max-width:620px){.cwmPauseGrid{grid-template-columns:1fr}.cwmPauseLb{grid-column:auto}.cwmPauseCard{padding:12px}.cwmPauseTitle{font-size:20px}}
  }
  @media (orientation:portrait) and (max-width:900px){body.touchDevice.playing canvas#game{object-fit:contain!important;--cwm-mobile-zoom:1.22!important}}
  @media (orientation:landscape) and (max-height:560px){body.touchDevice.playing canvas#game{object-fit:cover!important;--cwm-mobile-zoom:1.22!important}.cwmMiniHud .main{font-size:10px}.cwmMiniHud .sub,.cwmMiniHud .zone{font-size:8px}.cwmPauseCard{max-height:96dvh;padding:10px}.cwmPauseTitle{font-size:19px}}
  `;
  document.head.appendChild(style);

  const stage=document.getElementById('gameStage');
  if(!stage)return;

  let mini=document.getElementById('cwmMiniHud');
  if(!mini){
    mini=document.createElement('div');
    mini.id='cwmMiniHud';mini.className='cwmMiniHud';
    mini.innerHTML='<div class="main" id="cwmMiniMain"></div><div class="sub" id="cwmMiniSub"></div><div class="zone" id="cwmMiniZone"></div>';
    stage.appendChild(mini);
  }

  let overlay=document.getElementById('cwmPauseOverlay');
  if(!overlay){
    overlay=document.createElement('div');overlay.id='cwmPauseOverlay';overlay.className='cwmPauseOverlay';
    overlay.innerHTML=`<div class="cwmPauseCard"><div class="cwmPauseTop"><div class="cwmPauseTitle">PAUSED</div><button class="cwmPauseResume" id="cwmPauseResume">RESUME</button></div><div class="cwmPauseGrid"><div class="cwmPauseBox"><h4>RUN</h4><div class="cwmPauseStat" id="cwmPauseRun"></div></div><div class="cwmPauseBox"><h4>CURRENT WEAPON</h4><div class="cwmPauseWeapon" id="cwmPauseWeapon"></div><div class="cwmPauseMeta" id="cwmPauseWeaponMeta"></div></div><div class="cwmPauseBox cwmPauseLb"><h4>GLOBAL DPS LEADERBOARD</h4><div class="leaderboard" id="cwmPauseLeaderboard"></div></div></div></div>`;
    stage.appendChild(overlay);
  }

  const text=id=>document.getElementById(id)?.textContent?.trim()||'';
  const cleanZone=()=>{
    const raw=text('fsZone');
    return raw.replace(/\s+/g,' ').trim();
  };
  const getKills=()=>typeof kills!=='undefined'?Number(kills||0):0;

  function updateReadouts(){
    const dps=text('fsDps')||((typeof estimateDPS==='function'&&typeof curW==='function')?Math.round(estimateDPS(curW())).toLocaleString()+' DPS':'');
    const hp=text('fsHpT');
    const lv=text('fsLv');
    const w=text('fsWName');
    const meta=text('fsMeta');
    const zone=cleanZone();
    const k=getKills();
    const main=document.getElementById('cwmMiniMain');
    const sub=document.getElementById('cwmMiniSub');
    const z=document.getElementById('cwmMiniZone');
    if(main)main.textContent=[dps,hp?`HP ${hp}`:'',lv?`LV ${lv}`:'',`K ${k}`].filter(Boolean).join('  •  ');
    if(sub)sub.textContent=[w,meta].filter(Boolean).join('  •  ');
    if(z)z.textContent=zone;

    const run=document.getElementById('cwmPauseRun');
    if(run){
      const xp=text('fsXpT'),mana=text('fsMpT'),rift=text('fsMasteryT');
      const slaughter=typeof styleScore!=='undefined'?Math.max(0,Math.floor(styleScore||0)):0;
      run.innerHTML=[
        hp?`HP ${hp}`:'',mana?`Mana ${mana}`:'',xp?`XP ${xp}`:'',rift?`Rift ${rift}`:'',lv?`Level ${lv}`:'',`Kills ${k}`,`Slaughter ${slaughter.toLocaleString()}`,zone
      ].filter(Boolean).join('<br>');
    }
    const pw=document.getElementById('cwmPauseWeapon');if(pw)pw.textContent=w||'No weapon data';
    const pwm=document.getElementById('cwmPauseWeaponMeta');if(pwm)pwm.textContent=[dps,meta].filter(Boolean).join(' • ');
    const src=document.getElementById('leaderboard'),dst=document.getElementById('cwmPauseLeaderboard');
    if(src&&dst&&overlay.classList.contains('show'))dst.innerHTML=src.innerHTML;
    requestAnimationFrame(updateReadouts);
  }
  requestAnimationFrame(updateReadouts);

  const pauseBtn=document.getElementById('cwmMobilePauseBtn');
  const resumeBtn=document.getElementById('cwmPauseResume');
  function openPause(){
    if(typeof paused!=='undefined')paused=true;
    overlay.classList.add('show');
    if(pauseBtn)pauseBtn.textContent='▶';
  }
  function closePause(){
    overlay.classList.remove('show');
    if(typeof paused!=='undefined')paused=false;
    if(pauseBtn)pauseBtn.textContent='Ⅱ';
  }
  if(pauseBtn)pauseBtn.onclick=e=>{e.preventDefault();e.stopPropagation();overlay.classList.contains('show')?closePause():openPause()};
  if(resumeBtn)resumeBtn.onclick=e=>{e.preventDefault();e.stopPropagation();closePause()};
})();

(()=>{
  if(globalThis.__CWL_COMBAT_PRESENTATION_V1)return;
  globalThis.__CWL_COMBAT_PRESENTATION_V1=true;
  const BUILD='cwl-combat-presentation-v1-20260915d';
  const DESKTOP_SCALE=1.26;
  const nf=n=>Math.max(0,Math.round(Number(n)||0)).toLocaleString();
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const desktop=()=>innerWidth>=981&&!(matchMedia?.('(pointer:coarse)')?.matches);

  const style=document.createElement('style');
  style.textContent=`
    #cwlDesktopCombatHud{display:none;position:absolute;z-index:28;left:12px;right:12px;bottom:10px;align-items:flex-end;justify-content:space-between;gap:16px;pointer-events:none;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;text-shadow:0 1px 0 #000,0 2px 8px #000}
    body.cwlDesktopCombat #cwlDesktopCombatHud{display:flex}
    .cwlCombatCard{border:1px solid #ffffff2b;border-radius:12px;background:linear-gradient(145deg,#06101be8,#09111ad2);box-shadow:0 9px 28px #0008;backdrop-filter:blur(8px);color:#eff7ff}
    .cwlCombatWeapon{width:min(360px,32vw);padding:8px 11px}.cwlCombatKicker{font:1000 8px/1 system-ui;letter-spacing:.18em;color:#8fc5db}.cwlCombatName{font:1000 15px/.98 system-ui;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px}.cwlCombatRow{display:flex;align-items:baseline;gap:9px;margin-top:3px}.cwlCombatDps{font:1000 22px/1 system-ui;color:#fff176}.cwlCombatMeta{font:900 9px/1.15 system-ui;color:#b7c9dc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cwlCombatFlavor{font:850 8px/1.18 system-ui;color:#7feaff;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .cwlCombatVitals{width:min(340px,30vw);padding:8px 10px}.cwlVital{display:grid;grid-template-columns:34px 1fr 66px;gap:6px;align-items:center;margin:3px 0;font:900 9px/1 system-ui;color:#dbe8f5}.cwlVital b{font-size:8px;color:#a9bad0}.cwlVitalTrack{height:6px;border-radius:99px;background:#000b;overflow:hidden}.cwlVitalTrack i{display:block;height:100%;width:0;border-radius:inherit}.cwlVital.hp i{background:linear-gradient(90deg,#ff465b,#ff8190)}.cwlVital.mp i{background:linear-gradient(90deg,#5578ff,#78c8ff)}.cwlVital.xp i{background:linear-gradient(90deg,#e5a73f,#ffe17a)}.cwlVital.lv .cwlVitalTrack{background:linear-gradient(90deg,#69e8ff22,#ff72d622)}.cwlVital.lv i{background:linear-gradient(90deg,#69e8ff,#ff72d6)}
    @media (min-width:981px){
      body.cwlDesktopCombat .fsTop{display:none!important}
      body.cwlDesktopCombat .styleHud,body.cwlDesktopCombat .killChainHud{display:none!important}
      body.cwlDesktopCombat .fsBottom{top:7px!important;right:8px!important;bottom:auto!important;left:auto!important;transform:scale(.62)!important;transform-origin:top right!important;gap:4px!important;padding:4px 6px!important;opacity:.54!important;border-radius:9px!important;background:#050b13b8!important}
      body.cwlDesktopCombat .fsKey{min-width:45px!important;padding:4px 5px!important;font-size:7px!important}.fsKey b{font-size:10px!important}
      body.cwlDesktopCombat .fsZone{top:7px!important;left:8px!important;right:auto!important;bottom:auto!important;transform:scale(.82)!important;transform-origin:top left!important;font-size:9px!important;padding:4px 6px!important;opacity:.76!important}
      body.cwlDesktopCombat .shardHud{top:86px!important;left:9px!important;width:178px!important;padding:5px 7px!important;border-radius:9px!important;transform:scale(.86)!important;transform-origin:top left!important;box-shadow:0 6px 18px #0007!important;background:#050a12bd!important;opacity:.82!important}
      body.cwlDesktopCombat .shardHud:not(.ready){width:162px!important;padding:4px 6px!important}
      body.cwlDesktopCombat .shardHud:not(.ready) .shardDesc,body.cwlDesktopCombat .shardHud:not(.ready) .shardBar,body.cwlDesktopCombat .shardHud:not(.ready) .shardBtn{display:none!important}
      body.cwlDesktopCombat .shardHud:not(.ready) .shardName{font-size:10px!important;margin-top:2px!important;opacity:.82!important}
      body.cwlDesktopCombat .shardTag{font-size:6px!important}.shardCount{font-size:10px!important}.shardName{font-size:12px!important}.shardDesc{font-size:7px!important}.shardBar{height:3px!important;margin-top:4px!important}.shardBtn{font-size:7px!important;padding:4px!important}
      body.cwlDesktopCombat .augmentHud{top:88px!important;right:9px!important;width:205px!important;padding:6px 8px!important;transform:scale(.9)!important;transform-origin:top right!important}.augmentName{font-size:14px!important}.augmentDesc{font-size:7px!important}
      body.cwlDesktopCombat #cwlSpecialHud{top:48px!important;left:8px!important;opacity:.72!important;transform:scale(.86);transform-origin:top left}
      body.cwlDesktopCombat #cwlThreatTag{top:6px!important;right:207px!important;opacity:.48!important;transform:scale(.88);transform-origin:top right}
      body.cwlDesktopCombat #cwlSlayerHud{top:48px!important;font-size:8px!important;padding:4px 7px!important}
      body.cwlDesktopCombat .bossHud{top:50px!important;width:min(650px,56%)!important}.bossName{font-size:16px!important}.bossSub{font-size:8px!important}.bossBar{height:10px!important}
      body.cwlDesktopCombat .banner{top:88px!important;transform:translateX(-50%) scale(.76)!important;transform-origin:top center!important}
      body.cwlDesktopCombat .fsUpgrade{top:27%!important;max-width:60%!important}.fsUpgrade .u1{font-size:10px!important}.fsUpgrade .u2{font-size:clamp(23px,3vw,40px)!important}.fsUpgrade .u3{font-size:12px!important}
    }
    @media (min-width:981px) and (max-height:760px){#cwlDesktopCombatHud{bottom:7px}.cwlCombatWeapon{width:310px;padding:6px 9px}.cwlCombatName{font-size:13px}.cwlCombatDps{font-size:19px}.cwlCombatVitals{width:300px;padding:6px 8px}.cwlVital{margin:2px 0}.cwlVitalTrack{height:5px}body.cwlDesktopCombat .shardHud{top:74px!important}}
  `;
  document.head.appendChild(style);

  const stage=()=>document.getElementById('gameStage')||document.querySelector('.stage')||document.body;
  let hud=null;
  function ensureHud(){
    if(hud&&hud.isConnected)return hud;
    hud=document.createElement('div');hud.id='cwlDesktopCombatHud';
    hud.innerHTML=`<div class="cwlCombatCard cwlCombatWeapon"><div class="cwlCombatKicker" id="cwlCombatKicker">HEAVY LOADOUT</div><div class="cwlCombatName" id="cwlCombatName">—</div><div class="cwlCombatRow"><div class="cwlCombatDps" id="cwlCombatDps">0 DPS</div><div class="cwlCombatMeta" id="cwlCombatMeta"></div></div><div class="cwlCombatFlavor" id="cwlCombatFlavor"></div></div><div class="cwlCombatCard cwlCombatVitals"><div class="cwlVital hp"><b>HP</b><div class="cwlVitalTrack"><i id="cwlHudHp"></i></div><span id="cwlHudHpT">—</span></div><div class="cwlVital mp"><b>MANA</b><div class="cwlVitalTrack"><i id="cwlHudMp"></i></div><span id="cwlHudMpT">—</span></div><div class="cwlVital xp"><b>XP</b><div class="cwlVitalTrack"><i id="cwlHudXp"></i></div><span id="cwlHudXpT">—</span></div><div class="cwlVital lv"><b>LV</b><div class="cwlVitalTrack"><i id="cwlHudLv"></i></div><span id="cwlHudLvT">—</span></div></div>`;
    stage().appendChild(hud);return hud;
  }
  const setW=(id,p)=>{const e=document.getElementById(id);if(e)e.style.width=clamp(p,0,100)+'%'};
  const setT=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
  function modalOpen(){return !!document.querySelector('.boonScreen.show,.deathOffer.show,.shardForge.show,.bossIntro.show,.lockScreen.show')}
  function nativeState(){try{return globalThis.CWL_NATIVE_COMBAT?.state?.()||null}catch(_){return null}}
  function updateHud(){
    const h=ensureHud(),s=nativeState();
    const p=s?.pl,w=s?.weapon,started=!!s?.gameStarted,isPaused=!!s?.paused,isOver=!!s?.over,dps=Math.round(Number(s?.dps)||0);
    const use=desktop()&&started&&!isOver;
    document.body.classList.toggle('cwlDesktopCombat',use);
    h.style.visibility=use&&!isPaused&&!modalOpen()?'visible':'hidden';
    document.documentElement.dataset.cwlCompactHud=use?'ready':'waiting';
    if(!use||!p||!w)return;
    const base=w.heavyLabel||String(w.heavyBaseId||'HEAVY').replaceAll('_',' ');
    const sig=globalThis.CWL_HEAVY_SIGNATURES?.current?.();
    const special=globalThis.CWL_HEAVY_SPECIALS?.current?.();
    setT('cwlCombatKicker',`${String(w.rar||'HEAVY').toUpperCase()} • ${String(base).toUpperCase()}`);
    setT('cwlCombatName',w.name||base);
    setT('cwlCombatDps',`${nf(dps)} DPS`);
    setT('cwlCombatMeta',[w.heavySubclass?.replace('heavy_','').toUpperCase(),`${Math.round((p.crit||0)*100)}% CRIT`].filter(Boolean).join(' • '));
    setT('cwlCombatFlavor',[sig?.short||sig?.name,special?.short?`A: ${special.short}`:''].filter(Boolean).join('  •  '));
    const hp=Math.max(0,Number(p.hp)||0),max=Math.max(1,Number(p.max)||1),mp=Math.max(0,Number(p.mana)||0),mpMax=Math.max(1,Number(p.maxMana)||100),xp=Math.max(0,Number(p.xp)||0),xpn=Math.max(1,Number(p.xpn)||1),lv=Math.max(1,Number(p.lv)||1);
    setW('cwlHudHp',hp/max*100);setT('cwlHudHpT',`${Math.ceil(hp)}/${Math.ceil(max)}`);
    setW('cwlHudMp',mp/mpMax*100);setT('cwlHudMpT',`${Math.ceil(mp)}/${Math.ceil(mpMax)}`);
    setW('cwlHudXp',xp/xpn*100);setT('cwlHudXpT',`${Math.floor(xp)}/${Math.floor(xpn)}`);
    setW('cwlHudLv',(lv%10)/10*100);setT('cwlHudLvT',String(lv));
  }

  let scaledBase=null,scaledWrapper=null;
  function installPlayerScale(){
    if(!desktop())return;
    const body=globalThis.CWL_HEAVY_BODY,hook=globalThis.__CWM_RENDER_HOOK;
    if(!body?.drawPlayer||!hook)return;
    if(!scaledBase||scaledBase.__cwlPresentationWrapper){
      const candidate=body.drawPlayer.__cwlPresentationWrapper?body.drawPlayer.__cwlPresentationBase:body.drawPlayer;
      if(typeof candidate==='function'&&!candidate.__cwlPresentationWrapper)scaledBase=candidate;
    }
    if(!scaledBase)return;
    if(!scaledWrapper){
      scaledWrapper=function(ctx){
        if(!desktop()||!ctx?.X||!ctx?.pl)return scaledBase(ctx);
        const X=ctx.X,p=ctx.pl,cx=p.x+p.w/2,foot=p.y+p.h;
        X.save();X.translate(cx,foot);X.scale(DESKTOP_SCALE,DESKTOP_SCALE);X.translate(-cx,-foot);
        try{return scaledBase(ctx)}finally{X.restore()}
      };
      scaledWrapper.__cwlPresentationWrapper=true;scaledWrapper.__cwlPresentationBase=scaledBase;
    }
    if(body.drawPlayer!==scaledWrapper)body.drawPlayer=scaledWrapper;
    if(hook.drawPlayer!==scaledWrapper)hook.drawPlayer=scaledWrapper;
    if(body.state){body.state.presentationScale=DESKTOP_SCALE;body.state.presentationBuild=BUILD}
  }

  let lastWidth=innerWidth;
  addEventListener('resize',()=>{if(lastWidth!==innerWidth){lastWidth=innerWidth;scaledWrapper=null;scaledBase=null}});
  setInterval(()=>{try{installPlayerScale();updateHud()}catch(e){console.warn('CWL presentation tick skipped',e)}},120);
  setTimeout(()=>{installPlayerScale();updateHud()},80);
  globalThis.CWL_COMBAT_PRESENTATION={build:BUILD,desktopScale:DESKTOP_SCALE,update:updateHud,reinstallPlayerScale:installPlayerScale,state:()=>({desktop:desktop(),hud:!!hud,scale:DESKTOP_SCALE,native:!!globalThis.CWL_NATIVE_COMBAT})};
})();

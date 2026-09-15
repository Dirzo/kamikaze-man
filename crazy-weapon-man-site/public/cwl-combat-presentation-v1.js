(()=>{
  if(globalThis.__CWL_COMBAT_PRESENTATION_V1)return;
  globalThis.__CWL_COMBAT_PRESENTATION_V1=true;
  const BUILD='cwl-combat-presentation-v2-20260915a';
  const DESKTOP_SCALE=1.26;
  const nf=n=>Math.max(0,Math.round(Number(n)||0)).toLocaleString();
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const desktop=()=>innerWidth>=1000;

  const style=document.createElement('style');
  style.id='cwlUnifiedDesktopHudStyle';
  style.textContent=`
    #cwlDesktopCombatHud{display:none;position:absolute;inset:0;z-index:46;pointer-events:none;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;color:#eef7ff;text-shadow:0 1px 0 #000,0 2px 8px #000}
    body.cwlDesktopCombat #cwlDesktopCombatHud{display:block}
    .cwlShellCard{border:1px solid #ffffff24;border-radius:10px;background:linear-gradient(145deg,#07101bdc,#070b12c9);box-shadow:0 8px 24px #0008;backdrop-filter:blur(7px)}
    .cwlTopLeft{position:absolute;left:10px;top:9px;padding:6px 9px;max-width:410px}
    .cwlTopRight{position:absolute;right:10px;top:9px;padding:6px 9px;max-width:520px;text-align:right}
    .cwlTopMain{font:1000 10px/1.05 system-ui;letter-spacing:.035em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cwlTopSub{font:850 7px/1.2 system-ui;color:#9fb5ca;margin-top:3px;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .cwlBottomWeapon{position:absolute;left:11px;bottom:10px;width:min(385px,34vw);padding:8px 11px}.cwlWeaponKicker{font:1000 7px/1 system-ui;letter-spacing:.18em;color:#8fdff1}.cwlWeaponName{font:1000 16px/.98 system-ui;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px}.cwlWeaponRow{display:flex;align-items:baseline;gap:10px;margin-top:4px}.cwlWeaponDps{font:1000 23px/1 system-ui;color:#fff176}.cwlWeaponMeta{font:900 8px/1.15 system-ui;color:#b8c9d9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cwlWeaponAbility{font:900 8px/1.25 system-ui;color:#73efff;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cwlWeaponUtility{display:flex;align-items:center;gap:8px;margin-top:5px;font:900 7px/1 system-ui;color:#92a8bc}.cwlForgeReady{display:none;pointer-events:auto;border:1px solid #fff17666;border-radius:999px;background:#fff17616;color:#fff5ad;padding:4px 7px;font:1000 7px/1 system-ui;cursor:pointer}.cwlForgeReady.show{display:inline-block}
    .cwlBottomVitals{position:absolute;right:11px;bottom:10px;width:min(350px,31vw);padding:8px 10px}.cwlVital{display:grid;grid-template-columns:35px 1fr 66px;gap:7px;align-items:center;margin:3px 0;font:900 8px/1 system-ui}.cwlVital b{font-size:7px;color:#9fb2c5}.cwlVitalTrack{height:6px;border-radius:99px;background:#000b;overflow:hidden}.cwlVitalTrack i{display:block;height:100%;width:0;border-radius:inherit}.cwlVital.hp i{background:linear-gradient(90deg,#ff465b,#ff8190)}.cwlVital.mp i{background:linear-gradient(90deg,#5578ff,#78c8ff)}.cwlVital.xp i{background:linear-gradient(90deg,#e3a43c,#ffe17a)}.cwlVital.rift i{background:linear-gradient(90deg,#69e8ff,#ff72d6)}
    .cwlSpecialReady{color:#80ff9e}.cwlSpecialCool{color:#ffcf72}.cwlChainHot{color:#fff176}.cwlDanger{color:#ff8a74}
    body.cwlDesktopCombat .fsTop,body.cwlDesktopCombat .fsBottom,body.cwlDesktopCombat .fsZone,body.cwlDesktopCombat .styleHud,body.cwlDesktopCombat .killChainHud,body.cwlDesktopCombat .shardHud,body.cwlDesktopCombat .augmentHud,body.cwlDesktopCombat .directorStamp,body.cwlDesktopCombat .waveIntro,body.cwlDesktopCombat .banner,body.cwlDesktopCombat #cwlSpecialHud,body.cwlDesktopCombat #cwlThreatTag,body.cwlDesktopCombat #cwlSlayerHud,body.cwlDesktopCombat .cwmMiniHud,body.cwlDesktopCombat .cwmMobileFab,body.cwlDesktopCombat .rotateHint{display:none!important}
    body.cwlDesktopCombat .bossHud{top:46px!important;width:min(610px,52%)!important}.bossName{font-size:15px!important}.bossSub{font-size:8px!important}.bossBar{height:9px!important}
    body.cwlDesktopCombat .fsUpgrade{top:18%!important;max-width:min(600px,54vw)!important;padding:8px 13px!important;border-radius:12px!important;background:#07101aed!important;box-shadow:0 12px 34px #000b!important}.fsUpgrade .u1{font-size:8px!important;letter-spacing:.16em!important}.fsUpgrade .u2{font-size:clamp(20px,2.6vw,34px)!important;line-height:1!important}.fsUpgrade .u3{font-size:11px!important;margin-top:4px!important}
    @media(max-height:760px){.cwlBottomWeapon,.cwlBottomVitals{bottom:7px}.cwlBottomWeapon{width:340px;padding:6px 9px}.cwlWeaponName{font-size:14px}.cwlWeaponDps{font-size:20px}.cwlBottomVitals{width:310px;padding:6px 8px}.cwlVital{margin:2px 0}.cwlVitalTrack{height:5px}}
  `;
  document.head.appendChild(style);

  const stage=()=>document.getElementById('gameStage')||document.querySelector('.stage')||document.body;
  let hud=null;
  function ensureHud(){
    if(hud&&hud.isConnected)return hud;
    hud=document.createElement('div');hud.id='cwlDesktopCombatHud';
    hud.innerHTML=`
      <div class="cwlShellCard cwlTopLeft"><div class="cwlTopMain" id="cwlZoneLine">CRAZY WEAPON LADY</div><div class="cwlTopSub" id="cwlZoneSub"></div></div>
      <div class="cwlShellCard cwlTopRight"><div class="cwlTopMain" id="cwlCombatLine"></div><div class="cwlTopSub" id="cwlCombatSub"></div></div>
      <div class="cwlShellCard cwlBottomWeapon"><div class="cwlWeaponKicker" id="cwlWeaponKicker">HEAVY LOADOUT</div><div class="cwlWeaponName" id="cwlCombatName">—</div><div class="cwlWeaponRow"><div class="cwlWeaponDps" id="cwlCombatDps">0 DPS</div><div class="cwlWeaponMeta" id="cwlCombatMeta"></div></div><div class="cwlWeaponAbility" id="cwlCombatAbility"></div><div class="cwlWeaponUtility"><span id="cwlShardText">SHARDS 0/100</span><button class="cwlForgeReady" id="cwlForgeButton" type="button">OPEN D20 FORGE</button></div></div>
      <div class="cwlShellCard cwlBottomVitals"><div class="cwlVital hp"><b>HP</b><div class="cwlVitalTrack"><i id="cwlHudHp"></i></div><span id="cwlHudHpT">—</span></div><div class="cwlVital mp"><b>MANA</b><div class="cwlVitalTrack"><i id="cwlHudMp"></i></div><span id="cwlHudMpT">—</span></div><div class="cwlVital xp"><b>XP</b><div class="cwlVitalTrack"><i id="cwlHudXp"></i></div><span id="cwlHudXpT">—</span></div><div class="cwlVital rift"><b>RIFT</b><div class="cwlVitalTrack"><i id="cwlHudRift"></i></div><span id="cwlHudRiftT">—</span></div></div>`;
    stage().appendChild(hud);
    const forge=hud.querySelector('#cwlForgeButton');
    forge.onclick=e=>{e.preventDefault();e.stopPropagation();try{globalThis.CWL_NATIVE_COMBAT?.openShardForge?.()}catch(err){console.warn('CWL forge open failed',err)}};
    return hud;
  }
  const setW=(id,p)=>{const e=document.getElementById(id);if(e)e.style.width=clamp(p,0,100)+'%'};
  const setT=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v??''};
  function modalOpen(){return !!document.querySelector('.boonScreen.show,.deathOffer.show,.shardForge.show,.bossIntro.show,.lockScreen.show')}
  function nativeState(){try{return globalThis.CWL_NATIVE_COMBAT?.state?.()||null}catch(_){return null}}
  function updateHud(){
    const h=ensureHud(),s=nativeState();
    const p=s?.pl,w=s?.weapon,started=!!s?.gameStarted,isPaused=!!s?.paused,isOver=!!s?.over,dps=Math.round(Number(s?.dps)||0);
    const use=desktop()&&started&&!isOver;
    document.body?.classList.remove('touchDevice');
    document.body?.classList.toggle('cwlDesktopCombat',use);
    h.style.visibility=use&&!isPaused&&!modalOpen()?'visible':'hidden';
    document.documentElement.dataset.cwlCompactHud=use?'ready':'waiting';
    document.documentElement.dataset.cwlInterfaceSource=use?'native':'waiting';
    document.documentElement.dataset.cwlLegacyHud=use?'hidden':'waiting';
    if(!use||!p||!w)return;

    const base=w.heavyLabel||String(w.heavyBaseId||'HEAVY').replaceAll('_',' ');
    const sig=globalThis.CWL_HEAVY_SIGNATURES?.current?.();
    const special=globalThis.CWL_HEAVY_SPECIALS?.current?.();
    const slayer=globalThis.CWL_SLAYER_LOOP?.state?.()||{};
    const scd=Math.max(0,Number(p.scd)||0),cost=Math.max(0,Math.round(Number(p.skillCost)||25)),mana=Math.max(0,Number(p.mana)||0),ready=scd<=.02&&mana>=cost;
    const wave=Math.max(0,Number(s.stageClears)||0),goal=Math.max(1,Number(s.stageGoal)||1),shards=Math.max(0,Number(s.weaponShards)||0),unlock=Math.max(1,Number(s.shardUnlock)||100),cap=Math.max(unlock,Number(s.shardCap)||250);
    const augment=s.tempAugment?.name?`${s.tempAugment.name} ${Math.max(0,Number(s.tempAugment.t)||0).toFixed(1)}s`:'';
    const director=s.directorEvent?.name||'',hazard=s.chaosEvent||s.terrainMode||'';

    setT('cwlZoneLine',`${String(s.zoneName||'UNKNOWN ZONE').toUpperCase()}  ·  WAVE ${Math.min(goal,wave+1)}/${goal}`);
    setT('cwlZoneSub',[`KILLS ${nf(s.kills)}`,s.riftReady?'RIFT OPEN':`CLEARS ${wave}/${goal}`,director?`DIRECTOR ${director}`:'',hazard?String(hazard).toUpperCase():''].filter(Boolean).join('  •  '));

    const chain=Number(slayer.chain)||0,best=Number(slayer.best)||0,threat=Number(slayer.waveExtra)||0;
    const specialText=special?.short||special?.name||'HEAVY SPECIAL';
    setT('cwlCombatLine',`${sig?.short||sig?.name||'HEAVY'}  ·  A ${specialText} ${ready?'READY':scd>0?scd.toFixed(1)+'s':'LOW MP'}`);
    const combatLine=document.getElementById('cwlCombatLine');if(combatLine)combatLine.className='cwlTopMain '+(ready?'cwlSpecialReady':'cwlSpecialCool');
    setT('cwlCombatSub',[chain>1?`CHAIN x${chain}`:'CHAIN —',`BEST ${best}`,threat?`THREAT +${threat} PACK${threat===1?'':'S'}`:'THREAT CALM',augment?`AUGMENT ${augment}`:''].filter(Boolean).join('  •  '));

    setT('cwlWeaponKicker',`${String(w.rar||'HEAVY').toUpperCase()}  ·  ${String(base).toUpperCase()}`);
    setT('cwlCombatName',w.name||base);
    setT('cwlCombatDps',`${nf(dps)} DPS`);
    setT('cwlCombatMeta',[w.heavySubclass?.replace('heavy_','').toUpperCase(),`${Math.round((Number(s.crit)||Number(p.crit)||0)*100)}% CRIT`,`${nf(s.damage)} HIT`].filter(Boolean).join(' • '));
    setT('cwlCombatAbility',[sig?.short||sig?.name,special?`A: ${specialText} · ${cost} MP`:'' ].filter(Boolean).join('  •  '));
    setT('cwlShardText',`SHARDS ${shards}/${cap}${shards>=unlock?' · D20 READY':''}`);
    const forge=document.getElementById('cwlForgeButton');if(forge)forge.classList.toggle('show',shards>=unlock);

    const hp=Math.max(0,Number(p.hp)||0),max=Math.max(1,Number(p.max)||1),mpMax=Math.max(1,Number(p.maxMana)||100),xp=Math.max(0,Number(p.xp)||0),xpn=Math.max(1,Number(p.xpn)||1);
    setW('cwlHudHp',hp/max*100);setT('cwlHudHpT',`${Math.ceil(hp)}/${Math.ceil(max)}`);
    setW('cwlHudMp',mana/mpMax*100);setT('cwlHudMpT',`${Math.ceil(mana)}/${Math.ceil(mpMax)}`);
    setW('cwlHudXp',xp/xpn*100);setT('cwlHudXpT',`${Math.floor(xp)}/${Math.floor(xpn)}`);
    setW('cwlHudRift',s.riftReady?100:wave/goal*100);setT('cwlHudRiftT',s.riftReady?'OPEN':`${wave}/${goal}`);
  }

  let scaledBase=null,scaledWrapper=null;
  function installPlayerScale(){
    if(!desktop())return;
    const body=globalThis.CWL_HEAVY_BODY,hook=globalThis.__CWM_RENDER_HOOK;
    if(!body?.drawPlayer||!hook)return;
    const current=body.drawPlayer?.__cwlPresentationWrapper?body.drawPlayer.__cwlPresentationBase:body.drawPlayer;
    if(typeof current==='function'&&!current.__cwlPresentationWrapper)scaledBase=current;
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
    hook.__cwlHeavyBodyPriority=true;
    if(body.state){body.state.presentationScale=DESKTOP_SCALE;body.state.presentationBuild=BUILD}
  }

  setInterval(()=>{try{installPlayerScale();updateHud()}catch(e){console.warn('CWL unified desktop HUD tick skipped',e)}},100);
  setTimeout(()=>{installPlayerScale();updateHud()},60);
  globalThis.CWL_COMBAT_PRESENTATION={build:BUILD,desktopScale:DESKTOP_SCALE,update:updateHud,reinstallPlayerScale:installPlayerScale,state:()=>({desktop:desktop(),hud:!!hud,scale:DESKTOP_SCALE,native:!!globalThis.CWL_NATIVE_COMBAT,unified:true})};
})();

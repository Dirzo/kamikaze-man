(()=>{
  const COLOR_KEY='crazyWeaponMan.characterColor.v1';
  const MONO='ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono",monospace';

  const css=document.createElement('style');
  css.textContent=`
    .waveIntro,.killChainHud{display:none!important}
    #fsDps,.fsVRow>span:last-child,.cwmMiniHud,.cwmDpsCalc,.cwmPauseStats{font-family:${MONO};font-variant-numeric:tabular-nums slashed-zero;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
    #fsDps,.fsVRow>span:last-child{letter-spacing:-.025em;text-shadow:0 1px 0 #000,1px 0 0 #000,-1px 0 0 #000,0 -1px 0 #000!important}
    .cwmDpsCalc{grid-column:1;grid-row:4;color:#dce8f6;font-size:11px;font-weight:900;line-height:1.28;margin-top:3px;white-space:normal;text-shadow:0 1px 0 #000}
    .cwmDpsCalc b{color:#fff176}
    .cwmMiniHud{display:none;position:absolute;z-index:39;top:max(7px,env(safe-area-inset-top));left:max(7px,env(safe-area-inset-left));max-width:min(67vw,340px);padding:6px 8px;border-radius:9px;background:#06101bc7;border:1px solid #ffffff26;box-shadow:0 4px 18px #0008;color:#eef7ff;line-height:1.13;pointer-events:none;text-shadow:0 1px 0 #000}
    .cwmMiniHud .main{font-size:13px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cwmMiniHud .main .dps{color:#fff176;font-size:15px}
    .cwmMiniHud .sub{font-size:9px;font-weight:850;color:#cad8e8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .cwmMiniHud .calc{font-size:8px;color:#a9bed5;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .cwmPausePanel{display:none;position:absolute;z-index:60;inset:6%;overflow:auto;border:1px solid #ffffff35;border-radius:16px;background:#07101bf2;box-shadow:0 24px 70px #000d;padding:16px;color:#eef7ff;text-align:left}.cwmPausePanel.show{display:block}
    .cwmPauseTop{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px}.cwmPauseTitle{font:1000 22px/1 system-ui}.cwmResume{pointer-events:auto;border:1px solid #ffffff3d;background:#fff176;color:#071018;border-radius:10px;padding:8px 13px;font-weight:1000;cursor:pointer}
    .cwmPauseGrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}.cwmPauseBox{border:1px solid #ffffff1f;background:#ffffff08;border-radius:11px;padding:10px}.cwmPauseBox h4{margin:0 0 7px;font:1000 10px system-ui;letter-spacing:.14em;color:#9fb6ce}.cwmPauseStats{font-size:11px;line-height:1.55}.cwmPauseStats b{color:#fff176}.cwmPauseLeaderboard .lbrow{font-size:10px!important;padding:5px!important}.cwmPauseLeaderboard .lbmeta{font-size:8px!important}.cwmPauseControls{font:800 10px/1.55 system-ui;color:#c8d7e8}
    @media (max-width:900px),(pointer:coarse){
      body.touchDevice.playing .fsTop,body.touchDevice.playing .fsZone,body.touchDevice.playing .fsBottom{display:none!important}
      body.touchDevice.playing .styleHud,body.touchDevice.playing .augmentHud,body.touchDevice.playing .shardHud{display:none!important}
      body.touchDevice.playing .cwmMiniHud{display:block}
      body.touchDevice.playing .fsUpgrade{top:18%!important;transform:translate(-50%,-50%) scale(.68)!important;max-width:60%!important}
      body.touchDevice.playing .fsUpgrade.show{transform:translate(-50%,-50%) scale(.78)!important}
      body.touchDevice.playing .fsUpgrade .u1{font-size:9px!important}.fsUpgrade .u2{font-size:20px!important}.fsUpgrade .u3{font-size:11px!important}
      .cwmPausePanel{inset:5%;padding:12px}.cwmPauseTitle{font-size:17px}.cwmPauseGrid{grid-template-columns:1fr}.cwmPauseBox{padding:8px}.cwmPauseStats{font-size:10px}.cwmPauseControls{font-size:9px}
      .cwmDpsCalc{display:none!important}
    }
    @media (max-height:500px) and (orientation:landscape){
      .cwmMiniHud{max-width:46vw;padding:4px 6px}.cwmMiniHud .main{font-size:11px}.cwmMiniHud .main .dps{font-size:13px}.cwmMiniHud .sub{font-size:8px}.cwmMiniHud .calc{font-size:7px}
      .cwmPausePanel{inset:3% 7%;padding:9px}.cwmPauseGrid{grid-template-columns:1fr 1fr}.cwmPauseTitle{font-size:15px}.cwmPauseStats,.cwmPauseControls{font-size:8px;line-height:1.4}
    }
  `;
  document.head.appendChild(css);

  function procMultiplier(w){
    let proc=1;
    if(w.mod==='multishot')proc*=1.28;
    if(w.mod==='pierce')proc*=1.12;
    if(w.mod==='echo'||w.mod==='echoes')proc*=1.28;
    if(w.mod==='nova')proc*=1.15;
    if(w.cap)proc*=1.18+rarityRank(w)*.035;
    if(w.material){
      if(w.material.code==='diamond'||w.material.code==='rubber')proc*=1.13;
      if(w.material.code==='nuclear'||w.material.code==='void'||w.material.code==='plasma')proc*=1.11;
      if(w.material.code==='living')proc*=1.09;
    }
    if(hasTrait(w,'rhythmic'))proc*=1.13;
    if(hasTrait(w,'recursive'))proc*=1.12;
    if(hasTrait(w,'sentient'))proc*=1.09;
    if(hasTrait(w,'hex'))proc*=1.08;
    if(hasTrait(w,'unstable'))proc*=1.10;
    if(hasTrait(w,'explosive'))proc*=1.11;
    if(hasTrait(w,'haunted'))proc*=1.08;
    if(hasTrait(w,'jazzhands'))proc*=1.07;
    if(hasTrait(w,'assbackwards'))proc*=1.03;
    if(hasTrait(w,'bouncy'))proc*=1.06;
    if(w.synergy)proc*=1.14;
    return proc;
  }

  function dpsBreakdown(){
    const w=curW();
    const coeff={sword:1.04,dagger:.78,nunchucks:.70,katana:1.16,bow:.92,shuriken:.76,wand:.84,staff:1.28,hammer:1.42}[w.type]||1;
    const hit=baseD(Math.max(pl.lv,w.lv||pl.lv))*w.m*weaponDamageMult(w)*combatScale(w)*coeff;
    const cc=Math.min(.88,pl.crit+weaponCritBonus(w));
    const crit=1+cc*.92;
    const aps=1/heldAttackCooldown(w);
    const proc=procMultiplier(w);
    return {hit,cc,crit,aps,proc,dps:hit*crit*aps*proc,w};
  }

  const nf=n=>Math.round(Number(n)||0).toLocaleString();
  const factor=n=>(Number(n)||0).toFixed(2).replace(/\.00$/,'');
  function formulaText(b,full=true){
    const left=`${nf(b.hit)} hit × ${b.aps.toFixed(2)}/s × ${factor(b.crit)} crit × ${factor(b.proc)} FX`;
    return full?`${left} = ${nf(b.dps)} DPS`:left;
  }

  function installDpsCalc(){
    const dps=document.getElementById('fsDps');
    if(!dps||document.getElementById('cwmDpsCalc'))return;
    const el=document.createElement('div');el.id='cwmDpsCalc';el.className='cwmDpsCalc';
    dps.insertAdjacentElement('afterend',el);
  }

  function installMiniHud(){
    const stage=document.getElementById('gameStage');
    if(!stage||document.getElementById('cwmMiniHud'))return;
    const el=document.createElement('div');el.id='cwmMiniHud';el.className='cwmMiniHud';
    el.innerHTML='<div class="main"><span class="dps">0 DPS</span> <span class="weapon"></span></div><div class="sub"></div><div class="calc"></div>';
    stage.appendChild(el);
  }

  function installPausePanel(){
    const stage=document.getElementById('gameStage');
    if(!stage||document.getElementById('cwmPausePanel'))return;
    const p=document.createElement('div');p.id='cwmPausePanel';p.className='cwmPausePanel';
    p.innerHTML=`<div class="cwmPauseTop"><div class="cwmPauseTitle">PAUSED • RUN INFO</div><button class="cwmResume" type="button">RESUME</button></div><div class="cwmPauseGrid"><div class="cwmPauseBox"><h4>CURRENT RUN</h4><div class="cwmPauseStats"></div></div><div class="cwmPauseBox"><h4>CONTROLS</h4><div class="cwmPauseControls">MOVE ← → / joystick<br>JUMP Alt / swipe up<br>ATTACK Ctrl / hold right side<br>SKILL A / double-tap right<br>DASH Shift / flick sideways</div></div><div class="cwmPauseBox" style="grid-column:1/-1"><h4>GLOBAL DPS</h4><div class="leaderboard cwmPauseLeaderboard"></div></div></div>`;
    stage.appendChild(p);
    p.querySelector('.cwmResume').onclick=e=>{e.preventDefault();e.stopPropagation();paused=false;p.classList.remove('show');const btn=document.getElementById('cwmMobilePauseBtn');if(btn)btn.textContent='Ⅱ'};
  }

  function syncPauseButton(){
    const btn=document.getElementById('cwmMobilePauseBtn');
    if(!btn||btn.dataset.clarityBound)return;
    btn.dataset.clarityBound='1';
    btn.onclick=e=>{
      e.preventDefault();e.stopPropagation();
      paused=!paused;
      btn.textContent=paused?'▶':'Ⅱ';
      const p=document.getElementById('cwmPausePanel');if(p)p.classList.toggle('show',paused&&!over);
    };
  }

  function updateClarityUi(){
    if(typeof gameStarted==='undefined'||!gameStarted)return;
    const b=dpsBreakdown();
    const calc=document.getElementById('cwmDpsCalc');
    if(calc)calc.innerHTML=`DPS = <b>${nf(b.hit)}</b> hit × <b>${b.aps.toFixed(2)}</b>/s × <b>${factor(b.crit)}</b> crit × <b>${factor(b.proc)}</b> FX = <b>${nf(b.dps)}</b>`;
    const mini=document.getElementById('cwmMiniHud');
    if(mini){
      mini.querySelector('.dps').textContent=`${nf(b.dps)} DPS`;
      mini.querySelector('.weapon').textContent=`• ${b.w.rar} ${WM[b.w.type]?.label||b.w.type}`;
      mini.querySelector('.sub').textContent=`HP ${Math.ceil(pl.hp)}/${pl.max} • LV ${pl.lv} • KILLS ${kills} • ${Z[zoneI]?.name||''}`;
      mini.querySelector('.calc').textContent=formulaText(b,false);
    }
    const panel=document.getElementById('cwmPausePanel');
    if(panel){
      panel.classList.toggle('show',!!paused&&!over&&document.body.classList.contains('touchDevice'));
      const stats=panel.querySelector('.cwmPauseStats');
      if(stats)stats.innerHTML=`<b>${nf(b.dps)} DPS</b><br>${formulaText(b,true)}<br>HP ${Math.ceil(pl.hp)} / ${pl.max}<br>Level ${pl.lv} • XP ${pl.xp}/${pl.xpn}<br>Kills ${kills} • One-shots ${ones}<br>Weapon: ${escapeHtml(b.w.name)}<br>${escapeHtml(b.w.rar)} ${escapeHtml(WM[b.w.type]?.label||b.w.type)}<br>Crit ${(b.cc*100).toFixed(0)}%`;
      const src=document.getElementById('leaderboard'),dst=panel.querySelector('.cwmPauseLeaderboard');
      if(src&&dst&&dst.dataset.last!==src.innerHTML){dst.innerHTML=src.innerHTML;dst.dataset.last=src.innerHTML}
    }
    syncPauseButton();
  }

  try{
    showWaveIntro=function(){waveIntroT=0;if(U.waveIntro)U.waveIntro.classList.remove('show')};
    killChainAdd=function(){killChainCount=0;killChainT=0;killChainBonusTotal=0;if(U.killChainHud)U.killChainHud.classList.remove('show','pulse')};
    chainCashout=function(){killChainCount=0;killChainT=0;killChainBonusTotal=0;if(U.killChainHud)U.killChainHud.classList.remove('show','pulse')};
    updateKillChain=function(){};
    updateKillChainHud=function(){if(U.killChainHud)U.killChainHud.classList.remove('show','pulse')};
    if(U.waveIntro)U.waveIntro.classList.remove('show');
    if(U.killChainHud)U.killChainHud.classList.remove('show','pulse');
  }catch(e){console.warn('Clarity cleanup hook unavailable',e)}

  if(typeof playerDraw==='function'&&!globalThis.__CWM_TRUE_CHARACTER_COLOR){
    globalThis.__CWM_TRUE_CHARACTER_COLOR=true;
    const basePlayerDraw=playerDraw;
    playerDraw=function(){
      const selected=localStorage.getItem(COLOR_KEY)||'#566a84';
      const oldBody=pl.armors?.body||null,oldFeet=pl.armors?.feet||null;
      if(pl.armors){
        if(!oldBody)pl.armors.body={name:'CUSTOM SUIT',col:selected};
        if(!oldFeet)pl.armors.feet={name:'CUSTOM BOOTS',col:selected};
      }
      let r;
      try{r=basePlayerDraw()}finally{if(pl.armors){pl.armors.body=oldBody;pl.armors.feet=oldFeet}}
      if(oldBody){
        const run=pl.on?Math.min(1,Math.abs(pl.vx)/190):0,bob=Math.abs(Math.sin(time*12))*2*run;
        X.save();X.translate(pl.x+17,pl.y+25+bob);X.scale(pl.dir*1.08,1.08);X.globalAlpha=.88;X.fillStyle=selected;X.shadowColor=selected;X.shadowBlur=4;X.fillRect(-2,-11,4,22);X.fillRect(-10,7,20,3);X.restore();
      }
      return r;
    };
  }

  if(typeof draw==='function'&&!globalThis.__CWM_CRISP_DAMAGE){
    globalThis.__CWM_CRISP_DAMAGE=true;
    const baseDraw=draw;
    draw=function(){
      const saved=T;
      const damage=saved.filter(t=>t.kind==='damage').slice(-30);
      T=saved.filter(t=>t.kind!=='damage'&&t.kind!=='chainScore'&&t.kind!=='chainCash');
      let r;
      try{r=baseDraw()}finally{T=saved}
      if(!paused&&!over&&damage.length){
        X.save();X.textAlign='center';X.textBaseline='alphabetic';X.lineJoin='round';X.shadowBlur=0;
        for(const t of damage){
          const a=clamp(t.life/t.max,0,1),p=1-t.life/t.max,pop=1+Math.sin(Math.min(1,p/.20)*Math.PI)*(t.crit?.16:.07),fs=Math.round((t.size||22)*pop),nw=String(t.s).length*fs*.62,tx=clamp(t.x,nw/2+8,W-nw/2-8);
          X.globalAlpha=a;X.font=`1000 ${fs}px ${MONO}`;X.strokeStyle='rgba(4,7,12,.98)';X.lineWidth=Math.max(3,Math.round(fs*.10));X.strokeText(t.s,tx,t.y);X.fillStyle=t.col||'#fff';X.fillText(t.s,tx,t.y);
          if(t.label){X.font=`1000 ${Math.max(9,Math.round(fs*.24))}px ${MONO}`;X.lineWidth=3;X.strokeText(t.label,tx,t.y-fs*.75);X.fillStyle=t.labelCol||'#fff7bd';X.fillText(t.label,tx,t.y-fs*.75)}
        }
        X.restore();X.globalAlpha=1;
      }
      return r;
    };
  }

  installDpsCalc();installMiniHud();installPausePanel();syncPauseButton();
  if(typeof render==='function'&&!globalThis.__CWM_CLARITY_RENDER){
    globalThis.__CWM_CLARITY_RENDER=true;
    const baseRender=render;
    render=function(){const r=baseRender();updateClarityUi();return r};
  }
  updateClarityUi();
})();

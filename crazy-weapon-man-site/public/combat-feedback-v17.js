(()=>{
  if(globalThis.__CWM_FEEDBACK_V17)return;
  globalThis.__CWM_FEEDBACK_V17=true;

  const state={hits:0,hitCascade:0,maxHitCascade:0,kills:0,killChain:0,maxKillChain:0,lastKillMs:-1e9,lastHitMs:-1e9,xpPulses:0,levelUps:0,dropPops:0,pickups:0,packClears:0,mobMelts:0};
  const qs=new URLSearchParams(location.search);
  const now=()=>performance.now();
  const density=()=>globalThis.CWM_HORDE_V16?.density?.()||E.filter(e=>e&&!e.dead&&!e.boss).length;

  function installUi(){
    const stage=document.getElementById('gameStage');if(!stage||document.getElementById('cwmJuiceHud'))return;
    const style=document.createElement('style');style.textContent=`
      #cwmJuiceHud{position:absolute;inset:0;pointer-events:none;z-index:96;font-family:system-ui,Segoe UI,sans-serif;overflow:hidden}
      #cwmKillChain{position:absolute;left:50%;top:52px;transform:translateX(-50%) scale(.86);opacity:0;min-width:170px;padding:7px 16px 8px;border:1px solid #ffffff30;border-radius:8px;background:linear-gradient(180deg,#07111eea,#02060bbf);box-shadow:0 9px 30px #000b,inset 0 0 24px #fff0;text-align:center;transition:opacity .12s,transform .12s}
      #cwmKillChain.show{opacity:1;transform:translateX(-50%) scale(1)}
      #cwmKillChain .n{font:1000 22px/1 system-ui;letter-spacing:.04em;color:#fff3a4;text-shadow:0 0 14px #ffcc55,0 2px 4px #000}
      #cwmKillChain .s{margin-top:3px;font:900 8px/1 system-ui;letter-spacing:.18em;color:#9cecff}
      #cwmXpTick{position:absolute;right:18px;bottom:96px;opacity:0;transform:translateY(8px) scale(.9);font:1000 16px/1 system-ui;color:#ffd95d;text-shadow:0 0 12px #ffbf2f,0 2px 4px #000}
      #cwmXpTick.pop{animation:cwmXpTick .52s cubic-bezier(.2,.9,.2,1)}
      #cwmLevelSplash{position:absolute;left:50%;top:18%;width:min(560px,62%);transform:translate(-50%,-10px) scale(.86);opacity:0;text-align:center;padding:14px 24px 16px;border-top:2px solid #fff2a2;border-bottom:2px solid #ffbf3f;background:linear-gradient(90deg,transparent,#241600d9 18%,#4a3008e8 50%,#241600d9 82%,transparent);filter:drop-shadow(0 12px 30px #000a)}
      #cwmLevelSplash.pop{animation:cwmLevelSplash 1.15s cubic-bezier(.15,.75,.2,1)}
      #cwmLevelSplash .k{font:1000 10px/1 system-ui;letter-spacing:.35em;color:#fff5bd}
      #cwmLevelSplash .l{margin-top:5px;font:1000 42px/.9 system-ui;color:#ffd34e;text-shadow:0 0 22px #ffb11f,0 3px 0 #6e3c00}
      #cwmLevelSplash .d{margin-top:7px;font:900 11px/1 system-ui;letter-spacing:.11em;color:#fff7d8}
      .fsXp.cwmXpPulse{animation:cwmXpBar .24s ease-out}.fsHp.cwmHpPulse{animation:cwmHpBar .22s ease-out}
      @keyframes cwmXpTick{0%{opacity:0;transform:translateY(10px) scale(.8)}18%{opacity:1;transform:translateY(0) scale(1.14)}70%{opacity:1;transform:translateY(-8px) scale(1)}100%{opacity:0;transform:translateY(-18px) scale(.94)}}
      @keyframes cwmLevelSplash{0%{opacity:0;transform:translate(-50%,12px) scale(.76)}14%{opacity:1;transform:translate(-50%,0) scale(1.08)}28%,72%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-10px) scale(1.03)}}
      @keyframes cwmXpBar{0%{filter:brightness(1)}45%{filter:brightness(2.2);box-shadow:0 0 14px #ffd54a}100%{filter:brightness(1)}}
      @keyframes cwmHpBar{0%{filter:brightness(1)}45%{filter:brightness(1.8);box-shadow:0 0 12px #ff6677}100%{filter:brightness(1)}}
    `;document.head.appendChild(style);
    const hud=document.createElement('div');hud.id='cwmJuiceHud';hud.innerHTML=`<div id="cwmKillChain"><div class="n"></div><div class="s"></div></div><div id="cwmXpTick"></div><div id="cwmLevelSplash"><div class="k">LEVEL ADVANCEMENT</div><div class="l"></div><div class="d"></div></div>`;stage.appendChild(hud);
  }
  installUi();
  const el=id=>document.getElementById(id);
  function replay(node,cls){if(!node)return;node.classList.remove(cls);void node.offsetWidth;node.classList.add(cls)}
  function pulseBar(node,cls){if(!node)return;node.classList.remove(cls);void node.offsetWidth;node.classList.add(cls)}

  function contactSound(w,crit=false){
    if(!w||!sndGate('juice-hit-'+w.type,density()>=16?58:34))return;
    const g=crit?.018:.010,q=rarityRank(w);
    try{
      if(w.type==='hammer'){noise(.045,g*1.5,260,'lowpass');tone(76+q*3,42,.055,g,'square')}
      else if(w.type==='sword'||w.type==='katana'){noise(.025,g,2600,'highpass');tone(760+q*22,430,.04,g*.8,'triangle')}
      else if(w.type==='dagger'||w.type==='shuriken'){tone(1320+q*30,760,.028,g*.75,'triangle')}
      else if(w.type==='nunchucks'){tone(410,240,.026,g*.65,'square');tone(620,330,.025,g*.45,'triangle',.014)}
      else if(w.type==='bow'){noise(.025,g*.75,1800,'bandpass');tone(520,290,.035,g*.55,'triangle')}
      else {tone(620+q*26,980+q*40,.045,g*.65,'sine')}
      const fam=w.element?.family;
      if(fam&&sndGate('juice-element-'+fam,70)){
        if(fam==='fire')noise(.045,.007,2500,'highpass');
        else if(fam==='lightning'||fam==='plasma')tone(1550,2450,.035,.008,'square');
        else if(fam==='ice')tone(1850,1250,.06,.009,'sine');
        else if(fam==='earth')noise(.055,.009,180,'lowpass');
        else if(fam==='void')tone(95,52,.08,.010,'sine');
        else if(fam==='radiant')tone(1250,2100,.07,.008,'sine');
      }
    }catch(_){ }
  }
  function killAccent(chain,elite=false){
    if(!sndGate('juice-kill',48))return;
    try{
      const root=230+Math.min(12,chain)*18;
      tone(root,root*1.32,.06,elite?.024:.013,'triangle');
      if(chain>=5)tone(root*1.5,root*2.05,.09,.013,'sine',.018);
      if(chain>=10)tone(root*2.0,root*2.7,.12,.012,'sine',.035);
    }catch(_){ }
  }
  function updateChainUi(){
    const box=el('cwmKillChain');if(!box)return;
    if(state.killChain<2){box.classList.remove('show');return}
    const title=state.killChain>=15?'PLATFORM ERASED':state.killChain>=10?'MOB MELT':state.killChain>=5?'CHAIN REACTION':'KILL CHAIN';
    box.querySelector('.n').textContent=`${state.killChain}× ${title}`;
    box.querySelector('.s').textContent=state.killChain>=10?'KEEP THE ROTATION MOVING':'1.2s CHAIN WINDOW';
    box.classList.add('show');
    box.style.borderColor=state.killChain>=10?'#ffd45688':'#7be9ff55';
    box.style.boxShadow=state.killChain>=10?'0 9px 34px #000b,0 0 24px #ffbd3f40':'0 9px 30px #000b,0 0 18px #55dfff2c';
  }
  function xpPulse(amount){
    state.xpPulses++;
    const n=el('cwmXpTick');if(n){n.textContent=`+${Math.max(1,Math.round(amount))} XP`;replay(n,'pop')}
    pulseBar(U.fsXp,'cwmXpPulse');
  }
  function levelSplash(lv){
    state.levelUps++;
    const n=el('cwmLevelSplash');if(n){n.querySelector('.l').textContent=`LEVEL ${lv}`;n.querySelector('.d').textContent=`MAX HP INCREASED  •  NEXT: ${pl.xpn} XP`;replay(n,'pop')}
    try{for(let i=0;i<6;i++){let a=i*Math.PI/3;beam(pl.x+17,pl.y+18,pl.x+17+Math.cos(a)*180,pl.y+18+Math.sin(a)*140,i%2?'#fff7bf':'#ffd34f',2)}ring(pl.x+17,pl.y+22,'#fff3a1',150,7);part(pl.x+17,pl.y+22,'#ffd65d',28,300,8);tone(1320,2200,.18,.02,'sine',.18)}catch(_){ }
  }

  const damagePop0=damagePop;
  damagePop=function(e,n,crit=false,col='#fff'){
    const ms=now();state.hitCascade=ms-state.lastHitMs<280?Math.min(18,state.hitCascade+1):1;state.lastHitMs=ms;state.hits++;state.maxHitCascade=Math.max(state.maxHitCascade,state.hitCascade);
    const before=T.length,r=damagePop0(e,n,crit,col),t=T[T.length-1];
    if(T.length>=before&&t?.kind==='damage'){
      const lane=(state.hitCascade-1)%5,spread=((state.hitCascade-1)%3)-1;
      t.y-=lane*6;t.x+=spread*10;t.vx=(t.vx||0)+spread*8;
      t.size=Math.min(68,(t.size||22)*(1+Math.min(.24,state.hitCascade*.014))*(crit?1.06:1));
      t.life+=Math.min(.12,state.hitCascade*.006);t.max=t.life;
    }
    return r;
  };

  let directDepth=0;
  const hitE0=hitE;
  hitE=function(e,a,o={}){
    directDepth++;
    try{const dealt=hitE0(e,a,o);if(dealt&&directDepth===1&&!o.__elementTick&&!o.__hordeTick&&!o.__overdriveTick){contactSound(curW(),!!o.crit);if(o.crit){flash=Math.max(flash,.055);shake=Math.max(shake,6)}}return dealt}
    finally{directDepth--}
  };

  const killE0=killE;
  killE=function(e,...args){
    if(!e||e.dead)return killE0(e,...args);
    if(e.boss){const r=killE0(e,...args);try{flash=Math.max(flash,.22);shake=Math.max(shake,13);tone(165,330,.18,.025,'triangle');tone(330,660,.22,.018,'sine',.08)}catch(_){ }return r}
    const xpGain=Math.max(1,Math.round((11+(e.lv||1)*2)*(e.elite?2:1)*(typeof styleXpMult==='function'?styleXpMult():1))),cx=e.x+e.w/2,cy=e.y+e.h/2,wasHp=pl.hp;
    const r=killE0(e,...args);if(!e.dead)return r;
    const ms=now();state.killChain=ms-state.lastKillMs<=1220?Math.min(30,state.killChain+1):1;state.lastKillMs=ms;state.kills++;state.maxKillChain=Math.max(state.maxKillChain,state.killChain);killAccent(state.killChain,!!e.elite);xpPulse(xpGain);updateChainUi();
    const tier=state.killChain>=15?3:state.killChain>=10?2:state.killChain>=5?1:0,col=e.elite?'#ff7f93':curW().element?.col||curW().col||e.col;
    try{ring(cx,cy,col,48+tier*25,2+tier);part(cx,cy,col,Math.max(3,Math.round((6+tier*4)*(density()>=18?.55:1))),150+tier*35,5+tier);if(tier>=1)shake=Math.max(shake,4+tier*2);if(tier>=2)flash=Math.max(flash,.055+tier*.018)}catch(_){ }
    if([5,10,15,20].includes(state.killChain)){state.mobMelts++;const label=state.killChain>=15?'PLATFORM ERASED':state.killChain>=10?'MOB MELT':'CHAIN REACTION';try{txt(W/2,118,`${state.killChain}× ${label}`,'#fff176',true);ring(W/2,150,'#fff176',110+tier*20,4+tier)}catch(_){ }}
    if(pl.hp>wasHp)pulseBar(U.fsHp,'cwmHpPulse');
    return r;
  };

  const checkLevel0=checkLevel;
  checkLevel=function(){const before=pl.lv,r=checkLevel0();if(pl.lv>before)levelSplash(pl.lv);return r};

  const spawnDrop0=spawnDrop;
  spawnDrop=function(x,y,item,cache=false){
    const r=spawnDrop0(x,y,item,cache);state.dropPops++;
    try{const q=item?.kind==='armor'?5:rarityRank(item),col=item?.col||'#fff',root=430+q*35;tone(root,root*1.18,.07,.010+q*.0015,'sine');if(q>=4)tone(root*1.5,root*1.8,.10,.008+q*.001,'sine',.045);ring(x,y,col,32+q*4,2);part(x,y,col,Math.min(9,3+Math.floor(q/2)),90+q*6,4)}catch(_){ }
    return r;
  };

  const equip0=equip;
  equip=function(w){
    const before=pl.weapon,oldD=before?estimateDPS(before):0,newD=w?.kind==='armor'?0:estimateDPS(w),better=w?.kind==='armor'||!before||newD>oldD*1.01,r=equip0(w);state.pickups++;
    if(!better){try{tone(280,180,.055,.009,'triangle')}catch(_){ }}
    return r;
  };

  const registerClear0=registerClear;
  registerClear=function(){const before=stageClears,r=registerClear0();if(stageClears>before){state.packClears++;if(!riftReady)packDelay=Math.min(packDelay,.82);try{tone(460,620,.09,.012,'triangle');tone(620,820,.10,.009,'sine',.045)}catch(_){ }}return r};

  const update0=update;
  update=function(dt){
    const r=update0(dt),ms=now();
    if(state.killChain>0&&ms-state.lastKillMs>1380){state.killChain=0;el('cwmKillChain')?.classList.remove('show')}
    // Reward vacuum: once a drop arms, nearby loot aggressively flies toward the player instead of interrupting the rotation.
    const magnet=300+Math.min(110,state.killChain*5);for(const d of D){if(!d||d.life<=0||(d.arm||0)>0)continue;let dx=pl.x+17-d.x,dy=pl.y+20-d.y,dist=Math.hypot(dx,dy);if(dist<magnet&&dist>20){const pull=(780+Math.max(0,magnet-dist)*2.2)*Math.max(0,Math.min(.05,Number(dt)||0));d.vx+=(dx/(dist||1))*pull;d.vy+=(dy/(dist||1))*pull}}
    return r;
  };

  function resetProof(){Object.assign(state,{hits:0,hitCascade:0,maxHitCascade:0,kills:0,killChain:0,maxKillChain:0,lastKillMs:-1e9,lastHitMs:-1e9,xpPulses:0,levelUps:0,dropPops:0,pickups:0,packClears:0,mobMelts:0})}
  function selfTest(){return{ok:!!document.getElementById('cwmJuiceHud')&&typeof damagePop==='function'&&typeof killE==='function'&&typeof spawnDrop==='function',features:['damage-cascade','weapon-contact-audio','kill-chain','xp-pulse','level-splash','drop-clink','loot-vacuum','fast-pack-flow'],state:{...state}}}
  function expose(ok){const root=document.documentElement,proof=selfTest();proof.ok=!!ok&&proof.ok;globalThis.__CWM_FEEDBACK_PROOF=proof;if(root){root.dataset.cwmFeedbackProof=proof.ok?'pass':'fail';root.dataset.cwmFeedbackKillChain=String(state.maxKillChain);root.dataset.cwmFeedbackXpPulses=String(state.xpPulses);root.dataset.cwmFeedbackLevelups=String(state.levelUps);root.dataset.cwmFeedbackDrops=String(state.dropPops);root.dataset.cwmFeedbackCascade=String(state.maxHitCascade)}}
  function runSmoke(){
    try{resetProof();gameStarted=true;U.titleScreen?.classList.add('hidden');E=[];D=[];P=[];Q=[];F=[];T=[];pl.inv=999;pl.xp=Math.max(0,pl.xpn-1);const w=makeW(pl.lv,true);w.type='staff';pl.weapon=w;for(let i=0;i<6;i++){spawn('crawler',clamp(pl.x+150+i*55,30,W-80),false);const e=E.at(-1);e.state='approach';hitE(e,Math.max(1,e.max*.12),{col:w.col,sourceType:w.type});killE(e,false,null,wdmg())}spawnDrop(pl.x+120,pl.y-50,makeW(pl.lv,true),false);const ok=state.maxKillChain>=5&&state.xpPulses>=5&&state.levelUps>=1&&state.dropPops>=1&&state.maxHitCascade>=1;expose(ok);return ok}catch(e){console.error('CWM feedback smoke failed',e);expose(false);return false}
  }
  function showcase(){
    setTimeout(()=>{try{const live=E.filter(e=>e&&!e.dead&&!e.boss).slice(0,6);for(const e of live)killE(e,false,null,wdmg());if(live.length<4){for(let i=0;i<6-live.length;i++){spawn('crawler',clamp(pl.x+180+i*60,30,W-80),false);const e=E.at(-1);killE(e,false,null,wdmg())}}}catch(e){console.warn('Feedback showcase failed',e)}},4200)
  }
  globalThis.CWM_FEEDBACK_V17={version:'v17-game-juice',state,selfTest,runSmoke,showcase,resetProof};
  if(qs.has('feedbackSmoke'))setTimeout(runSmoke,700);
  else expose(true);
  if(qs.has('feedbackShowcase'))showcase();
})();

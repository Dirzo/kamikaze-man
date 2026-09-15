(()=>{
  if(globalThis.__CWL_SLAYER_LOOP_V1)return;
  globalThis.__CWL_SLAYER_LOOP_V1=true;
  const BUILD='cwl-slayer-loop-v1-20260915a';
  const CHAIN_WINDOW=1.55,MAX_ENEMIES=58;
  let chain=0,best=0,lastKill=-99,lastWave=null,waveExtra=0,waveRank=0,lastBonus=0,totalBonus=0;
  const now=()=>typeof time!=='undefined'?Number(time)||0:performance.now()/1000;
  const rank=()=>{try{return Math.max(0,Number(rarityRank(curW()))||0)}catch(_){return 0}};
  const nf=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString();

  const style=document.createElement('style');
  style.textContent=`#cwlSlayerHud{position:absolute;z-index:44;left:50%;top:max(9px,env(safe-area-inset-top));transform:translateX(-50%) translateY(-8px) scale(.92);opacity:0;pointer-events:none;transition:opacity .12s ease,transform .12s ease;border:1px solid #ffffff2d;border-radius:999px;background:#070c14d9;box-shadow:0 8px 25px #0009;padding:6px 11px;color:#f3f7ff;font:1000 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.035em;text-shadow:0 1px 0 #000;white-space:nowrap}#cwlSlayerHud.show{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}#cwlSlayerHud .chain{color:#fff176}#cwlSlayerHud .score{color:#73efff}#cwlSlayerHud.hot{border-color:#ff72d688;box-shadow:0 0 24px #ff72d633,0 8px 25px #0009}#cwlThreatTag{position:absolute;z-index:43;right:max(8px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));padding:5px 8px;border-radius:8px;background:#08111bd0;border:1px solid #ffffff20;color:#9eb5cb;font:900 8px/1.2 ui-monospace,monospace;pointer-events:none;text-align:right}@media(max-width:900px),(pointer:coarse){#cwlSlayerHud{top:max(8px,env(safe-area-inset-top));font-size:9px;padding:5px 8px}#cwlThreatTag{top:auto;right:max(7px,env(safe-area-inset-right));bottom:max(8px,env(safe-area-inset-bottom));font-size:7px;opacity:.8}}`;
  document.head.appendChild(style);

  function stage(){return document.getElementById('gameStage')||document.body}
  function ensureHud(){
    let h=document.getElementById('cwlSlayerHud');
    if(!h){h=document.createElement('div');h.id='cwlSlayerHud';stage().appendChild(h)}
    let t=document.getElementById('cwlThreatTag');
    if(!t){t=document.createElement('div');t.id='cwlThreatTag';stage().appendChild(t)}
    return {h,t};
  }
  function addStyle(points){
    const n=Math.max(0,Math.floor(points||0));if(!n)return 0;
    try{styleScore=Math.max(0,Number(styleScore)||0)+n;totalBonus+=n;return n}catch(_){totalBonus+=n;return n}
  }
  function chainBonus(c,r){
    const base=7+c*2.2+Math.pow(c,1.23);
    const rarity=1+Math.min(.8,r*.038);
    const milestone=c%10===0?1+c/20:1;
    return Math.round(base*rarity*milestone);
  }
  function flashMilestone(c,bonus){
    if(c<10||c%5!==0)return;
    const col=c>=30?'#ff72d6':c>=20?'#ff9270':'#fff176';
    try{
      txt(pl.x+pl.w/2,pl.y-58,`SLAUGHTER x${c}  +${nf(bonus)}`,col,true);
      ring(pl.x+pl.w/2,pl.y+pl.h/2,col,55+Math.min(90,c*2),Math.min(7,2+Math.floor(c/10)));
      if(c%10===0){part(pl.x+pl.w/2,pl.y+10,col,Math.min(24,10+c/2),145+c*3,5);shake=Math.max(shake,Math.min(10,3+c*.16))}
    }catch(_){ }
  }
  function onKill(e){
    const t=now(),r=rank();chain=t-lastKill<=CHAIN_WINDOW?chain+1:1;lastKill=t;best=Math.max(best,chain);
    lastBonus=chainBonus(chain,r);addStyle(lastBonus);flashMilestone(chain,lastBonus);
  }

  function installKillHook(){
    try{
      if(typeof killE!=='function'||killE.__cwlSlayer)return false;
      const base=killE;
      const wrapped=function(e,...args){
        const eligible=!!e&&!e.dead&&!e.boss;
        const out=base(e,...args);
        if(eligible&&e.dead)onKill(e);
        return out;
      };
      wrapped.__cwlSlayer=true;killE=wrapped;return true;
    }catch(e){console.warn('CWL slayer kill hook unavailable',e);return false}
  }

  function extraPacksForRank(r){
    if(r<3)return 0;
    if(r<7)return 1;
    if(r<13)return 2;
    if(r<18)return 3;
    return 4;
  }
  function safeSpawnPack(){
    try{
      if(typeof gameStarted!=='undefined'&&!gameStarted)return false;
      if(typeof over!=='undefined'&&over)return false;
      if(typeof bossMode!=='undefined'&&bossMode)return false;
      if(typeof E!=='undefined'&&Array.isArray(E)&&E.length>=MAX_ENEMIES)return false;
      const fn=window.__KM_DEBUG?.spawnPack;if(typeof fn!=='function')return false;
      fn();return true;
    }catch(e){console.warn('CWL reinforcement spawn skipped',e);return false}
  }
  function scheduleReinforcements(wave,r,extra){
    if(!extra)return;
    for(let i=0;i<extra;i++)setTimeout(()=>{
      try{
        const same=Number(stageClears||0)===wave;if(!same)return;
        if(safeSpawnPack()&&i===0){
          const col=r>=18?'#ff72d6':r>=13?'#ff9270':'#fff176';
          txt(W/2,78,`WEAPON THREAT +${extra} PACK${extra===1?'':'S'}`,col,false);
        }
      }catch(_){ }
    },500+i*520);
  }
  function watchWave(){
    try{
      if(typeof stageClears==='undefined'||typeof gameStarted==='undefined'||!gameStarted||over)return;
      const wave=Number(stageClears)||0;if(wave===lastWave)return;lastWave=wave;
      if(typeof bossMode!=='undefined'&&bossMode){waveExtra=0;return}
      waveRank=rank();waveExtra=extraPacksForRank(waveRank);scheduleReinforcements(wave,waveRank,waveExtra);
    }catch(_){ }
  }
  function updateHud(){
    const {h,t}=ensureHud(),age=now()-lastKill,active=chain>1&&age<CHAIN_WINDOW;
    if(age>=CHAIN_WINDOW&&chain){chain=0;lastBonus=0}
    let score=totalBonus;try{score=Number(styleScore)||score}catch(_){ }
    h.classList.toggle('show',active);h.classList.toggle('hot',chain>=15);
    h.innerHTML=`<span class="chain">SLAUGHTER x${Math.max(1,chain)}</span> &nbsp; <span class="score">${nf(score)}</span>${lastBonus?` &nbsp;+${nf(lastBonus)}`:''}`;
    let base='HEAVY';try{base=curW()?.heavyLabel||curW()?.heavyBaseId||base}catch(_){ }
    t.textContent=`${String(base).toUpperCase()} • THREAT +${waveExtra} • CHAIN BEST ${best}`;
  }

  let attempts=0;const hookTimer=setInterval(()=>{if(installKillHook()||++attempts>80)clearInterval(hookTimer)},75);
  setInterval(watchWave,220);setInterval(updateHud,80);
  globalThis.CWL_SLAYER_LOOP={build:BUILD,state:()=>({chain,best,lastKill,lastBonus,totalBonus,wave:lastWave,waveRank,waveExtra,maxEnemies:MAX_ENEMIES}),extraPacksForRank};
  console.info('Crazy Weapon Lady slayer loop armed',BUILD);
})();

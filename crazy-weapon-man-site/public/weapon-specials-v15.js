(()=>{
  if(globalThis.__CWM_SPECIALS_V15)return;
  globalThis.__CWM_SPECIALS_V15=true;

  const SPECIALS={
    sword:{name:'BREACH RUSH',cd:3.6,desc:'Invulnerable forward breach slash that cleaves a lane and throws enemies aside.'},
    dagger:{name:'EXECUTION CASCADE',cd:3.1,desc:'Rapid multi-target execution chain that beams through the nearest enemies.'},
    nunchucks:{name:'CHAIN TORNADO',cd:4.1,desc:'Five-hit spinning storm that shreds and knocks back everything around you.'},
    katana:{name:'FLASH CUT',cd:4.4,desc:'Instant draw-step through the battlefield followed by a high-crit line slash.'},
    bow:{name:'ARROWSTORM',cd:3.8,desc:'Nine-arrow fan backed by a falling barrage at higher rarity.'},
    shuriken:{name:'DEATH ORBIT',cd:3.6,desc:'Explodes a full ring of ricocheting shuriken in every direction.'},
    wand:{name:'ARC CHAIN',cd:3.4,desc:'Lightning-like magic jumps repeatedly through the nearest available targets.'},
    staff:{name:'SKYFALL',cd:4.8,desc:'Calls down a mixed meteor and lightning bombardment across the arena.'},
    hammer:{name:'FAULTLINE',cd:4.6,desc:'Massive ground rupture that launches, stuns and crushes enemies in a wide radius.'}
  };

  const pretty=s=>String(s||'').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_-]+/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
  const clampLocal=(n,a,b)=>Math.max(a,Math.min(b,n));
  function specialMeta(w=curW()){return SPECIALS[w?.type]||SPECIALS.sword}
  function cooldownFor(w=curW()){
    const meta=specialMeta(w),rank=typeof rarityRank==='function'?rarityRank(w):0;
    const rarityMult=Math.max(.72,1-rank*.025);
    // The old skillCost field is retained only as a hidden cooldown-tuning value so legacy boons keep working.
    const boonMult=clampLocal((Number(pl.skillCost)||25)/25,.45,1);
    return Math.max(1.55,meta.cd*rarityMult*boonMult);
  }
  function trimCooldown(seconds){pl.scd=Math.max(0,(Number(pl.scd)||0)-Math.max(0,seconds||0))}

  // Mana no longer gates combat. Keep the legacy numeric field pinned only so old packed code cannot break.
  pl.mana=100;
  const update0=update;
  update=function(dt){pl.mana=100;const r=update0(dt);pl.mana=100;return r};

  const skill0=skill;
  skill=function(){
    if(paused||over||zoneT>0||pl.scd>0)return false;
    const w=curW(),meta=specialMeta(w),before=Number(pl.scd)||0;
    pl.mana=100;
    skill0();
    pl.mana=100;
    if((Number(pl.scd)||0)<=before)return false;
    const cd=cooldownFor(w);
    pl.scd=cd;pl.__specialMax=cd;pl.__specialName=meta.name;pl.__specialType=w.type;
    try{txt(pl.x+pl.w/2,pl.y-54,meta.name,w.col,true);ring(pl.x+pl.w/2,pl.y+pl.h/2,w.col,70+rarityRank(w)*5,3)}catch(_){ }
    return true;
  };

  // Retire mana-era perk text and convert those rewards into cooldown economy.
  try{
    const asthma=TRAITS.find(t=>t.code==='asthma');
    if(asthma)asthma.desc='frantic attack speed; every ninth attack catches its breath and trims special cooldown';
    const tax=TRAITS.find(t=>t.code==='taxevasive');
    if(tax)tax.desc='kills mysteriously shave time off the weapon special cooldown';
    const taxSyn=WEAPON_SYNERGIES.find(s=>s.id==='taxgold');
    if(taxSyn)taxSyn.desc='Tax Evasive + Gold: hostile dividends fire extra shots and accelerate special recovery.';
    const refund=BOONS.find(b=>b.id==='refund');
    if(refund)refund.desc='+6% crit. Kills also shave time off the current weapon special cooldown.';
    const button=BOONS.find(b=>b.id==='button');
    if(button)button.desc='Weapon special cooldown is 35% shorter. The button remains completely unlabeled.';
    const forklift=BOONS.find(b=>b.id==='forklift');
    if(forklift)forklift.desc='Knockback +35%. Wall splats also shave time off the weapon special cooldown.';
  }catch(_){ }

  if(typeof baseProceduralProc==='function'){
    const proc0=baseProceduralProc;
    baseProceduralProc=function(w){
      const r=proc0(w);pl.mana=100;
      if(hasTrait(w,'asthma')&&pl.combo%9===0)trimCooldown(.30);
      return r;
    };
  }
  if(typeof synergyProc==='function'){
    const syn0=synergyProc;
    synergyProc=function(w,nearby){const r=syn0(w,nearby);pl.mana=100;if(w?.synergy?.id==='taxgold'&&pl.combo%4===0)trimCooldown(.38);return r};
  }
  if(typeof killE==='function'){
    const kill0=killE;
    killE=function(e,...rest){
      const wasDead=!!e?.dead,before=kills,w=curW();
      const r=kill0(e,...rest);pl.mana=100;
      if(!wasDead&&kills>before){if(hasTrait(w,'taxevasive'))trimCooldown(.45);if(pl.boonTax)trimCooldown(.30)}
      return r;
    };
  }
  if(typeof styleAdd==='function'){
    const style0=styleAdd;
    styleAdd=function(n,label){const r=style0(n,label);if(label==='WALL SPLAT'&&pl.boonForklift)trimCooldown(.40);return r};
  }

  // Full modifier breakdown for the loadout HUD.
  weaponHudAttributes=function(w){
    const out=[],seen=new Set();
    const add=(n,d,kind='mod')=>{n=String(n||'').trim();d=String(d||'').trim();if(!n||!d)return;const key=n+'|'+d;if(seen.has(key))return;seen.add(key);out.push({n,d,kind})};
    add(WM[w.type]?.label||pretty(w.type),WM[w.type]?.desc||specialMeta(w).desc,'base');
    if(w.__arsenalModel)add('MODEL — '+w.__arsenalModel.name,w.__arsenalModel.desc,'model');
    if(w.element)add('ELEMENT — '+(w.element.name||pretty(w.element.id||w.element.family)),w.element.desc||'elemental weapon behavior','element');
    if(w.mod)add('CORE MOD — '+pretty(w.mod),typeof modText==='function'?modText(w.mod,w.type):'changes the weapon core behavior','core');
    if(w.material)add('MATERIAL — '+w.material.n,w.material.desc,'material');
    for(const t of (w.traits||[]))add('TRAIT — '+t.n,t.desc,'trait');
    if(w.cap)add('CAPSTONE — '+(w.capName||pretty(w.cap)),w.capText||'high-rarity capstone behavior','capstone');
    if(w.intensity)add('INTENSITY — '+w.intensity,'the weapon has escalated beyond the amount of weapon anyone requested','intensity');
    if(w.synergy)add('SYNERGY — '+w.synergy.name,w.synergy.desc,'synergy');
    if(!out.length)add('TRAINING','simple steel. still emotionally committed to increasing the number','base');
    return out;
  };

  function refreshHud(){
    const w=curW(),meta=specialMeta(w),max=Math.max(.01,pl.__specialMax||cooldownFor(w)),rem=Math.max(0,Number(pl.scd)||0),ready=rem<=.01;
    try{
      if(U.fsWName){U.fsWName.textContent=w.name;U.fsWName.title=w.name;const n=w.name.length,s=n>120?11:n>90?12:n>65?13:n>44?15:18;U.fsWName.style.setProperty('font-size',s+'px','important')}
      if(U.fsMeta)U.fsMeta.textContent=`${w.rar} ${WM[w.type].label} • ${Math.round(wdmg())} HIT • ${Math.round((pl.crit+weaponCritBonus(w))*100)}% CRIT • SPACE: ${meta.name}`;
      renderHudAttributes(w);
      const rows=U.fsVitals?.querySelectorAll('.fsVRow');
      if(rows?.[1]){const ss=rows[1].querySelectorAll('span');if(ss[0])ss[0].textContent='SPECIAL';if(ss[1])ss[1].textContent=ready?'READY':rem.toFixed(1)+'s'}
      if(U.fsMp){U.fsMp.style.width=(ready?100:Math.max(0,(1-rem/max)*100))+'%';U.fsMp.dataset.ready=ready?'yes':'no'}
      if(U.fsMpT)U.fsMpT.textContent=ready?'READY':rem.toFixed(1)+'s';
    }catch(_){ }
  }
  const render0=render;
  render=function(){const r=render0();refreshHud();return r};

  // Space owns specials. A is deliberately retired during gameplay.
  document.addEventListener('keydown',e=>{
    if(!gameStarted)return;
    const tag=document.activeElement?.tagName?.toLowerCase();if(tag==='input'||tag==='textarea'||tag==='select')return;
    const k=e.key.toLowerCase();
    if(e.code==='Space'||k===' '||k==='spacebar'){
      e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)skill();return;
    }
    if(k==='a'){e.preventDefault();e.stopImmediatePropagation();K.delete('a')}
  },true);
  document.addEventListener('keyup',e=>{if(e.code==='Space'){e.preventDefault();K.delete(' ') }},true);

  function rewriteControlText(){
    for(const el of document.querySelectorAll('.titleControls,.keys,.fsBottom,.top')){
      if(!el?.innerHTML)continue;
      el.innerHTML=el.innerHTML.replace(/A weapon skill/gi,'Space special').replace(/<b>A<\/b>\s*WEAPON SKILL/gi,'<b>SPACE</b> SPECIAL');
    }
  }
  rewriteControlText();

  function state(){const w=curW(),meta=specialMeta(w),max=Math.max(.01,pl.__specialMax||cooldownFor(w)),rem=Math.max(0,Number(pl.scd)||0);return{type:w.type,name:meta.name,desc:meta.desc,key:'SPACE',remaining:rem,max,ready:rem<=.01,manaMechanic:false}}
  function selfTest(){const types=Object.keys(SPECIALS),all=types.length===9&&types.every(t=>SPECIALS[t]?.name&&SPECIALS[t]?.desc&&SPECIALS[t]?.cd>0);return{ok:all,types:types.length,key:'SPACE',manaMechanic:false,names:Object.fromEntries(types.map(t=>[t,SPECIALS[t].name]))}}
  globalThis.CWM_SPECIALS_V15={version:'v15-space-specials',specials:SPECIALS,state,selfTest,forceReady(){pl.scd=0;refreshHud()},invoke(){pl.scd=0;return skill()},refreshHud};
  globalThis.__CWM_SPECIALS_PROOF=selfTest();
  refreshHud();
})();
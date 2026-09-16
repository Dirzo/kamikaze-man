(()=>{
  if(globalThis.__CWM_ARSENAL_V14)return;
  globalThis.__CWM_ARSENAL_V14=true;

  const NEW_POSITIVE=[
    {id:'ice',family:'ice',polarity:'positive',name:'ICE',prefix:'Cryogenic',col:'#9eeaff',rarity:1,dpsMult:1.17,desc:'chills on hit; repeated hits freeze targets solid'},
    {id:'plasma',family:'plasma',polarity:'positive',name:'PLASMA',prefix:'Plasma-Forged',col:'#ff72f5',rarity:2,dpsMult:1.24,desc:'superheated impacts punch through targets and splash nearby enemies'},
    {id:'void',family:'void',polarity:'positive',name:'VOID',prefix:'Event-Horizon',col:'#a68cff',rarity:2,dpsMult:1.23,desc:'impacts bend space and drag nearby enemies into the strike'},
    {id:'wind',family:'wind',polarity:'positive',name:'WIND',prefix:'Cyclonic',col:'#a5ffd7',rarity:1,dpsMult:1.16,desc:'razor gusts shove and slice clustered enemies'},
    {id:'radiant',family:'radiant',polarity:'positive',name:'RADIANT',prefix:'Solar',col:'#fff08a',rarity:2,dpsMult:1.22,desc:'solar hits flare brighter against wounded targets'}
  ];
  const NEW_NEGATIVE=[
    {id:'whiteout',family:'ice',polarity:'negative',name:'WHITEOUT',prefix:'Hypothermic',col:'#d9fbff',rarity:2,dpsMult:1.31,desc:'brutal freezes with occasional operator lockup'},
    {id:'meltdown',family:'plasma',polarity:'negative',name:'MELTDOWN',prefix:'Reactor-Breached',col:'#ff4bd6',rarity:3,dpsMult:1.38,desc:'miniature reactor failures that sometimes feed back into the operator'},
    {id:'singularity',family:'void',polarity:'negative',name:'SINGULARITY',prefix:'Reality-Damaged',col:'#7655ff',rarity:3,dpsMult:1.37,desc:'violent gravity wells with highly questionable workplace ergonomics'},
    {id:'blowback',family:'wind',polarity:'negative',name:'BLOWBACK',prefix:'Aerodynamically Unsafe',col:'#78ffd1',rarity:2,dpsMult:1.29,desc:'launches everything nearby and occasionally includes you'},
    {id:'solar-flare',family:'radiant',polarity:'negative',name:'SOLAR FLARE',prefix:'Retina-Destroying',col:'#fff3a6',rarity:3,dpsMult:1.36,desc:'catastrophic finishers powered by irresponsible amounts of light'}
  ];
  const NEW_BY_ID=Object.fromEntries([...NEW_POSITIVE,...NEW_NEGATIVE].map(x=>[x.id,x]));

  const MODELS={
    sword:[
      {name:'Municipal Greatsword',dam:1.16,spd:.90,crit:.01,aoe:1.08,scale:1.13,desc:'slow, huge and deeply unnecessary'},
      {name:'Neon Saber',dam:.93,spd:1.18,crit:.025,aoe:.94,scale:.90,desc:'fast fencing blade with excellent crit cadence'},
      {name:'Compliance Cleaver',dam:1.10,spd:.96,crit:.005,aoe:1.06,scale:1.06,desc:'wide chopping profile with extra impact'},
      {name:'Moon Saw',dam:1.04,spd:1.05,crit:.015,aoe:1.02,scale:1.02,desc:'serrated all-rounder built for bad decisions'},
      {name:'Riot Blade',dam:1.08,spd:1.02,crit:.02,aoe:1.00,scale:1.05,desc:'balanced heavy combat blade'},
      {name:'Executive Longknife',dam:.98,spd:1.12,crit:.035,aoe:.96,scale:.94,desc:'lean dueling blade with strong crit bias'}
    ],
    dagger:[
      {name:'Needle Shiv',dam:.90,spd:1.22,crit:.04,aoe:.90,scale:.80,desc:'tiny, absurdly fast and crit hungry'},
      {name:'Punch Knife',dam:1.12,spd:.96,crit:.02,aoe:.94,scale:.92,desc:'short brutal thrusting blade'},
      {name:'Payroll Kris',dam:1.04,spd:1.08,crit:.03,aoe:.96,scale:.88,desc:'wavy blade tuned for frantic strings'},
      {name:'Twin Fang',dam:.98,spd:1.16,crit:.035,aoe:.92,scale:.86,desc:'rapid paired-strike profile'},
      {name:'Backspace',dam:1.15,spd:.92,crit:.025,aoe:1.00,scale:.95,desc:'compact execution blade'},
      {name:'Pocket Catastrophe',dam:1.08,spd:1.03,crit:.04,aoe:.98,scale:.90,desc:'statistically too much knife for one pocket'}
    ],
    nunchucks:[
      {name:'Payroll Nunchucks',dam:1.00,spd:1.12,crit:.015,aoe:1.00,scale:1.00,desc:'classic rapid chain cadence'},
      {name:'Double Bonk',dam:1.12,spd:.96,crit:.01,aoe:1.08,scale:1.08,desc:'heavier heads and wider impact arcs'},
      {name:'Chain Complaint',dam:1.05,spd:1.05,crit:.02,aoe:1.05,scale:1.04,desc:'balanced crowd-control chain set'},
      {name:'Danger Yo-Yo',dam:.94,spd:1.20,crit:.025,aoe:.98,scale:.92,desc:'wildly fast, suspiciously toy-shaped'},
      {name:'Concussion Necklace',dam:1.16,spd:.90,crit:.015,aoe:1.12,scale:1.12,desc:'slow rotating demolition jewelry'},
      {name:'Rotary Complaint',dam:1.02,spd:1.10,crit:.02,aoe:1.04,scale:1.02,desc:'smooth sustained combo machine'}
    ],
    katana:[
      {name:'Neon Nodachi',dam:1.18,spd:.90,crit:.03,aoe:1.08,scale:1.16,desc:'long heavy draw-cutter'},
      {name:'Overtime Katana',dam:1.02,spd:1.08,crit:.035,aoe:1.00,scale:1.02,desc:'balanced high-crit dueling blade'},
      {name:'Quarterly Cutter',dam:.96,spd:1.15,crit:.05,aoe:.96,scale:.95,desc:'faster precision draw weapon'},
      {name:'Rail Katana',dam:1.12,spd:.98,crit:.04,aoe:1.03,scale:1.08,desc:'dense industrial blade with violent launch'},
      {name:'Audit Blade',dam:1.06,spd:1.04,crit:.045,aoe:1.00,scale:1.00,desc:'reliable crit-focused cutter'},
      {name:'Long Meeting Ender',dam:1.14,spd:.94,crit:.04,aoe:1.07,scale:1.10,desc:'decisive solution to prolonged discussion'}
    ],
    bow:[
      {name:'Siege Bow',dam:1.18,spd:.88,crit:.015,aoe:1.06,scale:1.15,desc:'slow artillery-grade arrows'},
      {name:'Compound Problem',dam:1.05,spd:1.05,crit:.025,aoe:1.00,scale:1.02,desc:'balanced modern bow'},
      {name:'Rebar Longbow',dam:1.12,spd:.94,crit:.02,aoe:1.04,scale:1.10,desc:'heavy long-range launcher'},
      {name:'Permit Launcher',dam:.95,spd:1.17,crit:.03,aoe:.96,scale:.94,desc:'fast projectile paperwork dispenser'},
      {name:'Moon Bow',dam:1.02,spd:1.08,crit:.04,aoe:1.00,scale:1.00,desc:'quick crit-biased recurve'},
      {name:'Hostile Geometry',dam:1.08,spd:1.00,crit:.025,aoe:1.10,scale:1.05,desc:'wide projectile-control frame'}
    ],
    shuriken:[
      {name:'Saw Star',dam:1.12,spd:.96,crit:.03,aoe:1.05,scale:1.10,desc:'large serrated throwing disc'},
      {name:'Riot Disc',dam:1.05,spd:1.06,crit:.025,aoe:1.07,scale:1.04,desc:'balanced ricochet disc'},
      {name:'Tax Shuriken',dam:.96,spd:1.18,crit:.04,aoe:.94,scale:.90,desc:'fast small star with relentless cadence'},
      {name:'Orbiting Mistake',dam:1.08,spd:1.02,crit:.035,aoe:1.03,scale:1.06,desc:'oversized return-path menace'},
      {name:'Five-Point Complaint',dam:1.02,spd:1.10,crit:.03,aoe:1.00,scale:.98,desc:'quick accurate star'},
      {name:'Quarterly Ninja Disk',dam:1.15,spd:.92,crit:.025,aoe:1.08,scale:1.12,desc:'heavy disc built for multi-target abuse'}
    ],
    wand:[
      {name:'Spark Baton',dam:.96,spd:1.16,crit:.03,aoe:.96,scale:.90,desc:'rapid repositioning caster'},
      {name:'Arc Wand',dam:1.04,spd:1.07,crit:.025,aoe:1.02,scale:1.00,desc:'balanced homing focus'},
      {name:'Hazard Rod',dam:1.12,spd:.96,crit:.02,aoe:1.06,scale:1.06,desc:'slower heavy magic bolts'},
      {name:'Microwave Wand',dam:1.08,spd:1.00,crit:.025,aoe:1.10,scale:1.03,desc:'wide-area electromagnetic nonsense'},
      {name:'Wizard OSHA Violation',dam:1.16,spd:.92,crit:.035,aoe:1.05,scale:1.08,desc:'unsafe high-output focus'},
      {name:'Compliance Rod',dam:1.00,spd:1.10,crit:.035,aoe:.98,scale:.96,desc:'precise fast administrative magic'}
    ],
    staff:[
      {name:'Arc Furnace Staff',dam:1.18,spd:.90,crit:.015,aoe:1.14,scale:1.14,desc:'huge slow cluster-deleting focus'},
      {name:'Utility Pole',dam:1.14,spd:.88,crit:.01,aoe:1.18,scale:1.18,desc:'an entire municipal pole used as a spell focus'},
      {name:'Conduit Staff',dam:1.06,spd:1.02,crit:.02,aoe:1.08,scale:1.04,desc:'balanced area caster'},
      {name:'Storm Staff',dam:1.10,spd:.98,crit:.025,aoe:1.12,scale:1.08,desc:'wide electrical spell frame'},
      {name:'Municipal Scepter',dam:.98,spd:1.12,crit:.035,aoe:1.02,scale:.96,desc:'faster compact casting staff'},
      {name:'Wizard Rebar',dam:1.12,spd:.94,crit:.02,aoe:1.10,scale:1.10,desc:'industrial rod with excellent spell violence'}
    ],
    hammer:[
      {name:'Industrial Maul',dam:1.15,spd:.92,crit:.015,aoe:1.10,scale:1.12,desc:'wide industrial impact head'},
      {name:'Pile Driver',dam:1.22,spd:.82,crit:.01,aoe:1.05,scale:1.18,desc:'very slow single-impact demolition tool'},
      {name:'Siege Hammer',dam:1.18,spd:.87,crit:.02,aoe:1.12,scale:1.16,desc:'large crowd-breaking hammer'},
      {name:'Welded Crusher',dam:1.10,spd:.98,crit:.015,aoe:1.08,scale:1.08,desc:'balanced fabricated crusher'},
      {name:'Concrete Opinion',dam:1.12,spd:.94,crit:.02,aoe:1.09,scale:1.10,desc:'blunt argument with municipal authority'},
      {name:'Bonk Engine',dam:1.04,spd:1.08,crit:.025,aoe:1.04,scale:1.02,desc:'surprisingly quick powered hammer'}
    ]
  };

  const OLD_PREFIXES=['Blazing','Venomous','Thunderstruck','Tidal','Seismic'];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const pick=a=>a[Math.floor(Math.random()*a.length)];

  function rarityBump(w,steps){
    if(!w||w.rar==='Training'||!Array.isArray(R)||!Array.isArray(RANKS))return;
    const oi=Math.max(0,RANKS.indexOf(w.rar)),ni=Math.min(R.length-1,oi+Math.max(0,steps|0));
    if(ni<=oi)return;
    const old=R[oi],next=R[ni];
    if(old?.m&&next?.m)w.m*=next.m/old.m;
    w.rar=next.n;w.col=next.col;w.p=Math.max(Number(w.p)||0,Number(next.p)||0);w.crit=Math.max(Number(w.crit)||0,.012*(Number(next.p)||0));
  }

  function applyNewElement(w,def){
    if(!w||!def)return w;
    rarityBump(w,def.rarity||1);
    w.element={...def};
    if(def.polarity==='negative')w.m*=1.06;
    if(typeof w.name==='string'&&!w.name.startsWith(def.prefix+' '))w.name=(def.prefix+' '+w.name).slice(0,178);
    if(typeof w.text==='string'&&!w.text.includes(`ELEMENT — ${def.name}:`))w.text=`ELEMENT — ${def.name}: ${def.desc}.${def.polarity==='negative'?' RISK: unstable feedback can hurt the operator.':''} ${w.text}`.trim();
    w.__arsenalElement=true;
    return w;
  }

  function maybeNewElement(w){
    if(!w||w.rar==='Training'||w.element)return w;
    if(Math.random()>=.52)return w;
    return applyNewElement(w,pick(Math.random()<.58?NEW_POSITIVE:NEW_NEGATIVE));
  }

  function stripElementPrefix(name,w){
    let s=String(name||'');
    const p=w?.element?.prefix;
    if(p&&s.startsWith(p+' '))s=s.slice(p.length+1);
    for(const q of OLD_PREFIXES)if(s.startsWith(q+' ')){s=s.slice(q.length+1);break}
    return s;
  }

  function removeModelStats(w){
    const m=w?.__arsenalModel;
    if(!m)return;
    if(m.dam)w.m/=m.dam;
    if(m.crit)w.crit=Math.max(0,(Number(w.crit)||0)-m.crit);
    w.__arsenalModel=null;
  }

  function applyModel(w,forced=null){
    if(!w||w.rar==='Training'||!MODELS[w.type])return w;
    if(w.__arsenalModel&&!forced)return w;
    if(w.__arsenalModel)removeModelStats(w);
    const model=forced||pick(MODELS[w.type]);
    w.__arsenalModel={...model};
    w.m*=model.dam||1;w.crit=(Number(w.crit)||0)+(model.crit||0);
    const base=stripElementPrefix(w.name,w),ep=w.element?.prefix?`${w.element.prefix} `:'';
    w.name=(ep+model.name+' // '+base).slice(0,178);
    if(typeof w.text==='string'&&!w.text.includes('MODEL —'))w.text=`MODEL — ${model.name}: ${model.desc}. ${w.text}`;
    return w;
  }

  function expandWeapon(w){return applyModel(maybeNewElement(w))}

  const makeW0=makeW;
  makeW=function(...a){return expandWeapon(makeW0(...a))};
  if(typeof makeExactRankWeapon==='function'){const f=makeExactRankWeapon;makeExactRankWeapon=function(...a){return expandWeapon(f(...a))}}
  if(typeof makeFunnyIntroWeapon==='function'){const f=makeFunnyIntroWeapon;makeFunnyIntroWeapon=function(...a){return expandWeapon(f(...a))}}
  if(typeof makeEarlyWeapon==='function'){const f=makeEarlyWeapon;makeEarlyWeapon=function(...a){return expandWeapon(f(...a))}}

  if(typeof weaponSpeedMult==='function'){const f=weaponSpeedMult;weaponSpeedMult=function(w){return f(w)*(w?.__arsenalModel?.spd||1)}}
  if(typeof weaponAoe==='function'){const f=weaponAoe;weaponAoe=function(w){return f(w)*(w?.__arsenalModel?.aoe||1)}}
  if(typeof weaponScale==='function'){const f=weaponScale;weaponScale=function(w){return f(w)*(w?.__arsenalModel?.scale||1)}}

  const estimate0=estimateDPS;
  estimateDPS=function(w){const base=estimate0(w),def=w?.element&&NEW_BY_ID[w.element.id];return base*(def?.dpsMult||1)};

  let feedbackCd=0;
  function feedback(pct,label,col,extra){
    if(feedbackCd>0||!gameStarted||over)return;
    feedbackCd=.75;
    const h=Math.max(1,Math.round(pl.max*pct*(Number(pl.damageTaken)||1)));
    pl.hp=Math.max(1,pl.hp-h);txt(pl.x+pl.w/2,pl.y-42,`${label} -${h}`,col,true);part(pl.x+pl.w/2,pl.y+pl.h/2,col,9,170,5);shake=Math.max(shake,6);flash=Math.max(flash,.08);
    if(extra)extra();
  }
  function near(e,n=4,r=180){return E.filter(x=>x&&!x.dead&&x!==e&&Math.hypot((x.x+x.w/2)-(e.x+e.w/2),(x.y+x.h/2)-(e.y+e.h/2))<=r).slice(0,n)}

  const hit0=hitE;
  hitE=function(e,a,o={}){
    const dealt=hit0(e,a,o);
    if(!dealt||o.__arsenalTick||!e||e.dead)return dealt;
    const def=curW()?.element&&NEW_BY_ID[curW().element.id];
    if(!def)return dealt;
    const cx=e.x+e.w/2,cy=e.y+e.h/2,strong=def.polarity==='negative';
    try{part(cx,cy,def.col,strong?12:7,strong?210:155,def.family==='plasma'?7:5);ring(cx,cy,def.col,strong?50:36,strong?4:2)}catch(_){ }

    if(def.family==='ice'){
      const s=e.__arsenalIce||(e.__arsenalIce={stacks:0,t:0});s.stacks=Math.min(5,s.stacks+1);s.t=2.2;e.vx*=Math.max(.35,1-.12*s.stacks);if(s.stacks>=4)e.stun=Math.max(e.stun||0,strong?.48:.30);if(s.stacks>=5){s.stacks=0;hit0(e,dealt*(strong?.24:.16),{col:def.col,stun:.42,sourceType:o.sourceType||curW().type,__elementTick:true,__arsenalTick:true})}
    }else if(def.family==='plasma'){
      hit0(e,dealt*(strong?.24:.17),{col:def.col,stun:.08,sourceType:o.sourceType||curW().type,__elementTick:true,__arsenalTick:true});for(const t of near(e,3,115))hit0(t,dealt*(strong?.18:.11),{col:def.col,sourceType:o.sourceType||curW().type,__elementTick:true,__arsenalTick:true});flash=Math.max(flash,.08);chroma=Math.max(chroma,.07)
    }else if(def.family==='void'){
      for(const t of near(e,5,220)){const dx=cx-(t.x+t.w/2),dy=cy-(t.y+t.h/2),d=Math.max(1,Math.hypot(dx,dy));t.vx+=(dx/d)*(strong?300:190);t.vy+=(dy/d)*(strong?180:105);hit0(t,dealt*(strong?.12:.075),{col:def.col,sourceType:o.sourceType||curW().type,__elementTick:true,__arsenalTick:true})}
    }else if(def.family==='wind'){
      for(const t of near(e,4,185)){const dir=Math.sign((t.x+t.w/2)-cx)||1;hit0(t,dealt*(strong?.14:.09),{col:def.col,knock:dir*(strong?350:225),stun:.05,sourceType:o.sourceType||curW().type,__elementTick:true,__arsenalTick:true})}
    }else if(def.family==='radiant'){
      const hp=(e.hp||0)/Math.max(1,e.max||1);if(hp<.45)hit0(e,dealt*(strong?.30:.19),{col:def.col,stun:.07,sourceType:o.sourceType||curW().type,__elementTick:true,__arsenalTick:true});try{beam(pl.x+pl.w/2,pl.y+pl.h/2,cx,cy,def.col,strong?6:3)}catch(_){ }
    }

    if(strong&&Math.random()<.12){
      if(def.id==='whiteout')feedback(.016,'WHITEOUT',def.col,()=>{pl.vx=0;pl.vy*=.25});
      else if(def.id==='meltdown')feedback(.027,'MELTDOWN',def.col,()=>{pl.mana=Math.max(0,pl.mana-10)});
      else if(def.id==='singularity')feedback(.021,'SINGULARITY',def.col,()=>{pl.vx+=(Math.random()<.5?-1:1)*260;pl.vy=-130});
      else if(def.id==='blowback')feedback(.015,'BLOWBACK',def.col,()=>{pl.vx=-pl.dir*290;pl.vy=-80});
      else if(def.id==='solar-flare')feedback(.030,'SOLAR FLARE',def.col,()=>{flash=Math.max(flash,.22)});
    }
    return dealt;
  };

  const update0=update;
  update=function(dt){const r=update0(dt);feedbackCd=Math.max(0,feedbackCd-Math.max(0,Number(dt)||0));for(const e of E){const s=e?.__arsenalIce;if(s){s.t-=dt;if(s.t<=0)s.stacks=0}}return r};

  if(typeof attackMotion==='function'){
    const f=attackMotion;attackMotion=function(w){const r=f(w),def=w?.element&&NEW_BY_ID[w.element.id];if(!def)return r;const x=pl.x+17+pl.dir*(34*weaponScale(w)),y=pl.y+18;try{
      if(def.family==='ice'){ring(x,y,def.col,34,2);part(x,y,'#fff',4,85,3)}
      else if(def.family==='plasma'){ring(x,y,def.col,44,4);part(x,y,'#fff',5,125,4)}
      else if(def.family==='void'){ring(x,y,def.col,52,5);ring(x,y,'#160b26',24,3)}
      else if(def.family==='wind'){part(x,y,def.col,8,165,3)}
      else if(def.family==='radiant'){ring(x,y,'#fff',48,2);beam(pl.x+17,pl.y+30,x,y,def.col,3)}
    }catch(_){ }return r};
  }

  if(typeof weaponAura==='function'){
    const f=weaponAura;weaponAura=function(w,x,y){f(w,x,y);const def=w?.element&&NEW_BY_ID[w.element.id];if(!def||!globalThis.X)return;try{X.save();X.translate(x,y);X.globalAlpha=.72;X.strokeStyle=def.col;X.fillStyle=def.col;X.shadowColor=def.col;X.shadowBlur=15;const t=typeof time==='number'?time:0;
      if(def.family==='ice'){for(let i=0;i<4;i++){X.rotate(Math.PI/2);X.beginPath();X.moveTo(12,0);X.lineTo(24+Math.sin(t*5+i)*3,0);X.stroke()}}
      else if(def.family==='plasma'){X.beginPath();X.arc(0,0,13+Math.sin(t*8)*2,0,Math.PI*2);X.stroke();X.beginPath();X.arc(0,0,21,0,Math.PI*2);X.stroke()}
      else if(def.family==='void'){for(let i=0;i<3;i++){const a=t*2+i*Math.PI*2/3;X.beginPath();X.arc(Math.cos(a)*20,Math.sin(a)*10,3+i,0,Math.PI*2);X.fill()}}
      else if(def.family==='wind'){for(let i=0;i<3;i++){X.beginPath();X.arc(0,0,15+i*5,-1.0+t*.2,.8+t*.2);X.stroke()}}
      else if(def.family==='radiant'){for(let i=0;i<6;i++){X.rotate(Math.PI/3);X.beginPath();X.moveTo(10,0);X.lineTo(24+Math.sin(t*6)*3,0);X.stroke()}}
      X.restore()}catch(_){try{X.restore()}catch(__){}}};
  }

  function forceElement(w,id){const d=NEW_BY_ID[id];if(!w||!d)return w;w.element=null;return applyNewElement(w,d)}
  function forceModel(w,name){if(!w||!MODELS[w.type])return w;const m=MODELS[w.type].find(x=>x.name===name)||MODELS[w.type][0];return applyModel(w,m)}
  function sample(n=1500){const types={},elements={},models={};for(let i=0;i<n;i++){const w=makeW(Math.max(1,pl?.lv||1),true);types[w.type]=(types[w.type]||0)+1;const e=w.element?.id||'none';elements[e]=(elements[e]||0)+1;const m=w.__arsenalModel?.name||'none';models[m]=(models[m]||0)+1}return{types,elements,models}}

  globalThis.CWM_ARSENAL_V14={
    version:'v1.4-arsenal-chaos',types:Object.keys(MODELS),models:MODELS,newPositive:NEW_POSITIVE,newNegative:NEW_NEGATIVE,newElements:[...NEW_POSITIVE,...NEW_NEGATIVE],forceElement,forceModel,sample
  };
})();

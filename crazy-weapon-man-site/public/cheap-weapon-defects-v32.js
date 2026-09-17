(()=>{
  if(globalThis.__CWM_CHEAP_WEAPON_DEFECTS_V32)return;
  globalThis.__CWM_CHEAP_WEAPON_DEFECTS_V32=true;

  const S={made:0,defective:0,byRank:{},triggered:0,lastTrigger:'',error:null};
  const RATE=[.86,.62,.18,.06,.02,.006];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const choice=a=>a[Math.floor(Math.random()*a.length)];

  const GRAY_PREFIX=[
    'Clearance-Bin','Previously Returned','Mildly Bent','Warranty-Void','Parking-Lot Special','Wet-Cardboard','One-Star Reviewed',
    'Manager Refused','Found Near a Dumpster','Factory-Reject','Loose-Handle','Budget-Cut','Probably a Prop','Questionably Welded',
    'Made During Lunch','Half-Charged','Uninspected','Scratch-and-Dent','Do-Not-Shake','Lowest-Bidder','Already Recalled','Some Assembly Missing'
  ];
  const GREEN_PREFIX=[
    'Probably Fine','Certified-ish','Second Attempt','Repaired With Tape','Surprisingly Functional','Manager-Approved Somehow','Premium-ish',
    'Slightly Less Broken','Technically an Upgrade','Passed Visual Inspection','Mostly Straight','Refurbished Aggressively','Acceptable From Far Away',
    'Barely Within Spec','Good Enough for Night Shift','Warranty Pending','Quality-Control Adjacent','Improved by Accident'
  ];
  const GRAY_SUFFIX=[
    '— FINAL SALE','with One Good Screw','of the Recall Notice','of Immediate Regret','of Questionable Warranty','from the Lost-and-Found',
    'of Poor Life Choices','with Cosmetic Structural Damage','of the Lowest Bid','of Temporary Employment','that Smells Like Ozone',
    'with Instructions Missing','Approved by Nobody','of Advanced Cost Cutting','with a Suspicious Rattle','DO NOT LEAN ON IT'
  ];
  const GREEN_SUFFIX=[
    'of Cautious Optimism','with Most Parts Included','of Conditional Approval','with the Better Handle','of Moderate Improvement',
    'Now With Fewer Sparks','of the Second Purchase Order','with a Real Serial Number','of Nearly Acceptable Craftsmanship',
    'Approved Pending Review','with Only Minor Concerns','of Weapon-Like Performance'
  ];

  const DEFECTS=[
    {id:'backfire',name:'Uninsulated Trigger',desc:'Occasionally shocks the operator for a small amount of HP.',weight:1.15},
    {id:'wrongway',name:'Reversed Assembly',desc:'Occasionally attacks in the exact wrong direction.',weight:.72},
    {id:'recoil',name:'Loose Handle',desc:'Occasionally kicks Crazy Weapon Man backward when fired or swung.',weight:1.0},
    {id:'manaleak',name:'Mana Leak',desc:'Occasionally drains special energy because one seal is apparently decorative.',weight:.82},
    {id:'jam',name:'Intermittent Jam',desc:'Occasionally adds extra recovery time after an attack.',weight:.92},
    {id:'dull',name:'Factory Dull',desc:'Deals less base damage. The edge inspection was conducted by optimism.',weight:1.0,static:true},
    {id:'slow',name:'Bargain Bearings',desc:'Attacks more slowly because friction won the procurement contract.',weight:.92,static:true},
    {id:'critless',name:'Accuracy Optional',desc:'Critical chance is reduced. Precision was outside the project scope.',weight:.68,static:true}
  ];

  function rankOf(w){return Math.max(0,RANKS.indexOf(w?.rar))}
  function rateFor(w){const q=rankOf(w);return RATE[Math.min(RATE.length-1,q)]??.003}
  function weightedDefect(exclude=[]){
    const pool=DEFECTS.filter(d=>!exclude.includes(d.id));let sum=pool.reduce((a,d)=>a+d.weight,0),x=Math.random()*sum;
    for(const d of pool){x-=d.weight;if(x<=0)return d}return pool.at(-1);
  }
  function roastName(w){
    if(w.__cwmRoasted)return;
    const q=rankOf(w),pre=choice(q===0?GRAY_PREFIX:GREEN_PREFIX),suf=choice(q===0?GRAY_SUFFIX:GREEN_SUFFIX);
    let base=String(w.name||`${w.type||'Weapon'}`);
    // Keep existing elemental/model absurdity, but let the cheap construction be the first thing the player reads.
    w.name=`${pre} ${base} ${suf}`.replace(/\s+/g,' ').slice(0,176);
    w.__cwmRoasted=true;w.__cwmRoastPrefix=pre;w.__cwmRoastSuffix=suf;
  }
  function appendDefectText(w,d){
    const line=`DEFECT — ${d.name}: ${d.desc}`;
    if(!String(w.text||'').includes(line))w.text=`${line} ${w.text||''}`.trim();
  }
  function addTraitBadge(w,d){
    w.traits=Array.isArray(w.traits)?w.traits:[];
    if(!w.traits.some(t=>t.code===`cheap_${d.id}`))w.traits.push({code:`cheap_${d.id}`,n:d.name,desc:d.desc,dam:1,spd:1,aoe:1,crit:0});
  }
  function applyStatic(w,d,severity){
    if(d.id==='dull')w.m*=severity>1?.84:.89;
    else if(d.id==='slow')w.__cwmCheapSpeed=(w.__cwmCheapSpeed||1)*(severity>1?.82:.88);
    else if(d.id==='critless')w.crit=Math.max(0,(Number(w.crit)||0)*(severity>1?.42:.62));
  }
  function addDefect(w,d=null){
    if(!w||w.rar==='Training')return w;
    d=d||weightedDefect((w.defects||[]).map(x=>x.id));
    if(!d)return w;
    w.defects=Array.isArray(w.defects)?w.defects:[];
    if(w.defects.some(x=>x.id===d.id))return w;
    const severity=rankOf(w)===0?1.2:1;
    w.defects.push({...d,severity});
    applyStatic(w,d,severity);addTraitBadge(w,d);appendDefectText(w,d);roastName(w);
    w.__cwmDefective=true;
    return w;
  }
  function maybeDefect(w){
    if(!w||w.rar==='Training')return w;
    const q=rankOf(w),rate=rateFor(w);S.made++;S.byRank[q]??={made:0,defective:0};S.byRank[q].made++;
    if(Math.random()<rate){
      addDefect(w);S.defective++;S.byRank[q].defective++;
      if(q===0&&Math.random()<.24)addDefect(w);
      else if(q===1&&Math.random()<.09)addDefect(w);
    }
    return w;
  }

  // Apply after V31 has restored the true rarity/color, so a defect never promotes the weapon.
  const makeW0=makeW;
  makeW=function(...args){return maybeDefect(makeW0(...args))};

  // Static speed defects belong in the same multiplier path as models/boons so the HUD DPS estimate sees them.
  const speed0=weaponSpeedMult;
  weaponSpeedMult=function(w){return speed0(w)*(Number(w?.__cwmCheapSpeed)||1)};

  function fireDefect(w,d,dir,forced=false){
    if(!d)return false;
    const sev=d.severity||1,roll=Math.random();let did=false;
    if(d.id==='backfire'&&(forced||roll<.17*sev)){
      const h=Math.max(1,Math.round(pl.max*(.014*sev)));pl.hp=Math.max(1,pl.hp-h);txt(pl.x+17,pl.y-38,`CHEAP WIRING -${h} HP`,'#ff8c72',true);part(pl.x+17,pl.y+20,'#ff9a72',7,120,4);shake=Math.max(shake,4);did=true;
    }else if(d.id==='recoil'&&(forced||roll<.20*sev)){
      pl.vx-=dir*(150*sev);pl.vy=Math.min(pl.vy,-65*sev);pl.on=false;txt(pl.x+17,pl.y-34,'HANDLE SLIPPED','#ffe08a',false);did=true;
    }else if(d.id==='manaleak'&&(forced||roll<.19*sev)){
      const drain=Math.round(7*sev);pl.mana=Math.max(0,pl.mana-drain);txt(pl.x+17,pl.y-34,`LEAK -${drain} SPECIAL`,'#85dfff',false);did=true;
    }else if(d.id==='jam'&&(forced||roll<.18*sev)){
      const extra=.085*sev;pl.at=Math.max(pl.at,extra)+(extra*.45);pl.atMax=Math.max(pl.atMax||0,pl.at);txt(pl.x+17,pl.y-34,'JAMMED. GREAT.','#ffcf77',false);did=true;
    }
    if(did){S.triggered++;S.lastTrigger=d.id}
    return did;
  }

  const attack0=attack;
  attack=function(...args){
    const w=curW(),defs=Array.isArray(w?.defects)?w.defects:[],dir=pl.dir||1;
    const backwards=defs.find(d=>d.id==='wrongway');
    const shouldWrong=!!backwards&&Math.random()<.13*(backwards.severity||1);
    if(shouldWrong){pl.dir=-dir;txt(pl.x+17,pl.y-34,'ASSEMBLED BACKWARDS','#ffcf77',false);S.triggered++;S.lastTrigger='wrongway'}
    const before=pl.at,r=attack0(...args),fired=pl.at>before;
    if(shouldWrong)pl.dir=dir;
    if(fired)for(const d of defs)if(d.id!=='wrongway')fireDefect(w,d,dir,false);
    return r;
  };

  function sampleEarly(n=3000){
    const oz=zoneI,os=stageClears,stats={common:{made:0,bad:0,double:0},rare:{made:0,bad:0,double:0},epic:{made:0,bad:0}};
    try{
      zoneI=0;stageClears=0;
      for(let i=0;i<n;i++){
        const w=makeW(1,false),q=rankOf(w),k=q===0?'common':q===1?'rare':q===2?'epic':null;if(!k)continue;
        stats[k].made++;if(w.defects?.length){stats[k].bad++;if(w.defects.length>1&&'double'in stats[k])stats[k].double++}
      }
    }finally{zoneI=oz;stageClears=os}
    for(const s of Object.values(stats))s.rate=s.bad/Math.max(1,s.made);
    return stats;
  }
  function forceDefect(w,id='backfire'){return addDefect(w,DEFECTS.find(d=>d.id===id)||DEFECTS[0])}
  function triggerForTest(id='backfire'){
    const d={...(DEFECTS.find(x=>x.id===id)||DEFECTS[0]),severity:1.2},w=curW();return fireDefect(w,d,pl.dir||1,true);
  }

  globalThis.CWM_CHEAP_WEAPONS_V32={version:'v32-bargain-bin-defects',defects:DEFECTS,rates:RATE,state:()=>({...S,byRank:JSON.parse(JSON.stringify(S.byRank))}),sampleEarly,forceDefect,triggerForTest};

  if(new URLSearchParams(location.search).get('cheapV32Smoke')==='1')setTimeout(()=>{
    try{
      const root=document.documentElement,s=sampleEarly(3600);
      const ok=s.common.made>1500&&s.rare.made>500&&s.common.rate>.78&&s.rare.rate>.54&&s.epic.rate<.28;
      root.dataset.cwmCheapV32=ok?'pass':'fail';
      root.dataset.cwmCheapRates=`${s.common.rate.toFixed(3)}|${s.rare.rate.toFixed(3)}|${s.epic.rate.toFixed(3)}`;
      root.dataset.cwmCheapCounts=`${s.common.made}|${s.rare.made}|${s.epic.made}`;
      root.dataset.cwmCheapDouble=String(s.common.double);
      try{window.__KM_DEBUG?.start?.();triggerForTest('backfire');root.dataset.cwmCheapTrigger=S.lastTrigger==='backfire'?'pass':'fail'}catch(e){root.dataset.cwmCheapTrigger='fail';root.dataset.cwmCheapTriggerError=String(e).slice(0,120)}
    }catch(e){document.documentElement.dataset.cwmCheapV32='fail';document.documentElement.dataset.cwmCheapError=String(e).slice(0,160)}
  },650);
})();
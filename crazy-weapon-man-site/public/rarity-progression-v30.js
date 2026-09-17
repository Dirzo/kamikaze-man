(()=>{
  if(globalThis.__CWM_RARITY_V30)return;
  globalThis.__CWM_RARITY_V30=true;

  const TIERS=[
    {n:'Common',             col:'#f4f7ff',m:1.00,p:1.00},
    {n:'Rare',               col:'#57e389',m:1.14,p:1.10},
    {n:'Epic',               col:'#4d8dff',m:1.31,p:1.22},
    {n:'Ultra',              col:'#ffd84d',m:1.52,p:1.36},
    {n:'Mythic',             col:'#ff8a3d',m:1.78,p:1.53},
    {n:'Legendary',          col:'#ff3f52',m:2.10,p:1.74},

    {n:'Gleaming Rare',      col:'#72f79b',m:2.30,p:1.92},
    {n:'Gleaming Epic',      col:'#68a6ff',m:2.53,p:2.12},
    {n:'Gleaming Ultra',     col:'#ffe469',m:2.80,p:2.35},
    {n:'Gleaming Mythic',    col:'#ff9e55',m:3.12,p:2.61},
    {n:'Gleaming Legendary', col:'#ff5968',m:3.50,p:2.91},

    {n:'Radiant Rare',       col:'#8cffae',m:3.85,p:3.18},
    {n:'Radiant Epic',       col:'#82b9ff',m:4.24,p:3.48},
    {n:'Radiant Ultra',      col:'#ffed82',m:4.70,p:3.82},
    {n:'Radiant Mythic',     col:'#ffb06d',m:5.22,p:4.20},
    {n:'Radiant Legendary',  col:'#ff7480',m:5.82,p:4.64},

    {n:'Ascendant Rare',     col:'#afffc5',m:6.42,p:5.05},
    {n:'Ascendant Epic',     col:'#a2d1ff',m:7.10,p:5.52},
    {n:'Ascendant Ultra',    col:'#fff5a4',m:7.88,p:6.06},
    {n:'Ascendant Mythic',   col:'#ffc18d',m:8.78,p:6.68},
    {n:'Ascendant Legendary',col:'#ff98a3',m:9.82,p:7.40}
  ].map((x,i)=>({...x,c:Math.max(.00005,1000000*Math.pow(.39,i)),cycle:i===0?0:1+Math.floor((i-1)/5),step:i===0?0:((i-1)%5)+1}));

  // Keep the original arrays themselves alive because older modules retain references to them.
  R.splice(0,R.length,...TIERS.map(x=>({...x})));
  RANKS.splice(0,RANKS.length,...R.map(x=>x.n));

  const BASE_NAMES={
    sword:['Parking Meter Greatsword','Breakroom Claymore','Liability Saber','Municipal Guillotine','Deadline Divider','Overtime Zweihander','Exit Interview Blade','Cafeteria Executioner','Budget Apocalypse','Forklift Longsword','Unauthorized Broadsword','Quarterly Results Cleaver'],
    dagger:['Stapler Shiv','Expense Report Stiletto','Pocket Lawsuit','Breakroom Fang','Tiny Hostile Merger','Emergency Letter Opener','Audit Needle','Probation Kris','Unpaid Intern Knife','Desk Drawer Problem','HR Toothpick','Micro Catastrophe'],
    nunchucks:['OSHA Nunchucks','Double Payroll Bonk','Chain of Command','Performance Review Flails','Two-Factor Concussion','Revolving Complaint','LinkedIn Connection','Meeting Canceller','Rotating Liability','Corporate Chucks'],
    katana:['Severance Katana','Quarterly Nodachi','Overtime Wakizashi','Audit Katana','Railway Samurai Problem','HR Drawblade','Spreadsheet Slayer','Deadline Tachi','Neon Resignation','Boardroom Iaijutsu'],
    bow:['Foreclosure Longbow','Parking Enforcement Bow','Rebar Recurve','Compliance Compound','Hostile Geometry','Spreadsheet Ballista','Budget Siege Bow','Arrow-Based Email','Performance Improvement Bow','Municipal Warbow','Overdraft Launcher'],
    shuriken:['Quarterly Throwing Star','Audit Disc','Five-Point Lawsuit','Payroll Shuriken','Circular Reasoning','Orbiting Complaint','Ninja Spreadsheet','Expense Report Star','Meeting Cancellation Disc','Rotating Tax Form'],
    wand:['Microwave Wand','Parking Citation Wand','Wizard Flashlight','Union Arc Wand','Breakroom Scepter','Overtime Pointer','Arcane Barcode Scanner','Liability Wand','Budget Necromancy Stick','Municipal Magic Rod','Questionable Laser Pointer','Forbidden Food Court Wand'],
    staff:['Utility Pole of Power','Wizard Rebar','Payroll Staff','Municipal Lightning Rod','Long Meeting Staff','Arc Furnace Scepter','Storm Drain Staff','Corporate Wizard Pole','Emergency Conduit','Weather Department Stick','Budget Totem','Forklift Mage Staff'],
    hammer:['Performance Review Hammer','Concrete Opinion','Debt Restructurer','Municipal Maul','Portable Workplace Accident','Compliance Crusher','Quarterly Pile Driver','Union Negotiator','Meeting Gavel XL','Budget Demolition Tool','HR Complaint Hammer','Forklift Bonker']
  };
  for(const [type,names] of Object.entries(BASE_NAMES)){
    if(!N[type])N[type]=[];
    for(const name of names)if(!N[type].includes(name))N[type].push(name);
  }

  const EXTRA_PREFIXES=['Weaponized','Overqualified','Underfunded','Catastrophically Approved','Union-Certified','Management-Resistant','Municipally Enchanted','Legally Distinct','Extremely Taxable','Unreasonably Polished','Aggressively Laminated','Performance-Managed','Budget-Overrun','Executive-Grade','Night-Shift','Lunch-Break','Overtime-Forged','Suspiciously Insured','Accidentally Sentient','Formally Escalated','Noncompliant','Backordered','Forklift-Compatible','OSHA-Adjacent','Deeply Unnecessary','Hostilely Optimized','Questionably Blessed','Professionally Dangerous'];
  const EXTRA_SUFFIXES=['of Escalating Consequences','of the Final Email','of Mandatory Overtime','of Unapproved Capital Spending','of the Broken Printer','of Hostile Procurement','of the Third Shift','of Catastrophic Synergy','of the Lost Purchase Order','of Weaponized Compliance','of the Emergency Meeting','of Financial Violence','of Questionable Governance','of the Loading Dock','of Zero Follow-Up Questions','of Immediate Corrective Action','of the Forbidden Breakroom','of Extremely Poor Judgment','of the Municipal Budget Crisis','of Unscheduled Career Development','of the Last Available Forklift','of Advanced Bonking','of the Infinite Spreadsheet','of Several OSHA Findings'];
  for(const x of EXTRA_PREFIXES)if(!PF.includes(x))PF.push(x);
  for(const x of EXTRA_SUFFIXES)if(!SUFFIXES.includes(x))SUFFIXES.push(x);

  const zoneProfiles=[
    {floor:0,target:.55,ceil:2},
    {floor:0,target:1.35,ceil:3},
    {floor:1,target:2.55,ceil:5},
    {floor:2,target:4.15,ceil:7},
    {floor:4,target:6.45,ceil:10},
    {floor:6,target:9.35,ceil:15},
    {floor:9,target:13.20,ceil:20}
  ];

  function progressProfile(elite=false){
    const z=Math.max(0,Math.min(zoneProfiles.length-1,Number(zoneI)||0)),base=zoneProfiles[z];
    let local=0;
    try{local=Math.max(0,Math.min(1,stageClears/Math.max(1,stageGoal())))}catch(_){local=0}
    const target=Math.min(R.length-1,base.target+local*(.75+z*.13)+(elite?1.05:0));
    let floor=base.floor+(local>.68?1:0)+(elite&&z>=3?1:0);
    floor=Math.min(Math.floor(target),floor,R.length-1);
    const ceil=Math.min(R.length-1,base.ceil+(elite?1:0)+(local>.78?1:0));
    return{zone:z,floor,target,ceil,local};
  }

  rarityCeiling=function(elite=false){return progressProfile(elite).ceil};
  rr=function(elite=false){
    const pr=progressProfile(elite),items=[];
    for(let i=pr.floor;i<=pr.ceil;i++){
      const d=i-pr.target;
      // Lower tiers fade out quickly as the run advances. Higher tiers remain exciting tail rolls.
      let weight=d<=0?Math.pow(.43,-d):Math.pow(elite?.39:.29,d);
      if(i===pr.floor)weight*=.78;
      if(i===pr.ceil)weight*=1.10;
      items.push([i,weight]);
    }
    const breachChance=(elite?.010:.0025)*(1+pr.zone*.22),room=Math.min(2,R.length-1-pr.ceil);
    if(room>0&&Math.random()<breachChance)return R[pr.ceil+1+(room>1&&Math.random()<.18?1:0)];
    let total=items.reduce((a,x)=>a+x[1],0),roll=Math.random()*total;
    for(const [i,w] of items){roll-=w;if(roll<=0)return R[i]}
    return R[Math.round(pr.target)]||R[0];
  };

  // Rarity should feel like power. Remove the old hidden penalty that largely canceled rarity multipliers.
  combatScale=function(){return .72};

  rollMod=function(r,type){
    const rank=rarityIndex(r);
    if(rank<=1)return pick(['power','speed']);
    if(rank<=4){
      const mid={
        sword:['haste','critstorm','execution'],dagger:['haste','critstorm','execution'],nunchucks:['haste','critstorm','nova'],katana:['haste','critstorm','execution'],
        bow:['pierce','critstorm','haste'],shuriken:['pierce','critstorm','haste'],wand:['echo','critstorm','haste'],staff:['nova','critstorm','power'],hammer:['nova','execution','power']
      };
      return pick(mid[type]||['haste','critstorm','power']);
    }
    const high={
      sword:['execution','nova','haste'],dagger:['execution','nova','haste'],nunchucks:['nova','haste','critstorm'],katana:['execution','nova','critstorm'],
      bow:['multishot','pierce','critstorm'],shuriken:['multishot','pierce','critstorm'],wand:['echo','nova','critstorm'],staff:['nova','echo','critstorm'],hammer:['nova','execution','critstorm']
    };
    return pick(high[type]||['nova','haste','critstorm']);
  };

  function shortRarity(r){
    const i=rarityIndex(r),cycle=i===0?0:1+Math.floor((i-1)/5);
    if(cycle===0)return r.n;
    return r.n;
  }

  buildName=function(type,r,material,traits,intensity){
    const rank=rarityIndex(r),generic=GENERIC[type]||String(type||'Weapon').toUpperCase(),basePool=N[type]||[generic];
    const lead=(traits||[]).filter(t=>t.code!=='hex').map(t=>t.n),tail=(traits||[]).filter(t=>t.code==='hex').map(t=>t.n),parts=[];
    const base=pick(basePool);
    if(rank===0){
      if(Math.random()<.44)parts.push(pick(PF));
      parts.push(base);
      if(Math.random()<.18)parts.push(pick(SUFFIXES));
      return parts.join(' ');
    }
    if(rank<=2){
      if(Math.random()<.72)parts.push(pick(PF));
      if(material&&Math.random()<.55)parts.push(material.n);
      parts.push(base);
      if(Math.random()<(.26+rank*.12))parts.push(pick(SUFFIXES));
      return parts.join(' ');
    }
    // Higher rarities deliberately become more elaborate: the name itself communicates escalation.
    if(rank>=6)parts.push(shortRarity(r));
    if(lead.length)parts.push(...lead.slice(0,rank>=11?2:1));
    if(material)parts.push(material.n);
    if(intensity)parts.push(intensity);
    if(Math.random()<.82)parts.push(pick(PF));
    parts.push(base);
    if(tail.length)parts.push(...tail.slice(0,1));
    if(Math.random()<Math.min(.92,.42+rank*.028))parts.push(pick(SUFFIXES));
    return parts.join(' ').slice(0,154);
  };

  const early0=makeEarlyWeapon;
  makeEarlyWeapon=function(...args){
    const w=early0(...args);
    if(w&&typeof w.name==='string')w.name=w.name.replace(/Emergency Uncommon/gi,'Emergency Rare');
    return w;
  };

  const announce0=announce;
  announce=function(w){
    const out=announce0(w),i=rarityIndex(w),cycle=i===0?0:1+Math.floor((i-1)/5),step=i===0?0:((i-1)%5)+1;
    const stars=cycle?('✦'.repeat(Math.min(4,cycle+1))+' '):'';
    const cycleText=cycle===0?'BASE ARSENAL':cycle===1?'GLEAMING CYCLE':cycle===2?'RADIANT CYCLE':'ASCENDANT CYCLE';
    if(U?.br)U.br.textContent=`${stars}${w.rar.toUpperCase()} // ${cycleText}`;
    if(i>=6){
      chroma=Math.max(chroma,.06+cycle*.04);
      ring(pl.x+17,pl.y+22,'#ffffff',94+cycle*18,2+cycle);
    }
    return out;
  };

  function tierInfo(){return R.map((r,i)=>({rank:i,name:r.n,color:r.col,m:r.m,p:r.p,cycle:r.cycle,step:r.step}))}
  function profileFor(zone,elite=false,local=0){
    const oldZ=zoneI,oldClears=stageClears;
    try{
      zoneI=Math.max(0,Math.min(zoneProfiles.length-1,zone|0));
      const g=Math.max(1,stageGoal());stageClears=Math.round(Math.max(0,Math.min(1,local))*g);
      return progressProfile(elite);
    }finally{zoneI=oldZ;stageClears=oldClears}
  }
  function sampleZone(zone,n=1000,elite=false){
    const oldZ=zoneI,oldClears=stageClears,out=Array(R.length).fill(0);let sum=0;
    try{
      zoneI=Math.max(0,Math.min(zoneProfiles.length-1,zone|0));stageClears=0;
      for(let k=0;k<n;k++){const r=rr(elite),i=RANKS.indexOf(r.n);out[i]++;sum+=i}
    }finally{zoneI=oldZ;stageClears=oldClears}
    return{zone,n,elite,avg:sum/Math.max(1,n),counts:out};
  }

  globalThis.CWM_RARITY_V30={version:'v30-color-cycle-progression',tiers:tierInfo,profile:profileFor,sampleZone,state:()=>({tiers:tierInfo(),zone:zoneI,profile:progressProfile(false)})};

  if(new URLSearchParams(location.search).get('rarityV30Smoke')==='1')setTimeout(()=>{
    try{
      const root=document.documentElement,names=R.map(x=>x.n),powers=R.map(x=>x.m),profiles=[0,2,4,6].map(z=>profileFor(z,false,0));
      const orderOk=['Common','Rare','Epic','Ultra','Mythic','Legendary','Gleaming Rare','Gleaming Epic','Gleaming Ultra','Gleaming Mythic','Gleaming Legendary','Radiant Rare','Radiant Epic','Radiant Ultra','Radiant Mythic','Radiant Legendary','Ascendant Rare','Ascendant Epic','Ascendant Ultra','Ascendant Mythic','Ascendant Legendary'].every((x,i)=>names[i]===x);
      const powerOk=powers.every((x,i)=>i===0||x>powers[i-1]);
      const progressOk=profiles.every((x,i)=>i===0||x.target>profiles[i-1].target)&&profiles.every((x,i)=>i===0||x.floor>=profiles[i-1].floor);
      root.dataset.cwmRarityV30=(orderOk&&powerOk&&progressOk&&R.length===21)?'pass':'fail';
      root.dataset.cwmRarityTiers=String(R.length);
      root.dataset.cwmRarityNames=names.join('|');
      root.dataset.cwmRarityPowers=powers.join('|');
      root.dataset.cwmRarityTargets=profiles.map(x=>x.target.toFixed(2)).join('|');
    }catch(e){document.documentElement.dataset.cwmRarityV30='fail';document.documentElement.dataset.cwmRarityError=String(e).slice(0,140)}
  },700);
})();
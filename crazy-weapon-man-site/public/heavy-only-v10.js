(()=>{
  if(globalThis.__CWM_HEAVY_ONLY_V10)return;
  globalThis.__CWM_HEAVY_ONLY_V10=true;
  const BUILD='v10-heavy-only-20260915a';
  const BASES=[
    {id:'industrial_maul',label:'Industrial Maul',subclass:'heavy_melee'},
    {id:'siege_hammer',label:'Siege Hammer',subclass:'heavy_melee'},
    {id:'pile_driver',label:'Pile Driver',subclass:'heavy_melee'},
    {id:'welded_cleaver',label:'Welded Cleaver',subclass:'heavy_melee'},
    {id:'junk_cannon',label:'Junk Cannon',subclass:'heavy_ballistic'},
    {id:'scrap_mortar',label:'Scrap Mortar',subclass:'heavy_ballistic'},
    {id:'rotary_reclaimer',label:'Rotary Reclaimer',subclass:'heavy_ballistic'},
    {id:'landfill_lobber',label:'Landfill Lobber',subclass:'heavy_ballistic'},
    {id:'pressure_propeller',label:'Pressure Propeller',subclass:'heavy_weird'},
    {id:'siege_toaster',label:'Siege Toaster',subclass:'heavy_weird'}
  ];
  const OLD_BASES=[
    'Sword-Shaped Liability','Five-Point HR Complaint','Performance Review Blade','Administrative Longbow','Administrative Shuriken','Restructuring Katana','Lunch Break Nunchucks','Concussion Necklace','Extremely Sharp Memo','Parking Ticket Wand','Morbidly Obese Staff','Tax Evasion Blade','Long Knife of HR','Emergency Cutlery','Problem Solver','Jagged Saber','Runeblade','Nightblade','Executioner','Moon Saw','Curb Stomper','Falchion','Dagger','Stiletto','Punch Knife','Pocket Menace','Stabby Receipt','Lunch Break Shiv','Needle of Regret','Tiny Crime','Backspace','Kris','Fang','Nunchucks','Payroll Nunchucks','Chain Complaint','Double Bonk','HR Flails','Spinning Liability','Two-Stick Problem','Danger Yo-Yo','Katana','Office Samurai','Overtime Katana','Long Meeting Ender','Payroll Ronin','Quarterly Cut','Iaido Incident','Hunter Bow','War Bow','Composite Bow','Bone Longbow','Hex Bow','Spaghetti Launcher','Moon Bow','Compound Problem','Hostile Geometry','Arrow Dispenser','Shuriken','Ninja Receipt','Throwing Problem','Payroll Star','Spinny Liability','Pocket Windmill','Tax Star','Quarterly Ninja Disk','Arcane Wand','Ember Wand','Hex Wand','Spirit Wand','Spark Wand','OSHA Wand','Wizard Stick','Microwave Wand','Compliance Rod','Questionable Pointer','Oak Staff','Storm Staff','Infernal Staff','Astral Staff','Fat Staff','Payroll Staff','Weather Stick','Wizard Rebar','Staff Meeting','Long Problem','War Hammer','Maul','Stonebreaker','Judgement Hammer','Crusher','HR Complaint','Municipal Hammer','Concrete Opinion','Bonk Engine','Debt Restructurer','Portable Accident','Training Sword'
  ].sort((a,b)=>b.length-a.length);
  const hash=s=>{let h=2166136261>>>0;s=String(s||'');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
  function pickBase(seed){return BASES[hash(seed)%BASES.length]}
  function replaceBaseName(name,base){
    let out=String(name||'').trim();
    for(const old of OLD_BASES){
      const i=out.toLowerCase().indexOf(old.toLowerCase());
      if(i>=0){out=out.slice(0,i)+base.label+out.slice(i+old.length);return out.replace(/\s{2,}/g,' ').trim()}
    }
    if(!out)return base.label;
    if(/training/i.test(out))return 'Training '+base.label;
    return `${out} ${base.label}`.replace(/\s{2,}/g,' ').trim();
  }
  function ensureHeavy(w,{forceName=true}={}){
    if(!w||w.kind==='armor')return w;
    if(w.__cwmHeavyOnlyBuild===BUILD)return w;
    const originalType=w.type||'sword',originalName=String(w.name||'Weapon');
    const base=w.heavyBaseId?BASES.find(x=>x.id===w.heavyBaseId)||pickBase(originalName):pickBase(originalName+'|'+String(w.id||0)+'|'+String(w.rar||''));
    w.__cwmOriginalType=w.__cwmOriginalType||originalType;
    w.__cwmOriginalName=w.__cwmOriginalName||originalName;
    w.type='hammer';
    w.heavyBaseId=base.id;
    w.heavySubclass=base.subclass;
    w.heavyLabel=base.label;
    if(forceName)w.name=replaceBaseName(originalName,base);
    if(originalType!=='hammer'){
      w.mod='none';
      if('cap' in w)w.cap=null;
      if('capName' in w)w.capName='';
      if('capText' in w)w.capText='';
    }
    try{if(typeof detectSynergy==='function')w.synergy=detectSynergy(w)}catch(_){ }
    w.__cwmHeavyOnlyBuild=BUILD;
    return w;
  }
  function trainingHeavy(){
    const base=BASES[0];
    return {
      id:0,type:'hammer',name:'Training Industrial Maul',mod:'none',
      text:'Heavy-only art test weapon. A deliberate two-handed training maul with no other weapon families enabled.',
      rar:'Training',col:'#dfe5ed',p:.8,lv:1,m:1,crit:0,material:null,traits:[],killStacks:0,
      heavyBaseId:base.id,heavySubclass:base.subclass,heavyLabel:base.label,
      __cwmHeavyOnlyBuild:BUILD
    };
  }

  try{if(typeof chooseWeaponType==='function')chooseWeaponType=()=> 'hammer'}catch(e){console.warn('CWM heavy-only chooseWeaponType patch failed',e)}

  for(const key of ['makeW','makeExactRankWeapon','makeFunnyIntroWeapon','makeEarlyWeapon','makeUpgradeW','bossReward']){
    try{
      const fn=eval(key);
      if(typeof fn!=='function')continue;
      const wrapped=function(...args){return ensureHeavy(fn(...args))};
      eval(`${key}=wrapped`);
    }catch(_){ }
  }

  try{
    if(typeof equip==='function'){
      const baseEquip=equip;
      equip=function(w){return baseEquip(ensureHeavy(w))};
    }
  }catch(e){console.warn('CWM heavy-only equip patch failed',e)}

  try{
    if(typeof reset==='function'){
      const baseReset=reset;
      reset=function(...args){
        const r=baseReset(...args);
        try{pl.weapon=trainingHeavy();equipTypeHistory=['hammer'];if(U?.msg)U.msg.textContent='HEAVY-ONLY ART TEST: Training Industrial Maul. All non-heavy weapon families are temporarily disabled.'}catch(_){ }
        return r;
      };
    }
  }catch(e){console.warn('CWM heavy-only reset patch failed',e)}

  try{
    if(typeof pl!=='undefined'){
      pl.weapon=pl.weapon?ensureHeavy(pl.weapon):trainingHeavy();
      if(typeof equipTypeHistory!=='undefined')equipTypeHistory=['hammer'];
    }
  }catch(e){console.warn('CWM heavy-only initial weapon conversion failed',e)}

  fetch('/art/v10/heavy/modular-manifest.json?v=20260915a',{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('HTTP '+r.status)))
    .then(m=>{globalThis.CWM_HEAVY_MANIFEST=m;console.info('CWM heavy modular manifest loaded',m.version)})
    .catch(e=>console.warn('CWM heavy modular manifest failed',e));

  globalThis.CWM_HEAVY_ONLY={
    build:BUILD,
    enabled:true,
    coreType:'hammer',
    bases:BASES.map(x=>({...x})),
    ensureHeavy,
    pickBase,
    state:()=>{try{return {weapon:typeof curW==='function'?curW():null,history:typeof equipTypeHistory!=='undefined'?[...equipTypeHistory]:[]}}catch(_){return null}}
  };
  console.info('CWM HEAVY-ONLY MODE ARMED',globalThis.CWM_HEAVY_ONLY);
})();

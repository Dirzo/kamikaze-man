(()=>{
  if(globalThis.__CWM_HEAVY_ONLY_V10)return;
  globalThis.__CWM_HEAVY_ONLY_V10=true;
  const BUILD='v10-heavy-only-native-20260915c';
  const FALLBACK_BASES=[
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
  const state={build:BUILD,native:false,nativeBuild:'',selfTest:null,lastWeapon:null,lastEnforce:0,error:null};

  function api(){return globalThis.CWL_NATIVE_HEAVY_API||null}
  function ensureHeavy(w){
    const a=api();
    if(a?.ensure)return a.ensure(w);
    if(!w||w.kind==='armor')return w;
    w.type='hammer';
    const b=FALLBACK_BASES[Math.abs(Number(w.id)||0)%FALLBACK_BASES.length];
    w.heavyBaseId=w.heavyBaseId||b.id;w.heavyLabel=w.heavyLabel||b.label;w.heavySubclass=w.heavySubclass||b.subclass;
    return w;
  }
  function snapshot(){
    try{
      const a=api();
      const s=a?.state?.();
      if(s?.weapon)return s;
      const d=globalThis.__KM_DEBUG?.state?.();
      if(d?.weapon)return {weapon:d.weapon,history:['hammer']};
    }catch(_){ }
    return {weapon:null,history:['hammer']};
  }
  function enforce(){
    try{
      const s=snapshot(),w=s.weapon;
      if(w){ensureHeavy(w);state.lastWeapon={type:w.type,base:w.heavyBaseId,name:w.name};state.lastEnforce=Date.now()}
    }catch(e){state.error=String(e?.message||e)}
  }
  function install(){
    const a=api();
    state.native=!!a;state.nativeBuild=a?.build||globalThis.__CWL_NATIVE_HEAVY_LOCK||'';
    if(a?.selfTest){
      try{state.selfTest=a.selfTest(48);if(!state.selfTest?.ok)console.error('CWL native Heavy self-test FAILED',state.selfTest);else console.info('CWL native Heavy self-test PASS',state.selfTest)}
      catch(e){state.error=String(e?.message||e);console.error('CWL native Heavy self-test threw',e)}
    }
    enforce();
  }

  globalThis.CWM_HEAVY_ONLY={
    build:BUILD,enabled:true,coreType:'hammer',
    get bases(){return api()?.bases?.map(x=>({...x}))||FALLBACK_BASES.map(x=>({...x}))},
    ensureHeavy,state:()=>snapshot(),runtime:state,
    selfTest:()=>{const a=api();return a?.selfTest?a.selfTest(48):{ok:false,error:'native Heavy API missing'}}
  };

  fetch('/art/v10/heavy/modular-manifest.json?v=20260915a',{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(new Error('HTTP '+r.status)))
    .then(m=>{globalThis.CWM_HEAVY_MANIFEST=m})
    .catch(e=>console.warn('CWM heavy modular manifest failed',e));

  install();
  const timer=setInterval(()=>{enforce();if(state.native&&state.selfTest?.ok&&Date.now()-state.lastEnforce<1500){}},250);
  addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  console.info('CWM HEAVY-ONLY MODE ARMED',globalThis.CWM_HEAVY_ONLY);
})();

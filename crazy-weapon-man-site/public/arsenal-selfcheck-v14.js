(()=>{
  if(globalThis.__CWM_ARSENAL_SELFCHECK_V14)return;
  globalThis.__CWM_ARSENAL_SELFCHECK_V14=true;
  const EXPECTED=['sword','dagger','nunchucks','katana','bow','shuriken','wand','staff','hammer'];
  const EXPECTED_NEW=['ice','plasma','void','wind','radiant','whiteout','meltdown','singularity','blowback','solar-flare'];
  const state={last:null,runs:0};

  function expose(r){
    globalThis.__CWM_ARSENAL_PROOF=r;
    const root=document.documentElement;
    if(root){
      root.dataset.cwmArsenalProof=r.ok?'pass':'fail';
      root.dataset.cwmArsenalTypes=`${r.typePassed}/${EXPECTED.length}`;
      root.dataset.cwmArsenalNewElements=`${r.newElementPassed}/${EXPECTED_NEW.length}`;
      root.dataset.cwmArsenalModels=String(r.modelManifestCount||0);
      root.dataset.cwmHeavyOnly=r.heavyOnly?'yes':'no';
      root.dataset.cwmArsenalVersion=globalThis.__CWM_GAME_VERSION||'unknown';
    }
    let el=document.getElementById('cwmArsenalProof');
    if(!el&&document.body){el=document.createElement('div');el.id='cwmArsenalProof';el.hidden=true;document.body.appendChild(el)}
    if(el)el.textContent=JSON.stringify(r);
  }

  function run(n=1800){
    const api=globalThis.CWM_ARSENAL_V14;
    const result={ok:false,rolls:n,types:{},elements:{},models:{},missingTypes:[],missingNewElements:[],typePassed:0,newElementPassed:0,modelManifestCount:0,heavyOnly:false,error:null,at:Date.now()};
    try{
      if(!api||typeof makeW!=='function')throw new Error('arsenal API or makeW unavailable');
      const sample=api.sample(n);result.types=sample.types;result.elements=sample.elements;result.models=sample.models;
      result.missingTypes=EXPECTED.filter(t=>!(sample.types[t]>0));result.typePassed=EXPECTED.length-result.missingTypes.length;
      result.missingNewElements=EXPECTED_NEW.filter(t=>!(sample.elements[t]>0));result.newElementPassed=EXPECTED_NEW.length-result.missingNewElements.length;
      result.modelManifestCount=Object.values(api.models||{}).reduce((s,a)=>s+(Array.isArray(a)?a.length:0),0);
      result.heavyOnly=result.typePassed===1&&!!sample.types.hammer;
      const old=globalThis.CWM_ELEMENTS;
      result.legacyElements={positive:old?.positive?.length||0,negative:old?.negative?.length||0};
      result.ok=result.typePassed===EXPECTED.length&&result.newElementPassed===EXPECTED_NEW.length&&result.modelManifestCount>=54&&!result.heavyOnly&&result.legacyElements.positive>=5&&result.legacyElements.negative>=5;
    }catch(e){result.error=String(e?.message||e)}
    state.last=result;state.runs++;expose(result);
    result.ok?console.info('CWM arsenal self-check: PASS',result):console.error('CWM arsenal self-check: FAIL',result);
    return result;
  }

  function showcase(){
    const api=globalThis.CWM_ARSENAL_V14,d=globalThis.__KM_DEBUG;
    if(!api||!d)return false;
    try{
      d.start();
      const w=d.equip('staff','Legendary');
      api.forceModel(w,'Arc Furnace Staff');api.forceElement(w,'plasma');
      for(let i=0;i<5;i++)d.spawn(i%2?'crawler':'stalker',false);
      setTimeout(()=>d.attack(),120);
      setTimeout(()=>d.attack(),430);
      setTimeout(()=>d.attack(),760);
      document.documentElement.dataset.cwmArsenalShowcase='ready';
      return true;
    }catch(e){console.warn('Arsenal showcase failed',e);return false}
  }

  globalThis.CWM_ARSENAL_CHECK={run,showcase,state,expectedTypes:EXPECTED,expectedNewElements:EXPECTED_NEW};
  const qs=new URLSearchParams(location.search);
  if(qs.has('arsenalSmoke')||qs.has('arsenalShowcase')){
    const wait=setInterval(()=>{
      if(!globalThis.CWM_ARSENAL_V14||typeof makeW!=='function')return;
      clearInterval(wait);run(Number(qs.get('rolls'))||1800);if(qs.has('arsenalShowcase'))setTimeout(showcase,250);
    },75);
    setTimeout(()=>{clearInterval(wait);if(!state.last){const r={ok:false,error:'arsenal self-check timeout',typePassed:0,newElementPassed:0,modelManifestCount:0,heavyOnly:false};state.last=r;expose(r)}},7000);
  }else{
    const manifest={ok:!!globalThis.CWM_ARSENAL_V14,rolls:0,types:{},elements:{},models:{},missingTypes:[],missingNewElements:[],typePassed:0,newElementPassed:0,modelManifestCount:Object.values(globalThis.CWM_ARSENAL_V14?.models||{}).reduce((s,a)=>s+(a?.length||0),0),heavyOnly:false,manifestOnly:true,at:Date.now()};state.last=manifest;expose(manifest);
  }
})();

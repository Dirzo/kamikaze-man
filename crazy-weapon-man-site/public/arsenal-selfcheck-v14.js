(()=>{
  if(globalThis.__CWM_ARSENAL_SELFCHECK_V14)return;
  globalThis.__CWM_ARSENAL_SELFCHECK_V14=true;
  const EXPECTED=['sword','dagger','nunchucks','katana','bow','shuriken','wand','staff','hammer'];
  const EXPECTED_NEW=['ice','plasma','void','wind','radiant','whiteout','meltdown','singularity','blowback','solar-flare'];
  const state={last:null,runs:0,controls:null};

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
      root.dataset.cwmSpecialsProof=r.specialsOK?'pass':'fail';
      root.dataset.cwmSpecialsTypes=`${r.specialTypePassed||0}/${EXPECTED.length}`;
      root.dataset.cwmSpecialKey=(r.specialKey||'unknown').toLowerCase();
      root.dataset.cwmManaMechanic=r.manaMechanic===false?'off':'on';
    }
    let el=document.getElementById('cwmArsenalProof');
    if(!el&&document.body){el=document.createElement('div');el.id='cwmArsenalProof';el.hidden=true;document.body.appendChild(el)}
    if(el)el.textContent=JSON.stringify(r);
  }

  function run(n=1800){
    const api=globalThis.CWM_ARSENAL_V14,sp=globalThis.CWM_SPECIALS_V15;
    const result={ok:false,rolls:n,types:{},elements:{},models:{},missingTypes:[],missingNewElements:[],typePassed:0,newElementPassed:0,modelManifestCount:0,heavyOnly:false,error:null,at:Date.now(),specialsOK:false,specialTypePassed:0,specialKey:'unknown',manaMechanic:null};
    try{
      if(!api||typeof api.sample!=='function')throw new Error('native arsenal API unavailable');
      const sample=api.sample(n);result.types=sample.types;result.elements=sample.elements;result.models=sample.models;
      result.missingTypes=EXPECTED.filter(t=>!(sample.types[t]>0));result.typePassed=EXPECTED.length-result.missingTypes.length;
      result.missingNewElements=EXPECTED_NEW.filter(t=>!(sample.elements[t]>0));result.newElementPassed=EXPECTED_NEW.length-result.missingNewElements.length;
      result.modelManifestCount=Object.values(api.models||{}).reduce((s,a)=>s+(Array.isArray(a)?a.length:0),0);
      result.heavyOnly=result.typePassed===1&&!!sample.types.hammer;
      const old=globalThis.CWM_ELEMENTS;
      result.legacyElements={positive:old?.positive?.length||0,negative:old?.negative?.length||0};
      const st=sp?.selfTest?.()||{};result.specials=st;result.specialTypePassed=st.types||0;result.specialKey=st.key||'unknown';result.manaMechanic=st.manaMechanic;
      result.specialsOK=!!st.ok&&result.specialTypePassed===EXPECTED.length&&String(result.specialKey).toUpperCase()==='SPACE'&&result.manaMechanic===false;
      result.ok=result.typePassed===EXPECTED.length&&result.newElementPassed===EXPECTED_NEW.length&&result.modelManifestCount>=54&&!result.heavyOnly&&result.legacyElements.positive>=5&&result.legacyElements.negative>=5&&result.specialsOK;
    }catch(e){result.error=String(e?.message||e)}
    state.last=result;state.runs++;expose(result);
    result.ok?console.info('CWM arsenal self-check: PASS',result):console.error('CWM arsenal self-check: FAIL',result);
    return result;
  }

  function controlTest(){
    const sp=globalThis.CWM_SPECIALS_V15,d=globalThis.__KM_DEBUG,root=document.documentElement;
    const out={ok:false,aInactive:false,spaceFired:false,spaceCooldown:0,error:null};
    try{
      if(!sp||!d)throw new Error('special/debug API unavailable');
      d.start();d.equip('sword','Rare');sp.forceReady();
      document.dispatchEvent(new KeyboardEvent('keydown',{key:'a',code:'KeyA',bubbles:true,cancelable:true}));
      out.aInactive=sp.state().remaining<=.01;
      sp.forceReady();
      document.dispatchEvent(new KeyboardEvent('keydown',{key:' ',code:'Space',bubbles:true,cancelable:true}));
      out.spaceCooldown=sp.state().remaining;out.spaceFired=out.spaceCooldown>.2;out.ok=out.aInactive&&out.spaceFired;
    }catch(e){out.error=String(e?.message||e)}
    state.controls=out;globalThis.__CWM_SPECIAL_CONTROL_PROOF=out;
    if(root){root.dataset.cwmACombatKey=out.aInactive?'retired':'active';root.dataset.cwmSpaceSpecial=out.spaceFired?'pass':'fail'}
    return out;
  }

  function showcase(){
    const api=globalThis.CWM_ARSENAL_V14,d=globalThis.__KM_DEBUG;
    if(!api||!d)return false;
    try{
      d.start();
      const w=d.equip('staff','Legendary');
      api.forceModel(w,'Arc Furnace Staff');api.forceElement(w,'plasma');
      for(let i=0;i<5;i++)d.spawn(i%2?'crawler':'stalker',false);
      setTimeout(()=>d.attack(),120);setTimeout(()=>d.attack(),430);setTimeout(()=>d.attack(),760);
      document.documentElement.dataset.cwmArsenalShowcase='ready';
      return true;
    }catch(e){console.warn('Arsenal showcase failed',e);return false}
  }

  globalThis.CWM_ARSENAL_CHECK={run,controlTest,showcase,state,expectedTypes:EXPECTED,expectedNewElements:EXPECTED_NEW};
  const qs=new URLSearchParams(location.search);
  if(qs.has('arsenalSmoke')||qs.has('arsenalShowcase')){
    const wait=setInterval(()=>{
      if(!globalThis.CWM_ARSENAL_V14||!globalThis.CWM_SPECIALS_V15)return;
      clearInterval(wait);run(Number(qs.get('rolls'))||1800);setTimeout(controlTest,80);if(qs.has('arsenalShowcase'))setTimeout(showcase,260);
    },75);
    setTimeout(()=>{clearInterval(wait);if(!state.last){const r={ok:false,error:'arsenal self-check timeout',typePassed:0,newElementPassed:0,modelManifestCount:0,heavyOnly:false,specialsOK:false,specialTypePassed:0,manaMechanic:null};state.last=r;expose(r)}},7000);
  }else{
    const api=globalThis.CWM_ARSENAL_V14,sp=globalThis.CWM_SPECIALS_V15,st=sp?.selfTest?.()||{};
    const manifest={ok:!!api&&!!st.ok,rolls:0,types:{},elements:{},models:{},missingTypes:[],missingNewElements:[],typePassed:0,newElementPassed:0,modelManifestCount:Object.values(api?.models||{}).reduce((s,a)=>s+(a?.length||0),0),heavyOnly:false,manifestOnly:true,at:Date.now(),specialsOK:!!st.ok,specialTypePassed:st.types||0,specialKey:st.key||'unknown',manaMechanic:st.manaMechanic};state.last=manifest;expose(manifest);
  }
})();
(()=>{
  if(globalThis.__CWM_HORDE_SELFCHECK_V16)return;
  globalThis.__CWM_HORDE_SELFCHECK_V16=true;
  const qs=new URLSearchParams(location.search),state={last:null};

  function expose(r){
    state.last=r;globalThis.__CWM_HORDE_PROOF=r;
    const root=document.documentElement;if(!root)return;
    root.dataset.cwmHordeProof=r.ok?'pass':'fail';
    root.dataset.cwmHordeCount=String(r.count||0);
    root.dataset.cwmHordeCrowdHits=String(r.crowdHits||0);
    root.dataset.cwmHordeCap=String(r.hardCap||0);
    root.dataset.cwmProjectileCap=String(r.projectileCap||0);
    root.dataset.cwmElementFamilies=String(r.elementFamilies||0);
    root.dataset.cwmElementReactionProof=r.elementOk?'pass':'fail';
  }

  function run(){
    const out={ok:false,count:0,crowdHits:0,hardCap:0,projectileCap:0,elementFamilies:0,elementOk:false,error:null,at:Date.now()};
    try{
      const d=globalThis.__KM_DEBUG,h=globalThis.CWM_HORDE_V16,el=globalThis.CWM_ELEMENTAL_OVERDRIVE_V16,ars=globalThis.CWM_ARSENAL_V14;
      if(!d||!h||!el||!ars)throw new Error('horde/elemental APIs unavailable');
      d.start();d.setZone(4);E=[];P=[];Q=[];F=[];pl.inv=999;pack=4;stageClears=2;
      const w=d.equip('sword','Legendary');ars.forceElement(w,'plasma');w.type='sword';pl.weapon=w;pl.acd=0;pl.scd=0;
      const spawned=spawnPack();for(const e of E)if(!e.boss)e.state='approach';
      out.count=E.filter(e=>!e.dead&&!e.boss).length;out.hardCap=h.hardCap;out.projectileCap=h.projectileCap;out.elementFamilies=el.families.length;out.elementOk=out.elementFamilies===10;
      const before=new Map(E.filter(e=>!e.dead&&!e.boss).map(e=>[e.id,e.hp]));
      const target=E.find(e=>!e.dead&&!e.boss);if(!target)throw new Error('horde target missing');
      pl.combo=3;hitE(target,Math.max(1,target.max*.035),{sourceType:'sword',col:w.col});
      out.crowdHits=E.filter(e=>before.has(e.id)&&e.hp<before.get(e.id)).length;
      out.ok=spawned>=10&&out.count>=10&&out.count<=h.hardCap&&out.crowdHits>=2&&out.elementOk&&h.projectileCap<=80;
    }catch(e){out.error=String(e?.message||e)}
    expose(out);out.ok?console.info('CWM horde self-check: PASS',out):console.error('CWM horde self-check: FAIL',out);return out;
  }

  function showcase(){
    try{
      const d=globalThis.__KM_DEBUG,ars=globalThis.CWM_ARSENAL_V14;if(!d||!ars)return false;
      d.start();d.setZone(5);E=[];P=[];Q=[];F=[];pl.inv=999;pack=8;stageClears=3;
      const w=d.equip('staff','Legendary');ars.forceModel(w,'Arc Furnace Staff');ars.forceElement(w,'plasma');w.type='staff';pl.weapon=w;pl.acd=0;pl.scd=0;
      spawnPack();for(const e of E)if(!e.boss)e.state='approach';
      setTimeout(()=>{pl.acd=0;attack()},180);
      setTimeout(()=>{pl.acd=0;attack()},520);
      setTimeout(()=>{pl.acd=0;attack()},860);
      setTimeout(()=>{globalThis.CWM_SPECIALS_V15?.forceReady();skill()},1200);
      document.documentElement.dataset.cwmHordeShowcase='ready';return true;
    }catch(e){console.warn('Horde showcase failed',e);return false}
  }

  globalThis.CWM_HORDE_CHECK={run,showcase,state};
  if(qs.has('hordeSmoke')||qs.has('hordeShowcase')){
    const wait=setInterval(()=>{
      if(!globalThis.__KM_DEBUG||!globalThis.CWM_HORDE_V16||!globalThis.CWM_ELEMENTAL_OVERDRIVE_V16)return;
      clearInterval(wait);if(qs.has('hordeSmoke'))run();if(qs.has('hordeShowcase'))setTimeout(showcase,180);
    },60);
    setTimeout(()=>{clearInterval(wait);if(qs.has('hordeSmoke')&&!state.last)expose({ok:false,error:'horde self-check timeout',count:0,crowdHits:0,hardCap:0,projectileCap:0,elementFamilies:0,elementOk:false})},7000);
  }
})();
(()=>{
  if(globalThis.__CWL_HEAVY_IMPACT_V1)return;
  globalThis.__CWL_HEAVY_IMPACT_V1=true;
  const BUILD='cwl-heavy-impact-v1-20260915b';
  const state={build:BUILD,installed:false,hits:0,lastBase:'',lastAt:0,error:null};
  const center=e=>({x:(e?.x||0)+(e?.w||0)/2,y:(e?.y||0)+(e?.h||0)/2});
  function impact(e,w,base){
    const api=globalThis.CWL_NATIVE_COMBAT,fx=api?.fx;if(!fx)return;
    const c=center(e),col=w?.element?.col||w?.col||'#fff176',t=Number(api.state?.()?.time)||performance.now()/1000;
    if(t-state.lastAt<.035)return;state.lastAt=t;state.hits++;state.lastBase=base;
    try{
      if(base==='industrial_maul'){fx.ring(c.x,c.y+8,col,30,3);fx.part(c.x,c.y+8,col,7,115,5);fx.shake(3.2)}
      else if(base==='siege_hammer'){fx.ring(c.x,c.y,col,24,3);fx.part(c.x,c.y,col,6,145,4);fx.shake(2.7)}
      else if(base==='pile_driver'){fx.ring(c.x,c.y,col,19,2);fx.part(c.x,c.y,col,5,105,4);fx.shake(2.2)}
      else if(base==='welded_cleaver'){const dir=api.state?.()?.pl?.dir||1;fx.beam(c.x-dir*30,c.y-24,c.x+dir*35,c.y+18,col,3);fx.part(c.x,c.y,col,5,125,3);fx.shake(1.8)}
      else if(base==='junk_cannon'){fx.part(c.x,c.y,col,6,165,3);fx.ring(c.x,c.y,col,17,2);fx.shake(1.6)}
      else if(base==='scrap_mortar'){fx.ring(c.x,c.y,col,24,2);fx.part(c.x,c.y,col,5,120,4);fx.shake(1.8)}
      else if(base==='rotary_reclaimer'){if(state.hits%3===0){fx.part(c.x,c.y,col,4,100,2);fx.shake(.8)}}
      else if(base==='landfill_lobber'){fx.ring(c.x,c.y,col,19,2);fx.part(c.x,c.y,col,5,135,3);fx.shake(1.4)}
      else if(base==='pressure_propeller'){fx.ring(c.x,c.y,col,27,2);fx.shake(1.1)}
      else if(base==='siege_toaster'){fx.part(c.x,c.y,'#ffb65c',5,105,3);fx.ring(c.x,c.y,'#ffb65c',18,2);fx.shake(1.2)}
      document.documentElement.dataset.cwlHeavyImpactDraw='pass';
    }catch(err){state.error=String(err?.message||err)}
  }
  function install(){
    const api=globalThis.CWL_NATIVE_COMBAT;
    if(!api?.on||!api?.state){setTimeout(install,80);return}
    if(state.installed)return;
    api.on('hit',ev=>{
      const o=ev?.options||{},e=ev?.enemy,w=ev?.weapon;
      if(!ev?.damage||!e||o.__elementTick||o.__cwlHeavySignature||o.__cwlHeavySpecial)return;
      if(!w||w.type!=='hammer'||globalThis.CWM_WEAPON_VISUAL?.family?.(w)!=='heavy')return;
      const base=String(w.heavyBaseId||globalThis.CWM_HEAVY_ART?.subtype?.(w)||'');
      if(base)impact(e,w,base);
    });
    state.installed=true;document.documentElement.dataset.cwlHeavyImpact='ready';console.info('CWL Heavy impact feedback armed',BUILD);
  }
  install();
  globalThis.CWL_HEAVY_IMPACT={build:BUILD,state,reinstall:install};
})();

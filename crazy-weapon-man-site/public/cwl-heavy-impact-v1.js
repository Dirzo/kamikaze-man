(()=>{
  if(globalThis.__CWL_HEAVY_IMPACT_V1)return;
  globalThis.__CWL_HEAVY_IMPACT_V1=true;
  const BUILD='cwl-heavy-impact-v1-20260915a';
  const state={build:BUILD,installed:false,hits:0,lastBase:'',lastAt:0,error:null};
  const now=()=>typeof time!=='undefined'?Number(time)||0:performance.now()/1000;
  const center=e=>({x:(e?.x||0)+(e?.w||0)/2,y:(e?.y||0)+(e?.h||0)/2});
  function impact(e,w,base,dealt){
    const c=center(e),col=w?.element?.col||w?.col||'#fff176',t=now();
    if(t-state.lastAt<.035)return;state.lastAt=t;state.hits++;state.lastBase=base;
    try{
      if(base==='industrial_maul'){
        ring(c.x,c.y+8,col,30,3);part(c.x,c.y+8,col,7,115,5);shake=Math.max(shake,3.2);
      }else if(base==='siege_hammer'){
        ring(c.x,c.y,col,24,3);part(c.x,c.y,col,6,145,4);shake=Math.max(shake,2.7);
      }else if(base==='pile_driver'){
        ring(c.x,c.y,col,19,2);part(c.x,c.y,col,5,105,4);shake=Math.max(shake,2.2);
      }else if(base==='welded_cleaver'){
        const dir=pl?.dir||1;beam(c.x-dir*30,c.y-24,c.x+dir*35,c.y+18,col,3);part(c.x,c.y,col,5,125,3);shake=Math.max(shake,1.8);
      }else if(base==='junk_cannon'){
        part(c.x,c.y,col,6,165,3);ring(c.x,c.y,col,17,2);shake=Math.max(shake,1.6);
      }else if(base==='scrap_mortar'){
        ring(c.x,c.y,col,24,2);part(c.x,c.y,col,5,120,4);shake=Math.max(shake,1.8);
      }else if(base==='rotary_reclaimer'){
        if(state.hits%3===0){part(c.x,c.y,col,4,100,2);shake=Math.max(shake,.8)}
      }else if(base==='landfill_lobber'){
        ring(c.x,c.y,col,19,2);part(c.x,c.y,col,5,135,3);shake=Math.max(shake,1.4);
      }else if(base==='pressure_propeller'){
        ring(c.x,c.y,col,27,2);shake=Math.max(shake,1.1);
      }else if(base==='siege_toaster'){
        part(c.x,c.y,'#ffb65c',5,105,3);ring(c.x,c.y,'#ffb65c',18,2);shake=Math.max(shake,1.2);
      }
      document.documentElement.dataset.cwlHeavyImpactDraw='pass';
    }catch(err){state.error=String(err?.message||err)}
  }
  function install(){
    try{
      if(typeof hitE!=='function'){setTimeout(install,80);return}
      if(hitE.__cwlHeavyImpact){state.installed=true;return}
      const baseHit=hitE;
      const wrapped=function(e,a,o={}){
        const dealt=baseHit(e,a,o);
        if(!dealt||!e||o.__elementTick||o.__cwlHeavySignature||o.__cwlHeavySpecial)return dealt;
        let w=null;try{w=curW()}catch(_){ }
        if(!w||w.type!=='hammer'||globalThis.CWM_WEAPON_VISUAL?.family?.(w)!=='heavy')return dealt;
        const base=String(w.heavyBaseId||globalThis.CWM_HEAVY_ART?.subtype?.(w)||'');
        if(base)impact(e,w,base,dealt);
        return dealt;
      };
      wrapped.__cwlHeavyImpact=true;wrapped.__cwlHeavyImpactBase=baseHit;hitE=wrapped;state.installed=true;
      document.documentElement.dataset.cwlHeavyImpact='ready';
      console.info('CWL Heavy impact feedback armed',BUILD);
    }catch(err){state.error=String(err?.message||err);setTimeout(install,180)}
  }
  install();
  globalThis.CWL_HEAVY_IMPACT={build:BUILD,state,reinstall:install};
})();

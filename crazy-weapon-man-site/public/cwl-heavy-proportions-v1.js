(()=>{
  if(globalThis.__CWL_HEAVY_PROPORTIONS_V1)return;
  globalThis.__CWL_HEAVY_PROPORTIONS_V1=true;
  const BUILD='cwl-heavy-proportions-v1-20260915a';
  const WEAPON_SCALE=.68;
  const state={build:BUILD,installed:false,draws:0,lastBase:'',scale:WEAPON_SCALE};
  function install(){
    const vf=globalThis.CWM_WEAPON_VISUAL;
    if(!vf?.draw)return false;
    if(vf.draw.__cwlHeavyProportion){state.installed=true;return true}
    const base=vf.draw.bind(vf);
    const wrapped=function(X,w,opt={}){
      const heavy=(w?.type==='hammer'||w?.heavyBaseId||vf.family?.(w)==='heavy');
      if(!heavy)return base(X,w,opt);
      const next={...opt,scale:Math.max(.18,Number(opt.scale||1)*WEAPON_SCALE)};
      state.draws++;state.lastBase=w?.heavyBaseId||'';
      document.documentElement.dataset.cwlHeavyProportions='ready';
      return base(X,w,next);
    };
    wrapped.__cwlHeavyProportion=true;wrapped.__cwlHeavyProportionBase=base;
    vf.draw=wrapped;state.installed=true;
    document.documentElement.dataset.cwlHeavyProportions='ready';
    console.info('CWL Heavy weapon proportions installed',BUILD,WEAPON_SCALE);
    return true;
  }
  let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>40)clearInterval(timer)},50);install();
  globalThis.CWL_HEAVY_PROPORTIONS={build:BUILD,scale:WEAPON_SCALE,state,reinstall:install};
})();

(()=>{
  if(globalThis.__CWL_ENEMY_VARIATION_V1)return;
  globalThis.__CWL_ENEMY_VARIATION_V1=true;
  const BUILD='cwl-enemy-variation-v1-20260915b';
  const state={build:BUILD,installed:false,draws:0,last:null,error:null};
  const hash=n=>{let x=(Number(n)||1)>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return x>>>0};
  function variant(e){
    const h=hash(e?.id||1),s=.94+(h%14)*.01,wide=.96+((h>>>5)%9)*.01,tilt=((h>>>10)%9-4)*.004;
    return{scale:e?.elite?s*1.025:s,wide,tilt};
  }
  function install(){
    const hook=globalThis.__CWM_RENDER_HOOK;
    if(!hook?.drawEnemy){setTimeout(install,80);return}
    if(hook.drawEnemy.__cwlEnemyVariation){state.installed=true;return}
    const base=hook.drawEnemy;
    function varied(ctx){
      const e=ctx?.e,X=ctx?.X;
      if(!e||e.boss||!X)return base(ctx);
      const v=variant(e),cx=e.x+e.w/2,foot=e.y+e.h;
      X.save();X.translate(cx,foot);X.rotate(v.tilt);X.scale(v.scale*v.wide,v.scale);X.translate(-cx,-foot);
      let handled=false;
      try{handled=base(ctx)}finally{X.restore()}
      if(handled){state.draws++;state.last={id:e.id,type:e.type,scale:Number(v.scale.toFixed(3)),wide:Number(v.wide.toFixed(3))};document.documentElement.dataset.cwlEnemyVariationDraw='pass'}
      return handled;
    }
    varied.__cwlEnemyVariation=true;varied.__cwlEnemyVariationBase=base;
    hook.drawEnemy=varied;state.installed=true;
    document.documentElement.dataset.cwlEnemyVariation='ready';
    console.info('CWL enemy silhouette variation installed',BUILD);
  }
  install();
  const timer=setInterval(()=>{try{install();if(state.installed)document.documentElement.dataset.cwlEnemyVariation='ready'}catch(e){state.error=String(e?.message||e)}},650);
  addEventListener('pagehide',()=>clearInterval(timer),{once:true});
  globalThis.CWL_ENEMY_VARIATION={build:BUILD,state,variant,reinstall:install};
})();

(()=>{
  if(globalThis.__CWM_NIGHTMARE_BALANCE_V18)return;
  globalThis.__CWM_NIGHTMARE_BALANCE_V18=true;
  const density=()=>{try{return globalThis.CWM_HORDE_V16?.density?.()||E.filter(e=>e&&!e.dead&&!e.boss).length}catch(_){return 0}};
  const hurt0=hurt;
  hurt=function(amount,source){
    const n=density(),boss=!!source?.boss,projectileLike=!source?.type&&!source?.boss&&!source?.dmg;
    let m=boss?1.34:(projectileLike?1.42:1.30);
    if(n>=20)m*=1.78;else if(n>=15)m*=1.62;else if(n>=11)m*=1.48;else if(n>=7)m*=1.30;
    m*=1+Math.min(.24,Math.max(0,zoneI||0)*.025);
    return hurt0(Number(amount)*m,source);
  };
  const kill0=killE;
  killE=function(e,...args){
    const before=pl.hp,r=kill0(e,...args),after=pl.hp;
    if(after>before&&e?.dead&&!e?.boss){
      const keep=e.elite?.62:.44;
      pl.hp=Math.min(pl.max,before+(after-before)*keep);
    }
    return r;
  };
  globalThis.CWM_NIGHTMARE_BALANCE_V18={version:'v18-danger-restored',density};
})();

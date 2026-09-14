(()=>{
  if(globalThis.__CWM_DANGER_BALANCE)return;
  globalThis.__CWM_DANGER_BALANCE=true;

  let rush=0,lastKillAt=-99,lastKills=0;
  const baseHurt=hurt;
  const baseKillE=killE;

  const zone=()=>typeof zoneI!=='undefined'?Math.max(0,Number(zoneI)||0):0;
  const wave=()=>typeof stageClears!=='undefined'?Math.max(0,Number(stageClears)||0):0;
  const now=()=>typeof time!=='undefined'?Number(time)||0:performance.now()/1000;

  hurt=function(amount,source){
    if(!Number.isFinite(Number(amount)))return baseHurt(amount,source);
    const before=pl.hp;
    const projectileLike=!source?.type&&!source?.boss&&!source?.dmg;
    const boss=!!source?.boss;
    let mult=projectileLike?1.65:(boss?1.25:1.45);
    mult*=1+Math.min(.40,zone()*.035+wave()*.045);
    if(source?.elite)mult*=1.08;
    if(source?.rareMutator)mult*=1.08;
    if(pl.max>0&&pl.hp/pl.max<.22)mult*=.94;
    const r=baseHurt(Number(amount)*mult,source||{x:pl.x});
    if(pl.hp<before&&!over){
      pl.inv=Math.min(pl.inv,projectileLike?.32:(boss?.42:.38));
      flash=Math.max(flash,.13);
      chroma=Math.max(chroma,.07);
    }
    return r;
  };

  killE=function(e,one=false,sourceMod=null,sourceDam=null){
    const eligible=!!e&&!e.dead&&!e.boss;
    if(!eligible)return baseKillE(e,one,sourceMod,sourceDam);

    if(kills<lastKills){rush=0;lastKillAt=-99}
    const hpBefore=pl.hp;
    const t=now();
    const rapid=t-lastKillAt<=1.35;
    rush=rapid?Math.min(8,rush+1):1;
    lastKillAt=t;

    const oldTxt=txt;
    try{
      txt=function(x,y,s,...rest){
        if(typeof s==='string'&&/^\+\d+ HP$/.test(s))return;
        return oldTxt(x,y,s,...rest);
      };
      baseKillE(e,one,sourceMod,sourceDam);
    }finally{
      txt=oldTxt;
    }

    lastKills=kills;
    if(!e.dead)return;

    const basePct=e.elite?.026:.008;
    const rushPct=Math.min(.024,Math.max(0,rush-1)*.0035)*(e.elite?.72:1);
    let mult=Math.max(.25,Number(pl.healMult)||1);
    try{if(typeof augmentVal==='function')mult*=Math.max(.25,Number(augmentVal('heal',1))||1)}catch(_){ }
    if(pl.max>0&&hpBefore/pl.max<.30)mult*=1.22;
    const intended=Math.max(2,Math.round(pl.max*(basePct+rushPct)*mult));
    pl.hp=Math.min(pl.max,hpBefore+intended);
    const healed=Math.max(0,Math.round(pl.hp-hpBefore));

    if(healed>0){
      const col=rush>=4?'#72ff9e':'#65f59a';
      const label=rush>=3?`RUSH x${rush}  +${healed} HP`:`+${healed} HP`;
      oldTxt(pl.x+pl.w/2,pl.y-31,label,col,rush>=6);
      part(pl.x+pl.w/2,pl.y+pl.h/2,col,Math.min(16,5+rush),100+rush*12,4+rush*.35);
      if(rush>=5)ring(pl.x+pl.w/2,pl.y+pl.h/2,col,38+rush*4,2+Math.floor(rush/3));
    }
  };

  const css=document.createElement('style');
  css.textContent=`
    .cwmDangerPulse{position:absolute;inset:0;z-index:34;pointer-events:none;border:0 solid #ff526b;opacity:0;box-shadow:inset 0 0 0 transparent;transition:opacity .08s}
  `;
  document.head.appendChild(css);

  globalThis.CWM_BALANCE_INFO={
    patch:'v1.2-danger',
    incoming:'melee 1.45x, projectile/hazard 1.65x before progression scaling',
    iframe:'0.38s melee / 0.32s projectile',
    healing:'low single-kill heal, rapidly escalating kill-rush heal'
  };
})();

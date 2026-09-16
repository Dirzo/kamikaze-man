(()=>{
  if(globalThis.__CWM_FEEDBACK_CLARITY_V17)return;
  globalThis.__CWM_FEEDBACK_CLARITY_V17=true;

  const density=()=>globalThis.CWM_HORDE_V16?.density?.()||E.filter(e=>e&&!e.dead&&!e.boss).length;
  const normalize=s=>String(s??'').trim();
  function isLegacyNoise(s){
    const label=normalize(s);
    if(/^\+\d[\d,]*\s+XP\b/i.test(label))return true;
    if(/^\+\d+\s+SLAUGHTER$/i.test(label))return true;
    if(/^\d+\s*[x×]\s*(?:CHAIN REACTION|QUICK KILL|KILL CHAIN)$/i.test(label))return true;
    if(/^LEVEL UP!$/i.test(label))return true;
    if(/^LV\s*\d+\s*[•·-]\s*MAX HP\s*\+/i.test(label))return true;
    if(/^\d+\s+HOSTILES\s*\/\/\s*HORDE PRESSURE$/i.test(label))return true;
    if(/^(CRAZY WEAPON MAN IS BORED|TIME FOR A BAD IDEA|WEAPON DROUGHT ENDED)$/i.test(label))return true;
    try{if(typeof COMBO_PRAISE!=='undefined'&&COMBO_PRAISE.some(x=>normalize(x?.[1])===label))return true}catch(_){ }
    try{if(typeof styleGrade==='function'&&label===normalize(styleGrade()))return true}catch(_){ }
    return false;
  }
  function shouldDemoteBig(label){
    return /(?:FALLING|TACTICAL|CHAOS DIRECTOR|FLOOR|AUDIT|OUTBREAK|FESTIVAL|EMERGENCY|PRESSURE|TEAM BUILDING|SLOWLY TURNING|MUNICIPAL SIGNAGE|MANDATORY|EXPLOSIVE PERSONALITY)/i.test(label);
  }

  const txt0=txt;
  txt=function(x,y,s,col='#fff',big=false){
    const label=normalize(s);
    if(isLegacyNoise(label))return;
    if(document.body?.classList.contains('cwmLevelMoment')&&big)return;
    return txt0(x,y,label,col,big&&!shouldDemoteBig(label));
  };

  const style=document.createElement('style');style.textContent=`
    #cwmLevelSplash{top:28%!important;z-index:98!important}
    body.cwmLevelMoment #cwmKillChain{opacity:0!important;transform:translateX(-50%) scale(.92)!important}
  `;document.head.appendChild(style);

  const check0=checkLevel;
  checkLevel=function(){
    const before=pl.lv,r=check0();
    if(pl.lv>before){
      levelUpT=0;
      document.body.classList.add('cwmLevelMoment');
      if(U.fsUpgrade)U.fsUpgrade.classList.remove('show');
      setTimeout(()=>{document.body.classList.remove('cwmLevelMoment');if(hudUpgradeT>0&&U.fsUpgrade)U.fsUpgrade.classList.add('show')},950);
    }
    return r;
  };

  const draw0=draw;
  draw=function(){
    if(Array.isArray(T)&&T.length){
      const levelMoment=document.body?.classList.contains('cwmLevelMoment');
      T=T.filter(t=>!isLegacyNoise(t?.s)&&(!levelMoment||t?.kind==='damage'));
    }
    const compact=D.length>=3||density()>=8;
    const names=[];
    if(compact){
      for(const d of D){
        const item=d?.item;if(!item||typeof item.name!=='string')continue;
        names.push([item,item.name]);
        if(item.kind==='armor')item.name=`${item.rar||'RARE'} BODY ARMOR`;
        else{
          const element=item.element?.name||item.element?.family||'';
          const type=WM[item.type]?.label||item.type||'WEAPON';
          item.name=`${item.rar||''}${element?` • ${String(element).toUpperCase()}`:''} • ${String(type).toUpperCase()}`.replace(/^\s*•\s*/, '');
        }
      }
    }
    try{return draw0()}finally{for(const [item,name] of names)item.name=name}
  };

  globalThis.CWM_FEEDBACK_CLARITY_V17={version:'v17-single-channel-feedback-d',ok:true,isLegacyNoise};
})();

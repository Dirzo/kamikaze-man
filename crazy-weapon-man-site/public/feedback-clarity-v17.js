(()=>{
  if(globalThis.__CWM_FEEDBACK_CLARITY_V17)return;
  globalThis.__CWM_FEEDBACK_CLARITY_V17=true;

  const txt0=txt;
  txt=function(x,y,s,col='#fff',big=false){
    const label=String(s??'').trim();
    // These rewards now each have one dedicated visual channel instead of several overlapping canvas messages.
    if(/^\+\d[\d,]*\s+XP\b/i.test(label))return;
    if(/^\+\d+\s+SLAUGHTER$/i.test(label))return;
    if(/^\d+\s*[x×]\s*(?:CHAIN REACTION|QUICK KILL|KILL CHAIN)$/i.test(label))return;
    if(/^LEVEL UP!$/i.test(label))return;
    if(/^LV\s*\d+\s*[•·-]\s*MAX HP\s*\+/i.test(label))return;
    try{if(big&&typeof styleGrade==='function'&&label===String(styleGrade()).trim())return}catch(_){ }
    return txt0(x,y,label,col,big);
  };

  const style=document.createElement('style');style.textContent=`
    #cwmLevelSplash{top:28%!important;z-index:98!important}
    body.cwmLevelMoment #cwmKillChain{opacity:0!important;transform:translateX(-50%) scale(.92)!important}
  `;document.head.appendChild(style);

  const check0=checkLevel;
  checkLevel=function(){
    const before=pl.lv,r=check0();
    if(pl.lv>before){
      document.body.classList.add('cwmLevelMoment');
      if(U.fsUpgrade)U.fsUpgrade.classList.remove('show');
      setTimeout(()=>{document.body.classList.remove('cwmLevelMoment');if(hudUpgradeT>0&&U.fsUpgrade)U.fsUpgrade.classList.add('show')},950);
    }
    return r;
  };

  globalThis.CWM_FEEDBACK_CLARITY_V17={version:'v17-single-channel-feedback',ok:true};
})();

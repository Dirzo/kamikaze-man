(()=>{
  if(globalThis.__CWM_HORDE_CLARITY_V16)return;
  globalThis.__CWM_HORDE_CLARITY_V16=true;
  if(typeof creature!=='function'||typeof X==='undefined')return;
  const creature0=creature;
  creature=function(e){
    const n=globalThis.CWM_HORDE_V16?.density?.()||0;
    if(n<10||e?.elite||e?.boss)return creature0(e);
    const fill0=X.fillText,stroke0=X.strokeText;
    try{
      X.fillText=function(){};
      X.strokeText=function(){};
      return creature0(e);
    }finally{
      X.fillText=fill0;X.strokeText=stroke0;
    }
  };
  globalThis.CWM_HORDE_CLARITY_V16={version:'v16-horde-declutter',threshold:10};
})();
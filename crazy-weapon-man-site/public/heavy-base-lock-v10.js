(()=>{
  if(globalThis.__CWM_HEAVY_BASE_LOCK_V10)return;
  globalThis.__CWM_HEAVY_BASE_LOCK_V10=true;
  const BUILD='v10-heavy-base-lock-20260915a';
  const VALID=new Set(['industrial_maul','siege_hammer','pile_driver','welded_cleaver','junk_cannon','scrap_mortar','rotary_reclaimer','landfill_lobber','pressure_propeller','siege_toaster']);
  const META={
    junk_cannon:{subtype:'junk_cannon',label:'JUNK CANNON',kind:'artillery',muzzle:[92,0],anchor:[0,0],length:104,height:34},
    scrap_mortar:{subtype:'scrap_mortar',label:'SCRAP MORTAR',kind:'artillery',muzzle:[72,-28],anchor:[0,0],length:84,height:42},
    rotary_reclaimer:{subtype:'rotary_reclaimer',label:'ROTARY RECLAIMER',kind:'artillery',muzzle:[96,0],anchor:[0,0],length:108,height:34},
    landfill_lobber:{subtype:'landfill_lobber',label:'LANDFILL LOBBER',kind:'artillery',muzzle:[94,-4],anchor:[0,0],length:106,height:42},
    pressure_propeller:{subtype:'pressure_propeller',label:'PRESSURE PROPELLER',kind:'artillery',muzzle:[90,0],anchor:[0,0],length:102,height:38},
    siege_toaster:{subtype:'siege_toaster',label:'SIEGE TOASTER',kind:'artillery',muzzle:[76,-2],anchor:[0,0],length:88,height:46},
    siege_hammer:{subtype:'siege_hammer',label:'SIEGE HAMMER',kind:'melee',muzzle:null,anchor:[0,0],length:84,height:52},
    industrial_maul:{subtype:'industrial_maul',label:'INDUSTRIAL MAUL',kind:'melee',muzzle:null,anchor:[0,0],length:92,height:56},
    pile_driver:{subtype:'pile_driver',label:'PILE DRIVER',kind:'melee',muzzle:null,anchor:[0,0],length:90,height:58},
    welded_cleaver:{subtype:'welded_cleaver',label:'WELDED CLEAVER',kind:'melee',muzzle:null,anchor:[0,0],length:98,height:48}
  };
  function install(){
    const HA=globalThis.CWM_HEAVY_ART,VF=globalThis.CWM_WEAPON_VISUAL;
    if(!HA?.subtype||!HA?.meta||!VF?.draw){setTimeout(install,40);return}
    if(HA.__baseLockV10)return;
    const infer=HA.subtype.bind(HA),baseDraw=VF.draw.bind(VF);
    function lockedSubtype(w){return VALID.has(w?.heavyBaseId)?w.heavyBaseId:infer(w)}
    function tunedWeapon(w){
      if(!VALID.has(w?.heavyBaseId))return w;
      if(infer(w)===w.heavyBaseId)return w;
      let name=String(w.name||'Heavy Weapon');
      for(let i=0;i<16;i++){
        const candidate={...w,name:name+' '+'.'.repeat(i+1)};
        if(infer(candidate)===w.heavyBaseId)return candidate;
      }
      return w;
    }
    HA.subtype=lockedSubtype;
    HA.meta=w=>VALID.has(w?.heavyBaseId)?{...META[w.heavyBaseId]}:{...META[infer(w)]};
    HA.isArtillery=w=>HA.meta(w).kind==='artillery';
    HA.isMelee=w=>HA.meta(w).kind==='melee';
    HA.__baseLockV10=true;
    if(VF.heavySubtype)VF.heavySubtype=lockedSubtype;
    if(VF.heavyMeta)VF.heavyMeta=HA.meta;
    VF.draw=(X,w,opt={})=>{
      if(VF.family?.(w)==='heavy'&&VALID.has(w?.heavyBaseId))return baseDraw(X,tunedWeapon(w),opt);
      return baseDraw(X,w,opt);
    };
    globalThis.CWM_HEAVY_BASE_LOCK={build:BUILD,valid:[...VALID],meta:META};
    console.info('CWM v10 heavy base lock installed',globalThis.CWM_HEAVY_BASE_LOCK);
  }
  install();
})();

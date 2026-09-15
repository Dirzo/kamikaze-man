(()=>{
  if(globalThis.__CWL_HEAVY_SPECIALS_V1)return;
  globalThis.__CWL_HEAVY_SPECIALS_V1=true;
  const BUILD='cwl-heavy-specials-v1-20260915a';
  const DEF={
    industrial_maul:{name:'FAULTLINE DROP',short:'FAULTLINE'},
    siege_hammer:{name:'BREACH PROTOCOL',short:'BREACH PROTOCOL'},
    pile_driver:{name:'MAXIMUM PRESSURE',short:'MAX PRESSURE'},
    welded_cleaver:{name:'SCRAP GUILLOTINE',short:'GUILLOTINE'},
    junk_cannon:{name:'JUNKYARD SALVO',short:'JUNK SALVO'},
    scrap_mortar:{name:'COMPLIANCE BARRAGE',short:'BARRAGE'},
    rotary_reclaimer:{name:'REDLINE RECLAIMER',short:'REDLINE'},
    landfill_lobber:{name:'GARBAGE DAY',short:'GARBAGE DAY'},
    pressure_propeller:{name:'PRESSURE PURGE',short:'PURGE'},
    siege_toaster:{name:'MANDATORY BREAK',short:'MANDATORY BREAK'}
  };
  const state={build:BUILD,installed:false,casts:0,lastBase:'',lastSpecial:'',lastCastAt:0};
  const alive=e=>!!e&&!e.dead&&Number(e.hp??1)>0;
  const center=e=>({x:(e?.x||0)+(e?.w||0)/2,y:(e?.y||0)+(e?.h||0)/2});
  const currentWeapon=()=>{try{return curW()}catch(_){return null}};
  const baseId=w=>String(w?.heavyBaseId||globalThis.CWM_HEAVY_ART?.subtype?.(w)||'');
  const current=()=>DEF[baseId(currentWeapon())]||null;
  const q=()=>{try{return Math.max(0,Number(rarityRank(currentWeapon()))||0)}catch(_){return 0}};
  const ao=()=>{try{return Math.max(.75,Math.min(2.2,Number(weaponAoe(currentWeapon()))||1))}catch(_){return 1}};
  const baseDamage=()=>{try{return Math.max(1,Number(wdmg())||1)}catch(_){return 1}};
  function nearPlayer(range=250,count=99,front=false){
    try{
      const px=pl.x+pl.w/2,py=pl.y+pl.h/2,dir=pl.dir||1;
      return E.filter(alive).filter(e=>{const c=center(e),dx=c.x-px,dy=c.y-py;if(Math.hypot(dx,dy)>range)return false;return !front||dx*dir>=-18})
        .sort((a,b)=>Math.hypot(center(a).x-px,center(a).y-py)-Math.hypot(center(b).x-px,center(b).y-py)).slice(0,count);
    }catch(_){return []}
  }
  function around(x,y,range=120,count=99){
    try{return E.filter(alive).filter(e=>Math.hypot(center(e).x-x,center(e).y-y)<=range)
      .sort((a,b)=>Math.hypot(center(a).x-x,center(a).y-y)-Math.hypot(center(b).x-x,center(b).y-y)).slice(0,count)}catch(_){return []}
  }
  function hit(e,damage,col,opt={}){
    if(!alive(e)||!(damage>0))return 0;
    try{return hitE(e,damage,{col,stun:opt.stun||0,knock:opt.knock||0,sourceType:'hammer',sourceMod:'cwl-heavy-special',sourceDam:damage,__elementTick:true,__cwlHeavySpecial:true})}catch(_){return 0}
  }
  function visualLabel(def,col){
    try{
      txt(pl.x+pl.w/2,pl.y-58,def.name,col,true);ring(pl.x+pl.w/2,pl.y+pl.h/2,col,74,5);part(pl.x+pl.w/2,pl.y+pl.h/2,col,13,170,6);
      pl.atMax=Math.max(Number(pl.atMax)||0,.44);pl.at=Math.max(Number(pl.at)||0,.44);shake=Math.max(shake,5);
    }catch(_){ }
  }
  function cast(w){
    const base=baseId(w),def=DEF[base];if(!def)return false;
    const col=w?.element?.col||w?.col||'#fff176',dam=baseDamage(),rank=q(),scale=1+Math.min(.35,rank*.014),area=ao(),dir=pl?.dir||1;
    state.casts++;state.lastBase=base;state.lastSpecial=def.name;state.lastCastAt=Date.now();visualLabel(def,col);

    if(base==='industrial_maul'){
      [0,105,210].forEach((delay,i)=>setTimeout(()=>{
        const r=(115+i*55)*area;try{ring(pl.x+pl.w/2,G-6,col,r,4+i)}catch(_){ }
        for(const e of nearPlayer(r,8))hit(e,dam*.18*scale,col,{stun:.10+i*.035,knock:Math.sign(center(e).x-(pl.x+pl.w/2))*120});
      },delay));
    }else if(base==='siege_hammer'){
      const targets=nearPlayer(330*area,4,true);targets.forEach((e,i)=>{hit(e,dam*(i? .36:.72)*scale,col,{stun:i? .14:.28,knock:dir*(i?280:520)});try{const c=center(e);beam(pl.x+pl.w/2,pl.y+18,c.x,c.y,col,6-i)}catch(_){ }});
    }else if(base==='pile_driver'){
      const target=nearPlayer(310*area,1,true)[0]||nearPlayer(220*area,1,false)[0];if(target){
        for(let i=0;i<4;i++)setTimeout(()=>{if(!alive(target))return;const c=center(target);hit(target,dam*(i===3?.38:.19)*scale,col,{stun:i===3?.28:.07,knock:i===3?dir*360:dir*65});try{ring(c.x,c.y,col,26+i*9,2+i);if(i===3){part(c.x,c.y,col,15,210,7);shake=Math.max(shake,7)}}catch(_){ }},i*85);
      }
    }else if(base==='welded_cleaver'){
      const targets=nearPlayer(250*area,6,true);for(const e of targets){const remaining=Number(e.hp)||0,mult=remaining<=dam*1.5?.72:.34;hit(e,dam*mult*scale,col,{stun:.13,knock:dir*260})}
      try{ring(pl.x+dir*75,G-8,col,150*area,7)}catch(_){ }
    }else if(base==='junk_cannon'){
      const targets=nearPlayer(520,6,false);targets.forEach((e,i)=>setTimeout(()=>{if(!alive(e))return;const c=center(e);try{boom(c.x,c.y,col,74*area,.65);beam(pl.x+pl.w/2,pl.y+12,c.x,c.y,col,3)}catch(_){ }hit(e,dam*.29*scale,col,{stun:.07,knock:Math.sign(c.x-pl.x)*135})},i*70));
    }else if(base==='scrap_mortar'){
      const targets=nearPlayer(620,4,false);targets.forEach((e,i)=>{const c=center(e),delay=220+i*125;try{ring(c.x,c.y,col,58*area,2)}catch(_){ }setTimeout(()=>{try{boom(c.x,c.y,col,96*area,.9)}catch(_){ }for(const q of around(c.x,c.y,105*area,5))hit(q,dam*.34*scale,col,{stun:.12,knock:Math.sign(center(q).x-c.x)*160})},delay)});
    }else if(base==='rotary_reclaimer'){
      for(let i=0;i<9;i++)setTimeout(()=>{const target=nearPlayer(360,1,true)[0]||nearPlayer(260,1,false)[0];if(!target)return;const c=center(target);hit(target,dam*(.085+i*.006)*scale,col,{stun:.025,knock:dir*35});try{beam(pl.x+pl.w/2,pl.y+18,c.x,c.y,col,2.5+i*.15);if(i===8)ring(c.x,c.y,col,74,5)}catch(_){ }},i*52);
    }else if(base==='landfill_lobber'){
      const targets=nearPlayer(650,7,false);targets.forEach((e,i)=>setTimeout(()=>{if(!alive(e))return;const c=center(e),x=c.x+(i%2?-28:28),y=c.y;try{boom(x,y,col,84*area,.72);part(x,y,col,8,150,5)}catch(_){ }for(const q of around(x,y,92*area,4))hit(q,dam*.24*scale,col,{stun:.06,knock:Math.sign(center(q).x-x)*120})},i*75));
    }else if(base==='pressure_propeller'){
      pl.inv=Math.max(Number(pl.inv)||0,.32);const px=pl.x+pl.w/2;for(const e of nearPlayer(255*area,10,false)){const c=center(e),push=Math.sign(c.x-px)||dir;hit(e,dam*.31*scale,col,{stun:.16,knock:push*620})}
      try{ring(px,pl.y+pl.h/2,col,235*area,9)}catch(_){ }
    }else if(base==='siege_toaster'){
      const targets=nearPlayer(215*area,12,false);for(let wave=0;wave<3;wave++)setTimeout(()=>{try{ring(pl.x+pl.w/2,pl.y+pl.h/2,'#ffb65c',(90+wave*62)*area,4+wave)}catch(_){ }for(const e of targets)if(alive(e)&&Math.hypot(center(e).x-(pl.x+pl.w/2),center(e).y-(pl.y+pl.h/2))<=(120+wave*55)*area)hit(e,dam*.19*scale,'#ffb65c',{stun:.06,knock:Math.sign(center(e).x-pl.x)*95})},wave*105);
    }
    return true;
  }
  function install(){
    try{
      if(typeof skill!=='function'){setTimeout(install,100);return}
      if(skill.__cwlHeavySpecials){state.installed=true;return}
      const baseSkill=skill;
      const wrapped=function(...args){
        let w=null,beforeMana=0,beforeScd=0;
        try{w=currentWeapon();beforeMana=Number(pl.mana)||0;beforeScd=Number(pl.scd)||0}catch(_){ }
        const out=baseSkill(...args);
        try{
          const fired=!!w&&baseId(w)&&beforeScd<=0&&(Number(pl.scd)||0)>beforeScd&&(Number(pl.mana)||0)<beforeMana;
          if(fired)setTimeout(()=>cast(w),0);
        }catch(e){console.warn('CWL Heavy special post-cast hook failed',e)}
        return out;
      };
      wrapped.__cwlHeavySpecials=true;skill=wrapped;state.installed=true;
      console.info('Crazy Weapon Lady Heavy active specials armed',BUILD);
    }catch(e){console.warn('CWL Heavy special install failed',e);setTimeout(install,250)}
  }
  globalThis.CWL_HEAVY_SPECIALS={build:BUILD,state,current,definitions:DEF,cast,install};
  install();
})();

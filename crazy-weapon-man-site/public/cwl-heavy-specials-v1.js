(()=>{
  if(globalThis.__CWL_HEAVY_SPECIALS_V1)return;
  globalThis.__CWL_HEAVY_SPECIALS_V1=true;
  const BUILD='cwl-heavy-specials-v1-20260915b';
  const DEF={industrial_maul:{name:'FAULTLINE DROP',short:'FAULTLINE'},siege_hammer:{name:'BREACH PROTOCOL',short:'BREACH PROTOCOL'},pile_driver:{name:'MAXIMUM PRESSURE',short:'MAX PRESSURE'},welded_cleaver:{name:'SCRAP GUILLOTINE',short:'GUILLOTINE'},junk_cannon:{name:'JUNKYARD SALVO',short:'JUNK SALVO'},scrap_mortar:{name:'COMPLIANCE BARRAGE',short:'BARRAGE'},rotary_reclaimer:{name:'REDLINE RECLAIMER',short:'REDLINE'},landfill_lobber:{name:'GARBAGE DAY',short:'GARBAGE DAY'},pressure_propeller:{name:'PRESSURE PURGE',short:'PURGE'},siege_toaster:{name:'MANDATORY BREAK',short:'MANDATORY BREAK'}};
  const state={build:BUILD,installed:false,casts:0,lastBase:'',lastSpecial:'',lastCastAt:0,error:null};
  const api=()=>globalThis.CWL_NATIVE_COMBAT;
  const native=()=>{try{return api()?.state?.()||null}catch(_){return null}};
  const alive=e=>!!e&&!e.dead&&Number(e.hp??1)>0;
  const center=e=>({x:(e?.x||0)+(e?.w||0)/2,y:(e?.y||0)+(e?.h||0)/2});
  const baseId=w=>String(w?.heavyBaseId||globalThis.CWM_HEAVY_ART?.subtype?.(w)||'');
  const current=()=>DEF[baseId(native()?.weapon)]||null;
  const rank=w=>Math.max(0,Number(api()?.rank?.(w))||0);
  const area=w=>Math.max(.75,Math.min(2.2,Number(api()?.ao?.(w))||1));
  const damage=()=>Math.max(1,Number(api()?.damage?.())||1);
  function nearPlayer(range=250,count=99,front=false){
    const s=native(),pl=s?.pl,E=s?.E||[];if(!pl)return[];const px=pl.x+pl.w/2,py=pl.y+pl.h/2,dir=pl.dir||1;
    return E.filter(alive).filter(e=>{const c=center(e),dx=c.x-px,dy=c.y-py;if(Math.hypot(dx,dy)>range)return false;return !front||dx*dir>=-18}).sort((a,b)=>Math.hypot(center(a).x-px,center(a).y-py)-Math.hypot(center(b).x-px,center(b).y-py)).slice(0,count);
  }
  function around(x,y,range=120,count=99){return(native()?.E||[]).filter(alive).filter(e=>Math.hypot(center(e).x-x,center(e).y-y)<=range).sort((a,b)=>Math.hypot(center(a).x-x,center(a).y-y)-Math.hypot(center(b).x-x,center(b).y-y)).slice(0,count)}
  function hit(e,amount,col,opt={}){const a=api();if(!a?.hit||!alive(e)||!(amount>0))return 0;return a.hit(e,amount,{col,stun:opt.stun||0,knock:opt.knock||0,sourceType:'hammer',sourceMod:'cwl-heavy-special',sourceDam:amount,__elementTick:true,__cwlHeavySpecial:true})}
  function visualLabel(def,col){const a=api(),s=native(),pl=s?.pl,f=a?.fx;if(!pl||!f)return;f.txt(pl.x+pl.w/2,pl.y-58,def.name,col,true);f.ring(pl.x+pl.w/2,pl.y+pl.h/2,col,74,5);f.part(pl.x+pl.w/2,pl.y+pl.h/2,col,13,170,6);f.attackPose(.44);f.shake(5)}
  function cast(w){
    const a=api(),s=native(),pl=s?.pl,f=a?.fx,base=baseId(w),def=DEF[base];if(!a||!pl||!f||!def)return false;
    const col=w?.element?.col||w?.col||'#fff176',dam=damage(),q=rank(w),scale=1+Math.min(.35,q*.014),ao=area(w),dir=pl.dir||1,G=s.G;
    state.casts++;state.lastBase=base;state.lastSpecial=def.name;state.lastCastAt=Date.now();visualLabel(def,col);
    if(base==='industrial_maul'){
      [0,105,210].forEach((delay,i)=>setTimeout(()=>{const ns=native(),np=ns?.pl;if(!np)return;const r=(115+i*55)*ao;f.ring(np.x+np.w/2,ns.G-6,col,r,4+i);for(const e of nearPlayer(r,8))hit(e,dam*.18*scale,col,{stun:.10+i*.035,knock:Math.sign(center(e).x-(np.x+np.w/2))*120})},delay));
    }else if(base==='siege_hammer'){
      nearPlayer(330*ao,4,true).forEach((e,i)=>{hit(e,dam*(i?.36:.72)*scale,col,{stun:i?.14:.28,knock:dir*(i?280:520)});const c=center(e);f.beam(pl.x+pl.w/2,pl.y+18,c.x,c.y,col,6-i)});
    }else if(base==='pile_driver'){
      const target=nearPlayer(310*ao,1,true)[0]||nearPlayer(220*ao,1,false)[0];if(target)for(let i=0;i<4;i++)setTimeout(()=>{if(!alive(target))return;const c=center(target);hit(target,dam*(i===3?.38:.19)*scale,col,{stun:i===3?.28:.07,knock:i===3?dir*360:dir*65});f.ring(c.x,c.y,col,26+i*9,2+i);if(i===3){f.part(c.x,c.y,col,15,210,7);f.shake(7)}},i*85);
    }else if(base==='welded_cleaver'){
      for(const e of nearPlayer(250*ao,6,true)){const mult=(Number(e.hp)||0)<=dam*1.5?.72:.34;hit(e,dam*mult*scale,col,{stun:.13,knock:dir*260})}f.ring(pl.x+dir*75,G-8,col,150*ao,7);
    }else if(base==='junk_cannon'){
      nearPlayer(520,6,false).forEach((e,i)=>setTimeout(()=>{if(!alive(e))return;const c=center(e);f.boom(c.x,c.y,col,74*ao,.65);f.beam(pl.x+pl.w/2,pl.y+12,c.x,c.y,col,3);hit(e,dam*.29*scale,col,{stun:.07,knock:Math.sign(c.x-pl.x)*135})},i*70));
    }else if(base==='scrap_mortar'){
      nearPlayer(620,4,false).forEach((e,i)=>{const c=center(e),delay=220+i*125;f.ring(c.x,c.y,col,58*ao,2);setTimeout(()=>{f.boom(c.x,c.y,col,96*ao,.9);for(const q of around(c.x,c.y,105*ao,5))hit(q,dam*.34*scale,col,{stun:.12,knock:Math.sign(center(q).x-c.x)*160})},delay)});
    }else if(base==='rotary_reclaimer'){
      for(let i=0;i<9;i++)setTimeout(()=>{const np=native()?.pl,target=nearPlayer(360,1,true)[0]||nearPlayer(260,1,false)[0];if(!np||!target)return;const c=center(target);hit(target,dam*(.085+i*.006)*scale,col,{stun:.025,knock:(np.dir||1)*35});f.beam(np.x+np.w/2,np.y+18,c.x,c.y,col,2.5+i*.15);if(i===8)f.ring(c.x,c.y,col,74,5)},i*52);
    }else if(base==='landfill_lobber'){
      nearPlayer(650,7,false).forEach((e,i)=>setTimeout(()=>{if(!alive(e))return;const c=center(e),x=c.x+(i%2?-28:28),y=c.y;f.boom(x,y,col,84*ao,.72);f.part(x,y,col,8,150,5);for(const q of around(x,y,92*ao,4))hit(q,dam*.24*scale,col,{stun:.06,knock:Math.sign(center(q).x-x)*120})},i*75));
    }else if(base==='pressure_propeller'){
      a.fx.inv(.32);const px=pl.x+pl.w/2;for(const e of nearPlayer(255*ao,10,false)){const c=center(e),push=Math.sign(c.x-px)||dir;hit(e,dam*.31*scale,col,{stun:.16,knock:push*620})}f.ring(px,pl.y+pl.h/2,col,235*ao,9);
    }else if(base==='siege_toaster'){
      const targets=nearPlayer(215*ao,12,false);for(let wave=0;wave<3;wave++)setTimeout(()=>{const ns=native(),np=ns?.pl;if(!np)return;f.ring(np.x+np.w/2,np.y+np.h/2,'#ffb65c',(90+wave*62)*ao,4+wave);for(const e of targets)if(alive(e)&&Math.hypot(center(e).x-(np.x+np.w/2),center(e).y-(np.y+np.h/2))<=(120+wave*55)*ao)hit(e,dam*.19*scale,'#ffb65c',{stun:.06,knock:Math.sign(center(e).x-np.x)*95})},wave*105);
    }
    document.documentElement.dataset.cwlHeavySpecialDraw='pass';return true;
  }
  function install(){const a=api();if(!a?.on||!a?.state){setTimeout(install,100);return}if(state.installed)return;a.on('skill',ev=>{const w=ev?.weapon;if(w&&baseId(w))setTimeout(()=>cast(w),0)});state.installed=true;document.documentElement.dataset.cwlHeavySpecials='ready';console.info('Crazy Weapon Lady Heavy active specials armed',BUILD)}
  globalThis.CWL_HEAVY_SPECIALS={build:BUILD,state,current,definitions:DEF,cast,install};install();
})();

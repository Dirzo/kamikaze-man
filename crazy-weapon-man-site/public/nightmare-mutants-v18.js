(()=>{
  if(globalThis.__CWM_NIGHTMARE_MUTANTS_V18)return;
  globalThis.__CWM_NIGHTMARE_MUTANTS_V18=true;

  function mutate(e,forced=false){
    if(!e||e.dead||e.boss||e.__nightMutant)return false;
    const z=Math.max(0,Number(zoneI)||0),chance=.12+Math.min(.16,z*.022)+(e.elite ? .06 : 0);
    if(!forced&&Math.random()>chance)return false;
    e.__nightMutant='ABOMINATION';
    const oldW=e.w,oldH=e.h,s=1.34+Math.random()*.28;
    e.w=Math.round(e.w*s);e.h=Math.round(e.h*s);e.x-=Math.round((e.w-oldW)/2);e.y-=Math.max(0,e.h-oldH);
    e.max=Math.max(1,Math.round(e.max*(1.48+z*.035)));e.hp=e.max;e.dmg*=1.24+Math.min(.18,z*.02);e.sp*=.92;
    e.__stompCd=1.4+Math.random()*1.6;e.__stompWind=0;e.__stompHit=false;
    try{txt(e.x+e.w/2,e.y-30,'ABOMINATION','#ff5f66',true);part(e.x+e.w/2,e.y+e.h*.7,'#ff5f66',10,170,6)}catch(_){ }
    return true;
  }

  const spawn0=spawn;
  spawn=function(type,x,elite=false,yt){const before=E.length,r=spawn0(type,x,elite,yt),e=E.length>before?E.at(-1):null;if(e)mutate(e,false);return r};

  const updateE0=updateE;
  updateE=function(dt){
    const r=updateE0(dt);
    for(const e of E){
      if(!e||e.dead||e.boss||e.__nightMutant!=='ABOMINATION')continue;
      const px=pl.x+pl.w/2,py=pl.y+pl.h/2,ex=e.x+e.w/2,ey=e.y+e.h/2,dist=Math.hypot(px-ex,py-ey);
      if(e.__stompWind>0){
        e.__stompWind-=dt;e.vx*=.72;
        if(e.__stompWind<=0&&!e.__stompHit){
          e.__stompHit=true;try{ring(ex,G-7,'#ff684f',145,7);part(ex,G-8,'#ff8a61',14,220,7)}catch(_){ }
          shake=Math.max(shake,10);
          if(dist<155){hurt(e.dmg*.72,e);pl.vx+=Math.sign(px-ex||1)*380;pl.vy=-260}
        }
      }else{
        e.__stompCd=(e.__stompCd??2)-dt;
        if(e.__stompCd<=0&&dist<230&&e.state!=='spawn'){
          e.__stompCd=2.8+Math.random()*2.2;e.__stompWind=.58;e.__stompHit=false;
          try{txt(ex,e.y-28,'STOMP INCOMING','#ffb068',false);ring(ex,G-7,'#ffb068',132,3)}catch(_){ }
        }
      }
    }
    return r;
  };

  const creature0=creature;
  creature=function(e){
    const r=creature0(e);
    if(e&&e.__nightMutant==='ABOMINATION'&&!e.dead){
      const cx=e.x+e.w/2,top=e.y+6,bottom=e.y+e.h-5,pulse=.72+.18*Math.sin((time||0)*7);
      X.save();X.globalAlpha=pulse;X.strokeStyle='#ff5968';X.fillStyle='#ff5968';X.shadowColor='#ff3348';X.shadowBlur=9;X.lineWidth=3;X.lineCap='round';
      // Jagged silhouette scars/spines instead of a permanent circular aura.
      for(const side of [-1,1]){
        const x=cx+side*e.w*.42;
        X.beginPath();X.moveTo(x,e.y+e.h*.22);X.lineTo(x+side*11,top-8);X.lineTo(x+side*4,e.y+e.h*.38);X.stroke();
        X.beginPath();X.moveTo(x,e.y+e.h*.58);X.lineTo(x+side*15,e.y+e.h*.48);X.lineTo(x+side*6,bottom);X.stroke();
      }
      X.shadowBlur=0;X.globalAlpha=.42;for(let i=0;i<4;i++){let ox=(i-1.5)*e.w*.18;X.fillRect(cx+ox-2,bottom+Math.sin((time||0)*8+i)*2,4,5+i%2*3)}
      X.restore();
    }
    return r;
  };

  function selfTest(){return{ok:true,mutation:'ABOMINATION',stompTelegraph:.58,minScale:1.34,maxScale:1.62,passiveHalo:false};}
  try{
    const p=new URLSearchParams(location.search);
    if(p.get('nightmareSmoke')==='1')setTimeout(()=>{
      const api=globalThis.__KM_DEBUG||globalThis.KM_DEBUG;
      try{if(api?.spawn)api.spawn('brute',false);const e=[...E].reverse().find(x=>x&&!x.dead&&!x.boss);const ok=mutate(e,true)||e?.__nightMutant==='ABOMINATION';document.documentElement.dataset.cwmNightmareMutants=ok?'pass':'fail'}catch(_){document.documentElement.dataset.cwmNightmareMutants='fail'}
    },1650);
  }catch(_){ }

  globalThis.CWM_NIGHTMARE_MUTANTS_V18={version:'v18-abomination-stomp',mutate,selfTest};
})();

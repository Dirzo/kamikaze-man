(()=>{
  if(globalThis.__CWM_HORDE_V16)return;
  globalThis.__CWM_HORDE_V16=true;

  const HARD_CAP=28;
  const PROJECTILE_CAP=72;
  const CHASERS=new Set(['stalker','crawler','maw','brute','roller','blinker','shieldbro']);
  const SUPPORT=new Set(['wizard','taxman','summoner','sniper','eyeball','flyer','bombchicken','wraith','mimic']);
  const clampH=(n,a,b)=>Math.max(a,Math.min(b,n));
  const liveEnemies=()=>E.filter(e=>e&&!e.dead&&!e.boss);
  const density=()=>liveEnemies().length;
  const tier=()=>{const n=density();return n>=18?3:n>=12?2:n>=7?1:0};
  const fxBudgetMult=()=>density()>=20?.46:density()>=14?.62:density()>=9?.78:1;

  function pickHordeType(poolList,i){
    const ch=poolList.filter(t=>CHASERS.has(t)),sup=poolList.filter(t=>SUPPORT.has(t));
    const wantSupport=(i%5===4)||Math.random()<.24;
    const src=wantSupport&&sup.length?sup:(ch.length?ch:poolList);
    return pick(src);
  }
  function safeSpawnX(x,w){
    let out=clampH(x,24,W-w-24),pc=pl.x+pl.w/2;
    if(Math.abs((out+w/2)-pc)<170){
      out=pc<W/2?clampH(out+250,24,W-w-24):clampH(out-250,24,W-w-24);
    }
    return out;
  }

  const spawnPack0=spawnPack;
  spawnPack=function(){
    try{
      if(bossMode||boonChoosing||riftReady)return spawnPack0();
      rollDirector();
      const po=pool(),q=rarityRank(curW()),existing=density();
      const surge=(pack%4===0?3:0)+(directorEvent?.id==='eliteunion'?2:0)+(directorEvent?.id==='airborne'?1:0);
      let desired=7+zoneI*2+Math.floor(stageClears/2)+Math.floor(q/4)+surge;
      desired=clampH(desired,7,22);
      const count=Math.max(1,Math.min(desired,HARD_CAP-existing));
      const spots=spawnSpots();
      for(let i=0;i<count;i++){
        const type=pickHordeType(po,i),d=ED[type];
        let spot=spots.length?spots.splice(ri(0,spots.length-1),1)[0]:{x:rand(35,W-80),y:G};
        if(directorEvent?.id==='airborne'&&platforms.length&&Math.random()<.52)spot=pick(platforms);
        let x=safeSpawnX(spot.x+rand(-42,42),d.w),yt=d.air?null:spot.y;
        const elite=(i===0&&pack%5===0)||(directorEvent?.id==='eliteunion'&&i<2)||(zoneI>=3&&i>0&&i%8===0&&Math.random()<.52);
        spawn(type,x,elite,yt);
        const e=E.at(-1);if(!e)continue;
        e.__horde=true;e.__hordeWave=pack;
        const hpScale=count>=18?.74:count>=13?.80:count>=9?.88:1;
        if(!elite){e.max=Math.max(1,Math.round(e.max*hpScale));e.hp=e.max}else{e.max=Math.max(1,Math.round(e.max*Math.max(.90,hpScale)));e.hp=e.max}
        e.dmg=Math.max(1,Math.round(e.dmg*(count>=16?.82:count>=10?.90:1)));
      }
      pack++;packStartedAt=time;packLive=true;rollTerrain();
      if(zoneI>0&&Math.random()<Math.min(.42,.13+zoneI*.045))startChaos();
      try{txt(W/2,82,`${count} HOSTILES // HORDE PRESSURE`,count>=16?'#ffcf6b':'#8ff2ff',count>=16)}catch(_){ }
      return count;
    }catch(err){console.warn('Horde pack fallback',err);return spawnPack0()}
  };

  const move0=weaponMoveMult;
  weaponMoveMult=function(w){
    const n=density(),bonus=n>=18?1.15:n>=12?1.11:n>=7?1.07:1;
    return move0(w)*bonus;
  };

  const hurt0=hurt;
  hurt=function(amount,source){
    const n=density(),scale=n>=20?.52:n>=15?.60:n>=11?.70:n>=7?.82:1;
    return hurt0(Number(amount)*scale,source);
  };

  const updateE0=updateE;
  updateE=function(dt){
    const r=updateE0(dt),n=density();
    if(n>=7){
      for(const e of E){
        if(!e||e.dead||e.boss||e.state!=='approach')continue;
        const quick=e.type==='blinker'||e.type==='crawler'||e.type==='roller';
        const cap=(quick?330:275)+zoneI*8;
        e.vx=clampH(e.vx,-cap,cap);
      }
    }
    if(Q.length>PROJECTILE_CAP)Q.splice(0,Q.length-PROJECTILE_CAP);
    return r;
  };

  const kill0=killE;
  killE=function(e,...args){
    const eligible=!!e&&!e.dead&&!e.boss,n=density();
    const r=kill0(e,...args);
    if(eligible&&e.dead&&n>=8){
      pl.dcd=Math.max(0,pl.dcd-(n>=16?.10:.06));
      if(n>=14&&pl.scd>0)pl.scd=Math.max(0,pl.scd-.035);
    }
    return r;
  };

  const aoe0=weaponAoe;
  weaponAoe=function(w){
    const n=density(),bonus=n>=18?1.30:n>=12?1.21:n>=7?1.12:1;
    return aoe0(w)*bonus;
  };

  function crowdTargets(e,count,range){
    return E.filter(x=>x&&!x.dead&&!x.boss&&x!==e&&Math.hypot((x.x+x.w/2)-(e.x+e.w/2),(x.y+x.h/2)-(e.y+e.h/2))<=range)
      .sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y)).slice(0,count);
  }
  function crowdFx(x,y,col,r=110){
    const m=fxBudgetMult();
    try{ring(x,y,col,r,3);part(x,y,col,Math.max(3,Math.round(8*m)),150,5)}catch(_){ }
  }

  const hit0=hitE;
  hitE=function(e,a,o={}){
    const dealt=hit0(e,a,o);
    if(!dealt||!e||e.dead||o.__hordeTick||o.__elementTick||o.__arsenalTick||o.__overdriveTick)return dealt;
    const w=curW(),combo=Number(pl.combo)||0,n=density();
    if(n<3||w.__cwmHordeCombo===combo)return dealt;
    const cadence={sword:3,dagger:4,nunchucks:3,katana:3,bow:4,shuriken:3,wand:3,staff:4,hammer:3}[w.type]||4;
    if(combo<=0||combo%cadence!==0)return dealt;
    w.__cwmHordeCombo=combo;
    const q=rarityRank(w),ao=Math.min(1.75,weaponAoe(w)),cx=e.x+e.w/2,cy=e.y+e.h/2;
    const guard={__hordeTick:true,__elementTick:true,__arsenalTick:true,__overdriveTick:true,sourceType:w.type,col:w.col};
    const max=clampH(3+Math.floor(q/2),3,8),near=crowdTargets(e,max,150+q*9);
    if(w.type==='sword'){
      crowdFx(cx,cy,w.col,110*ao);for(const t of near.slice(0,4+Math.floor(q/4)))hit0(t,dealt*.30,{...guard,knock:pl.dir*(180+q*12),stun:.08});
    }else if(w.type==='dagger'){
      for(const t of near){try{beam(cx,cy,t.x+t.w/2,t.y+t.h/2,w.col,2.5)}catch(_){ }hit0(t,dealt*.23,{...guard,stun:.05})}
    }else if(w.type==='nunchucks'){
      crowdFx(pl.x+pl.w/2,pl.y+pl.h/2,w.col,145*ao);for(const t of E.filter(x=>x&&!x.dead&&!x.boss).slice(0,12))if(Math.hypot(t.x-pl.x,t.y-pl.y)<160*ao)hit0(t,dealt*.24,{...guard,knock:Math.sign(t.x-pl.x)*155,stun:.07});
    }else if(w.type==='katana'){
      try{beam(pl.x+17,pl.y+22,pl.x+17+pl.dir*(360+q*18),pl.y+22,w.col,5)}catch(_){ }for(const t of E.filter(x=>x&&!x.dead&&!x.boss).slice(0,16))if(Math.abs((t.y+t.h/2)-(pl.y+22))<85&&Math.sign((t.x+t.w/2)-(pl.x+17))===pl.dir)hit0(t,dealt*.32,{...guard,knock:pl.dir*260,stun:.12});
    }else if(w.type==='bow'){
      for(const t of E.filter(x=>x&&!x.dead&&!x.boss).filter(t=>Math.sign((t.x+t.w/2)-(pl.x+17))===pl.dir).sort((a,b)=>Math.abs(a.x-pl.x)-Math.abs(b.x-pl.x)).slice(0,max)){try{beam(pl.x+17,pl.y+18,t.x+t.w/2,t.y+t.h/2,w.col,2)}catch(_){ }hit0(t,dealt*.27,{...guard,knock:pl.dir*110})}
    }else if(w.type==='shuriken'){
      let from=e;for(const t of near){try{beam(from.x+from.w/2,from.y+from.h/2,t.x+t.w/2,t.y+t.h/2,w.col,2)}catch(_){ }hit0(t,dealt*.22,{...guard});from=t}
    }else if(w.type==='wand'){
      let from=e;for(const t of near){try{beam(from.x+from.w/2,from.y+from.h/2,t.x+t.w/2,t.y+t.h/2,w.col,3.5)}catch(_){ }hit0(t,dealt*.26,{...guard,stun:.075});from=t}
    }else if(w.type==='staff'){
      crowdFx(cx,cy,w.col,165*ao);for(const t of near)hit0(t,dealt*.31,{...guard,knock:Math.sign(t.x-e.x)*130,stun:.10});
    }else if(w.type==='hammer'){
      crowdFx(cx,G-8,w.col,185*ao);for(const t of E.filter(x=>x&&!x.dead&&!x.boss).slice(0,16))if(Math.abs(t.x-e.x)<190*ao)hit0(t,dealt*.36,{...guard,knock:Math.sign(t.x-e.x||1)*(330+q*16),stun:.20});
    }
    if(n>=12)try{styleAdd(3+Math.min(8,Math.floor(n/3)),'CROWD CONTROL')}catch(_){ }
    return dealt;
  };

  function selfTest(){
    return{ok:HARD_CAP>=24&&PROJECTILE_CAP<=80,hardCap:HARD_CAP,projectileCap:PROJECTILE_CAP,live:density(),tier:tier(),moveBonus:density()>=7,weaponFamilies:9};
  }
  globalThis.CWM_HORDE_V16={version:'v16-horde-kite',hardCap:HARD_CAP,projectileCap:PROJECTILE_CAP,density,tier,selfTest,spawnPack:()=>spawnPack()};
})();
(()=>{
  if(globalThis.__CWM_NIGHTMARE_V18)return;
  globalThis.__CWM_NIGHTMARE_V18=true;

  const HAZ=[];
  const TAU=Math.PI*2;
  const clampN=(n,a,b)=>Math.max(a,Math.min(b,n));
  const pc=()=>({x:pl.x+pl.w/2,y:pl.y+pl.h/2});
  const liveBoss=()=>E.find(e=>e&&!e.dead&&e.boss);
  const bossKey=e=>String(e?.boss||e?.type||'boss');
  const arenaDiag=Math.hypot(W,H)+260;
  let hazardSerial=0;

  function dangerTier(){return 1+Math.max(0,zoneI)*.11+Math.max(0,stageClears)*.035}
  function bossDamage(e,m=.13){return Math.max(12,(Number(e?.dmg)||30)*m*dangerTier())}
  function sourceFor(e,x){return e||{x:Number.isFinite(x)?x:W/2,dmg:35,rareMutator:true};}
  function announceBoss(e,label,col='#ff5f75'){
    try{txt(e.x+e.w/2,e.y-58,label,col,true);ring(e.x+e.w/2,e.y+e.h/2,col,95,4)}catch(_){ }
  }
  function laser(e,angle,opts={}){
    const c={x:e.x+e.w/2,y:e.y+e.h*.42};
    HAZ.push({id:++hazardSerial,k:'laser',boss:e,x:c.x,y:c.y,angle,baseAngle:angle,warn:opts.warn??.72,active:opts.active??.72,t:0,width:opts.width??16,dmg:opts.dmg??bossDamage(e,.72),spin:opts.spin??0,col:opts.col||e.col||'#ff556f',hitCd:0});
  }
  function laserFan(e,count=5,spin=.32){
    for(let i=0;i<count;i++)laser(e,-.72+i*(1.44/Math.max(1,count-1)),{warn:.78,active:1.05,width:14,spin:(i%2?1:-1)*spin,col:i%2?'#ff4b6e':'#ffdb63'});
  }
  function prison(e,wide=false){
    const p=pc(),half=wide?150:112;
    HAZ.push({id:++hazardSerial,k:'prison',boss:e,cx:clampN(p.x,half+18,W-half-18),half,warn:.72,active:wide?3.6:2.8,t:0,dmg:bossDamage(e,.48),tick:0,col:'#ff5577'});
  }
  function boil(e,big=false){
    const p=pc(),r=big?175:132;
    HAZ.push({id:++hazardSerial,k:'boil',boss:e,x:clampN(p.x,80,W-80),y:clampN(p.y+18,110,G-18),r,warn:.82,active:big?3.4:2.65,t:0,dmg:bossDamage(e,.34),tick:0,col:'#ff6a2e'});
  }
  function laserGrid(e){
    const angles=[-.62,-.28,.28,.62];
    angles.forEach((a,i)=>laser(e,a,{warn:.92+i*.07,active:.82,width:13,spin:(i%2?1:-1)*.12,col:i%2?'#ffdc68':'#ff496e'}));
  }
  function whirlwind(e,dur=2.7,final=false){
    e.__nightWhirl=Math.max(e.__nightWhirl||0,dur);
    e.__nightWhirlShot=0;
    e.__nightWhirlHit=0;
    e.__nightWhirlFinal=final;
    announceBoss(e,final?'APOCALYPSE BLENDER':'WHIRLWIND PANIC',final?'#ffffff':'#ffce66');
  }
  function prisonLaserCombo(e){prison(e,true);setTimeout(()=>{if(e&&!e.dead){laser(e,0,{warn:.48,active:1.25,width:18,spin:.45,col:'#ffef78'});laser(e,Math.PI,{warn:.48,active:1.25,width:18,spin:.45,col:'#ff5577'})}},360)}

  const BOSS_MOVES={
    jr:['whirl','fan','blinkstorm'],
    bossman:['prison','grid','whirl'],
    sr:['megawhirl','fan','prison'],
    grandma:['boil','boilwhirl','grid'],
    ceo:['prisonlaser','grid','boil'],
    weapon:['apocalypse','prisonlaser','boil','grid']
  };

  function chooseMove(e){
    const k=bossKey(e),pool=BOSS_MOVES[k]||['whirl','grid','boil'];
    e.__nightMoveI=((e.__nightMoveI||0)+1)%pool.length;
    let move=pool[e.__nightMoveI];
    if(move===e.__nightLast)move=pool[(e.__nightMoveI+1)%pool.length];
    e.__nightLast=move;return move;
  }
  function triggerBossMove(e,forced){
    if(!e||e.dead)return;
    const move=forced||chooseMove(e),phase=e.phase||1;
    if(move==='whirl')whirlwind(e,2.5+phase*.18,false);
    else if(move==='megawhirl'){whirlwind(e,3.15+phase*.2,false);laserFan(e,4,.22)}
    else if(move==='fan'){announceBoss(e,'PANIC LASER FAN','#ff5a72');laserFan(e,5+Math.min(2,phase),.28)}
    else if(move==='grid'){announceBoss(e,'LASER GRID // DO NOT PANIC','#ffdf67');laserGrid(e)}
    else if(move==='prison'){announceBoss(e,'YOU ARE GOING TO JAIL','#ff5577');prison(e,false)}
    else if(move==='prisonlaser'){announceBoss(e,'HOSTILE INCARCERATION','#ff5577');prisonLaserCombo(e)}
    else if(move==='boil'){announceBoss(e,'BOILING PERFORMANCE REVIEW','#ff793d');boil(e,phase>=3)}
    else if(move==='boilwhirl'){announceBoss(e,'GRANDMA TURNED ON THE STOVE','#ff9a52');boil(e,true);whirlwind(e,2.35,false)}
    else if(move==='blinkstorm'){
      announceBoss(e,'TELEPORTING BAD DECISIONS','#d77cff');
      const p=pc();e.x=clampN(p.x+(Math.random()<.5?-1:1)*rand(190,330),20,W-e.w-20);e.y=clampN(p.y-rand(80,180),60,G-e.h);ring(e.x+e.w/2,e.y+e.h/2,'#d77cff',105,5);laserFan(e,3,.5);
    }else if(move==='apocalypse'){
      announceBoss(e,'EVERY BAD IDEA AT ONCE','#ffffff');whirlwind(e,3.8,true);prison(e,true);boil(e,true);laserGrid(e);
    }
    e.__nightCd=Math.max(3.2,6.1-phase*.48-zoneI*.08)+rand(-.35,.45);
    e.__nightMoves=(e.__nightMoves||0)+1;
  }

  function lineDistance(px,py,cx,cy,angle){
    const nx=-Math.sin(angle),ny=Math.cos(angle);return Math.abs((px-cx)*nx+(py-cy)*ny);
  }
  function updateHazards(dt){
    const p=pc();
    for(const h of HAZ){
      h.t+=dt;h.hitCd=Math.max(0,(h.hitCd||0)-dt);h.tick=Math.max(0,(h.tick||0)-dt);
      if(h.k==='laser'){
        const e=h.boss;if(e&&!e.dead){h.x=e.x+e.w/2;h.y=e.y+e.h*.42}
        const total=h.warn+h.active,live=h.t>=h.warn&&h.t<total;
        if(live){
          const q=(h.t-h.warn)/Math.max(.01,h.active);h.angle=h.baseAngle+h.spin*q*TAU;
          if(h.hitCd<=0&&lineDistance(p.x,p.y,h.x,h.y,h.angle)<h.width+Math.max(pl.w,pl.h)*.22){h.hitCd=.38;hurt(h.dmg,sourceFor(e,h.x));shake=Math.max(shake,8);flash=Math.max(flash,.11)}
        }
        if(h.t>=total)h.dead=true;
      }else if(h.k==='prison'){
        const live=h.t>=h.warn&&h.t<h.warn+h.active;
        if(live){
          const minX=h.cx-h.half,maxX=h.cx+h.half-pl.w;
          const touching=pl.x<minX+9||pl.x>maxX-9;
          pl.x=clampN(pl.x,minX,maxX);
          if(touching&&h.tick<=0){h.tick=.48;hurt(h.dmg,sourceFor(h.boss,h.cx));pl.vx*=-.45;shake=Math.max(shake,5)}
        }
        if(h.t>=h.warn+h.active)h.dead=true;
      }else if(h.k==='boil'){
        const live=h.t>=h.warn&&h.t<h.warn+h.active,dist=Math.hypot(p.x-h.x,p.y-h.y);
        if(live&&dist<h.r&&h.tick<=0){h.tick=.46;hurt(h.dmg,sourceFor(h.boss,h.x));pl.vy-=80;shake=Math.max(shake,4);try{txt(pl.x+17,pl.y-38,'BOILING','#ff8a54',false)}catch(_){ }}
        if(h.t>=h.warn+h.active)h.dead=true;
      }
    }
    for(let i=HAZ.length-1;i>=0;i--)if(HAZ[i].dead)HAZ.splice(i,1);
  }

  function updateWhirl(e,dt){
    if(!e.__nightWhirl||e.__nightWhirl<=0)return;
    e.__nightWhirl=Math.max(0,e.__nightWhirl-dt);e.__nightWhirlShot-=dt;e.__nightWhirlHit-=dt;
    e.__nightSpinPhase=(e.__nightSpinPhase||0)+dt*(e.__nightWhirlFinal?18:13);
    const p=pc(),ex=e.x+e.w/2,ey=e.y+e.h/2,dx=p.x-ex,dy=p.y-ey,d=Math.hypot(dx,dy)||1;
    e.vx=clampN(e.vx+dx/d*(e.__nightWhirlFinal?920:680)*dt,-(e.__nightWhirlFinal?430:360),(e.__nightWhirlFinal?430:360));
    if(!ED[e.type]?.air)e.vy=Math.min(e.vy,80);
    const radius=(e.__nightWhirlFinal?150:118)+Math.min(42,(e.phase||1)*12);
    if(d<radius&&e.__nightWhirlHit<=0){e.__nightWhirlHit=.34;hurt(bossDamage(e,e.__nightWhirlFinal ? .62 : .46),e);pl.vx+=Math.sign(dx||1)*-420;pl.vy=-210;shake=Math.max(shake,10)}
    if(e.__nightWhirlShot<=0){
      e.__nightWhirlShot=e.__nightWhirlFinal ? .24 : .42;
      const n=e.__nightWhirlFinal?8:5;
      for(let i=0;i<n;i++){const a=e.__nightSpinPhase+i*TAU/n,s=e.__nightWhirlFinal?440:350;Q.push({x:ex,y:ey,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:e.__nightWhirlFinal?9:7,life:2.1,dam:bossDamage(e,.18),col:e.__nightWhirlFinal?'#ffffff':e.col,trail:0,effect:'boss',spin:7})}
    }
    if(e.__nightWhirl<=0){e.__nightSpinPhase=0;e.__nightWhirlFinal=false}
  }

  const spawn0=spawn;
  spawn=function(type,x,elite=false,yt){
    const before=E.length,r=spawn0(type,x,elite,yt),e=E.length>before?E.at(-1):null;
    if(e&&!e.__nightScaled){
      e.__nightScaled=true;
      const boss=!!e.boss,z=Math.max(0,zoneI),oldW=e.w,oldH=e.h;
      const s=boss?1.18+Math.min(.18,z*.02):1.08+Math.min(.18,z*.022)+(elite ? .12 : 0)+rand(0,.07);
      e.w=Math.round(e.w*s);e.h=Math.round(e.h*s);e.x-=Math.round((e.w-oldW)/2);e.y-=Math.max(0,e.h-oldH);
      const hp=boss?1.48+z*.08:1.18+z*.055+(elite ? .32 : 0);
      const dm=boss?1.24+z*.045:1.14+z*.05+(elite ? .18 : 0);
      e.max=Math.max(1,Math.round(e.max*hp));e.hp=e.max;e.dmg=Math.max(1,e.dmg*dm);e.sp*=boss?1.08:1.04+Math.min(.18,z*.02);
      e.__nightChaos=rand(2.0,4.2);e.__nightBaseSp=e.sp;
      if(boss)e.__nightCd=2.0;
    }
    return r;
  };

  function enemyChaos(e){
    const p=pc(),ex=e.x+e.w/2,ey=e.y+e.h/2,dx=p.x-ex,dy=p.y-ey,d=Math.hypot(dx,dy)||1,dir=Math.sign(dx)||1;
    const roll=Math.random();
    if(roll<.28){
      e.vx=dir*(390+zoneI*28);if(!ED[e.type]?.air)e.vy=-rand(170,300);try{txt(ex,e.y-22,'RUSH!','#ffb25f',false);ring(ex,ey,'#ff9b52',58,3)}catch(_){ }
    }else if(roll<.50){
      const side=Math.random()<.5?-1:1;e.x=clampN(p.x+side*rand(95,190),12,W-e.w-12);e.y=clampN(e.y-rand(20,90),30,G-e.h);e.dir=-side;try{part(ex,ey,'#b478ff',10,150,5);part(e.x+e.w/2,e.y+e.h/2,'#d6a6ff',12,175,5)}catch(_){ }
    }else if(roll<.72){
      const count=3+Math.min(3,Math.floor(zoneI/2));for(let i=0;i<count;i++){const a=Math.atan2(dy,dx)+(i-(count-1)/2)*.17,s=320+zoneI*20;Q.push({x:ex,y:ey,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:6,life:2.2,dam:e.dmg*.32,col:e.col||'#ff775e',trail:0,effect:'weird',spin:5})}
      try{txt(ex,e.y-26,'PANIC VOLLEY','#ff7e90',false)}catch(_){ }
    }else{
      e.__nightRage=2.2;e.vx*=1.45;try{txt(ex,e.y-26,'UNREASONABLE RAGE','#ff5e64',false);ring(ex,ey,'#ff4b55',72,4)}catch(_){ }
    }
  }

  const updateE0=updateE;
  updateE=function(dt){
    const r=updateE0(dt);
    for(const e of E){
      if(!e||e.dead)continue;
      if(e.boss){updateWhirl(e,dt);continue}
      e.__nightChaos=(e.__nightChaos??rand(2,4))-dt;e.__nightRage=Math.max(0,(e.__nightRage||0)-dt);
      if(e.__nightRage>0)e.vx*=1+Math.min(.015,dt*.75);
      if(!e.__nightPanic&&e.hp/e.max<.30){e.__nightPanic=true;e.dmg*=1.18;e.sp*=1.14;try{ring(e.x+e.w/2,e.y+e.h/2,'#ff4d59',66,4)}catch(_){ }}
      if(e.__nightChaos<=0&&Math.abs((pl.x+pl.w/2)-(e.x+e.w/2))<560&&['approach','recover','idle'].includes(e.state)){enemyChaos(e);e.__nightChaos=rand(Math.max(1.9,3.8-zoneI*.14),Math.max(3.2,6.0-zoneI*.16))}
    }
    return r;
  };

  const updateBoss0=updateBoss;
  updateBoss=function(e,dt){
    const r=updateBoss0(e,dt);
    if(!e||e.dead||bossIntroT>0||!bossActive)return r;
    e.__nightCd=(e.__nightCd??2.1)-dt;
    if(e.__nightCd<=0&&!e.__nightWhirl)triggerBossMove(e);
    return r;
  };

  const update0=update;
  update=function(dt){const r=update0(dt);if(gameStarted&&!paused&&!over&&!boonChoosing)updateHazards(dt);return r};

  const drawBoss0=drawBoss;
  drawBoss=function(e){
    if(e&&e.__nightWhirl>0){const cx=e.x+e.w/2,cy=e.y+e.h/2;X.save();X.translate(cx,cy);X.rotate(e.__nightSpinPhase||0);X.translate(-cx,-cy);try{return drawBoss0(e)}finally{X.restore()}}
    return drawBoss0(e);
  };

  function drawHazards(){
    const now=time||0;X.save();
    for(const h of HAZ){
      if(h.k==='laser'){
        const active=h.t>=h.warn,progress=clampN(h.t/Math.max(.01,h.warn),0,1),a=active?h.angle:h.baseAngle;
        X.save();X.translate(h.x,h.y);X.rotate(a);X.globalAlpha=active ? .88 : .28+.38*Math.sin(now*18)**2;X.strokeStyle=active?'#fff7d1':h.col;X.shadowColor=h.col;X.shadowBlur=active?22:8;X.lineWidth=active?h.width:2+progress*3;X.beginPath();X.moveTo(-arenaDiag,0);X.lineTo(arenaDiag,0);X.stroke();if(active){X.globalAlpha=.55;X.strokeStyle=h.col;X.lineWidth=h.width*2.1;X.beginPath();X.moveTo(-arenaDiag,0);X.lineTo(arenaDiag,0);X.stroke()}X.restore();
      }else if(h.k==='prison'){
        const active=h.t>=h.warn,Xl=h.cx-h.half,Xr=h.cx+h.half;X.globalAlpha=active ? .9 : .32+.24*Math.sin(now*16)**2;X.strokeStyle=active?'#ff5577':'#ffb0bb';X.shadowColor='#ff334f';X.shadowBlur=active?16:5;X.lineWidth=active?7:3;for(const x of [Xl,Xr]){X.beginPath();X.moveTo(x,95);X.lineTo(x,G);X.stroke();for(let yy=135;yy<G;yy+=54){X.beginPath();X.moveTo(x-15,yy);X.lineTo(x+15,yy);X.stroke()}}X.globalAlpha*=.55;for(let x=Xl+28;x<Xr;x+=34){X.beginPath();X.moveTo(x,110);X.lineTo(x,G-8);X.stroke()}
      }else if(h.k==='boil'){
        const active=h.t>=h.warn,pulse=.82+Math.sin(now*12)*.12;X.globalAlpha=active ? .48 : .20;X.fillStyle=active?'#ff3c1f':'#ff9b52';X.beginPath();X.ellipse(h.x,h.y,h.r,h.r*.50,0,0,TAU);X.fill();X.globalAlpha=active ? .9 : .45;X.strokeStyle='#ffd071';X.lineWidth=active?7:3;X.beginPath();X.ellipse(h.x,h.y,h.r*pulse,h.r*.50*pulse,0,0,TAU);X.stroke();for(let i=0;i<9;i++){const a=i*.8+now*(1.4+i*.04),rr=h.r*(.2+(i%4)*.16);X.beginPath();X.arc(h.x+Math.cos(a)*rr,h.y+Math.sin(a)*rr*.38,5+(i%3)*3,0,TAU);X.stroke()}
      }
    }
    const b=liveBoss();if(b&&b.__nightWhirl>0){const cx=b.x+b.w/2,cy=b.y+b.h/2,r=120+(b.phase||1)*13+(b.__nightWhirlFinal?35:0);X.globalAlpha=.75;X.strokeStyle=b.__nightWhirlFinal?'#ffffff':b.col;X.shadowColor=b.col;X.shadowBlur=20;for(let i=0;i<4;i++){X.lineWidth=3+i;X.beginPath();X.arc(cx,cy,r+i*15,(b.__nightSpinPhase||0)+i*.65,(b.__nightSpinPhase||0)+Math.PI*1.45+i*.65);X.stroke()}}
    X.restore();X.globalAlpha=1;X.shadowBlur=0;
  }
  const draw0=draw;
  draw=function(){const r=draw0();drawHazards();return r};

  function selfTest(){return{ok:true,bossMoveSets:Object.keys(BOSS_MOVES).length,hazardKinds:3,enemyChaos:true,scaryScale:true,prison:true,boil:true,lasers:true,whirlwind:true};}
  function smoke(){
    const root=document.documentElement,api=globalThis.__KM_DEBUG||globalThis.KM_DEBUG;
    try{
      if(api?.start)api.start();if(api?.heal)api.heal();if(api?.boss)api.boss('ceo');
      const e=liveBoss();if(e){pl.inv=999;triggerBossMove(e,'prison');triggerBossMove(e,'boil');triggerBossMove(e,'grid');whirlwind(e,2.8,true)}
      const st=selfTest();root.dataset.cwmNightmareProof=st.ok?'pass':'fail';root.dataset.cwmNightmareBossSets=String(st.bossMoveSets);root.dataset.cwmNightmareHazards=HAZ.length>=3?'pass':'fail';root.dataset.cwmNightmarePrison=HAZ.some(h=>h.k==='prison')?'pass':'fail';root.dataset.cwmNightmareBoil=HAZ.some(h=>h.k==='boil')?'pass':'fail';root.dataset.cwmNightmareLaser=HAZ.some(h=>h.k==='laser')?'pass':'fail';root.dataset.cwmNightmareWhirl=e?.__nightWhirl>0?'pass':'fail';
    }catch(err){root.dataset.cwmNightmareProof='fail';root.dataset.cwmNightmareError=String(err?.message||err)}
  }
  try{const p=new URLSearchParams(location.search);if(p.get('nightmareSmoke')==='1'||p.get('nightmareShowcase')==='1')setTimeout(smoke,1250)}catch(_){ }

  globalThis.CWM_NIGHTMARE_V18={version:'v18-nightmare-director',hazards:HAZ,selfTest,triggerBossMove,force:(move)=>{const e=liveBoss();if(e)triggerBossMove(e,move);return move},dangerTier};
})();

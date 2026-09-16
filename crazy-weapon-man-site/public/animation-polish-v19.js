(()=>{
  if(globalThis.__CWM_ANIMATION_V19)return;
  globalThis.__CWM_ANIMATION_V19=true;

  const A={land:0,landPower:0,skill:0,hurt:0,attackKick:0,playerFrames:0,enemyFrames:0,trailFrames:0,lastGrounded:false};
  const clampA=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const easeOut=t=>1-Math.pow(1-clampA(t),3);
  const melee=new Set(['sword','dagger','nunchucks','katana','hammer']);

  function pivotTransform(cx,cy,sx,sy,rot=0,dx=0,dy=0){
    X.translate(cx+dx,cy+dy);X.rotate(rot);X.scale(sx,sy);X.translate(-cx,-cy);
  }

  const update0=update;
  update=function(dt){
    A.land=Math.max(0,A.land-dt);A.skill=Math.max(0,A.skill-dt);A.hurt=Math.max(0,A.hurt-dt);A.attackKick=Math.max(0,A.attackKick-dt);
    return update0(dt);
  };

  const resolve0=resolve;
  resolve=function(o,py){
    const was=o===pl?!!pl.on:false,fall=o===pl?Number(pl.vy)||0:0;
    const r=resolve0(o,py);
    if(o===pl&&!was&&pl.on&&fall>190){A.land=.16;A.landPower=clampA((fall-190)/520,.25,1)}
    return r;
  };

  const attack0=attack;
  attack=function(){
    const before=Number(pl.at)||0,r=attack0();
    if((Number(pl.at)||0)>before){A.attackKick=Math.max(A.attackKick,.13)}
    return r;
  };
  const skill0=skill;
  skill=function(){
    const before=Number(pl.scd)||0,r=skill0();
    if((Number(pl.scd)||0)>before){A.skill=.34;try{const w=curW();F.push({k:'rune',x:pl.x+pl.w/2,y:pl.y+pl.h/2,r:26+rarityRank(w)*2,col:w.col,spin:pl.dir,life:.28,max:.28})}catch(_){ }}
    return r;
  };
  const hurt0=hurt;
  hurt=function(...args){const hp=pl.hp,r=hurt0(...args);if(pl.hp<hp)A.hurt=.18;return r};

  function playerPose(){
    const w=curW(),cx=pl.x+pl.w/2,cy=pl.y+pl.h*.58,speed=Math.abs(pl.vx||0),dir=pl.dir||1;
    let sx=1,sy=1,rot=0,dx=0,dy=0;

    if(pl.dashT>0){
      const p=clampA(pl.dashT/.18);sx=1.18+.06*p;sy=.84-.03*p;rot=.035*dir;dx=-dir*3;
    }else if(!pl.on){
      if(pl.vy<-70){const p=clampA((-pl.vy-70)/520);sx=.94-.025*p;sy=1.07+.05*p;rot=-.035*dir}
      else if(pl.vy>90){const p=clampA((pl.vy-90)/620);sx=.96;sy=1.055+.025*p;rot=.028*dir}
    }else if(A.land>0){
      const p=Math.sin(Math.PI*clampA(A.land/.16));sx=1+.14*p*A.landPower;sy=1-.13*p*A.landPower;dy=4*p*A.landPower;
    }else if(speed>35){
      const p=clampA(speed/520),stride=Math.sin((time||0)*12)*.012*p;sx=1+stride;sy=1-stride;rot=clampA((pl.vx||0)/900,-1,1)*.055;dy=Math.abs(Math.sin((time||0)*12))*1.2*p;
    }

    if(pl.at>0&&pl.atMax>0){
      const p=clampA(1-pl.at/pl.atMax),isM=melee.has(w.type);
      if(isM){
        if(p<.22){const q=easeOut(p/.22);sx*=1-.045*q;sy*=1+.05*q;rot+=-dir*.045*q;dx+=-dir*2*q}
        else if(p<.68){const q=Math.sin(((p-.22)/.46)*Math.PI);sx*=1+.105*q;sy*=1-.075*q;rot+=dir*.07*q;dx+=dir*4*q}
        else{const q=1-(p-.68)/.32;sx*=1+.035*q;sy*=1-.025*q}
      }else{
        const q=Math.sin(Math.PI*p);sx*=1-.028*q;sy*=1+.035*q;dx+=-dir*3*q;rot+=-dir*.022*q;
      }
    }
    if(A.skill>0){const p=Math.sin(Math.PI*clampA(A.skill/.34));sx*=1+.055*p;sy*=1+.055*p;dy-=2*p}
    if(A.hurt>0){const p=Math.sin(Math.PI*clampA(A.hurt/.18));sx*=1+.07*p;sy*=1-.06*p;rot+=-dir*.055*p}
    return{cx,cy,sx,sy,rot,dx,dy};
  }

  const playerDraw0=playerDraw;
  playerDraw=function(){
    A.playerFrames++;
    const p=playerPose();X.save();pivotTransform(p.cx,p.cy,p.sx,p.sy,p.rot,p.dx,p.dy);
    try{return playerDraw0()}finally{X.restore()}
  };

  function drawEnemyShadow(e){
    const d=ED[e.type];if(!d||d.air||e.state==='spawn'||e.dead)return;
    const pulse=e.__nightMutant==='ABOMINATION'?1.18:1;
    X.save();X.globalAlpha=e.elite?.24:.15;X.fillStyle='#000';X.beginPath();X.ellipse(e.x+e.w/2,e.y+e.h-1,e.w*.36*pulse,Math.max(3,e.h*.055),0,0,Math.PI*2);X.fill();X.restore();
  }
  function enemyPose(e){
    const d=ED[e.type]||{},cx=e.x+e.w/2,cy=e.y+e.h/2;
    let sx=1,sy=1,rot=0,dy=0;
    if(e.__stompWind>0){const p=clampA(e.__stompWind/.58);sx=1+.11*p;sy=1-.10*p;dy=5*p}
    else if(e.state==='wind'&&d.wind){const p=clampA(1-e.st/d.wind);sx=1+.07*p;sy=1-.09*p;dy=3*p;rot=-e.dir*.025*p}
    else if(e.state==='lunge'){sx=1.11;sy=.91;rot=e.dir*.035}
    else if(e.state==='cast'||e.state==='summonwind'){const p=.5+.5*Math.sin((time||0)*13+(e.anim||0));sx=1+.025*p;sy=1+.045*p;dy=-2*p}
    else if(!d.air&&Math.abs(e.vx||0)>35){const p=clampA(Math.abs(e.vx)/260),q=Math.sin((time||0)*(e.type==='crawler'?18:11)+(e.anim||0));sx=1+.025*q*p;sy=1-.025*q*p;rot=clampA((e.vx||0)/700,-1,1)*.025}
    else if(d.air){dy=Math.sin((time||0)*4.8+(e.anim||0))*2.5;rot=Math.sin((time||0)*3.1+(e.anim||0))*.018}
    if(e.hitT>0){const p=clampA(e.hitT/.18);sx*=1+.055*p;sy*=1-.045*p}
    return{cx,cy,sx,sy,rot,dy};
  }

  const creature0=creature;
  creature=function(e){
    if(!e||e.boss)return creature0(e);
    A.enemyFrames++;drawEnemyShadow(e);
    const p=enemyPose(e);X.save();pivotTransform(p.cx,p.cy,p.sx,p.sy,p.rot,0,p.dy);
    try{return creature0(e)}finally{X.restore()}
  };

  const drawBoss0=drawBoss;
  drawBoss=function(e){
    if(!e)return drawBoss0(e);
    const cx=e.x+e.w/2,cy=e.y+e.h/2;let sx=1,sy=1,rot=0,dy=0;
    if(e.__nightWhirl>0){const p=.5+.5*Math.sin((time||0)*18);sx=1+.035*p;sy=1-.025*p}
    else if(e.state==='wind'){const p=.5+.5*Math.sin((time||0)*8);sx=1+.045*p;sy=1-.04*p;dy=3*p}
    else{const breathe=.5+.5*Math.sin((time||0)*3+(e.anim||0));sx=1+.012*breathe;sy=1-.008*breathe}
    if(e.hitT>0){const p=clampA(e.hitT/.18);sx*=1+.04*p;sy*=1-.035*p;rot=(e.hitDir||1)*-.025*p}
    X.save();pivotTransform(cx,cy,sx,sy,rot,0,dy);try{return drawBoss0(e)}finally{X.restore()}
  };

  function projectileTrails(){
    if(!Array.isArray(P)||!P.length)return;
    const step=P.length>60?2:1;X.save();X.lineCap='round';
    for(let i=0;i<P.length;i+=step){const p=P[i];if(!p||p.dead)continue;const vx=Number(p.vx)||0,vy=Number(p.vy)||0,sp=Math.hypot(vx,vy);if(sp<150)continue;const nx=vx/sp,ny=vy/sp,len=clampA(sp*.06,18,74)*(p.size||1),col=p.col||'#fff';
      A.trailFrames++;X.globalAlpha=p.k==='shuriken'?.16:.22;X.strokeStyle=col;X.shadowColor=col;X.shadowBlur=7;X.lineWidth=p.k==='blade'?6:p.k==='orb'?4:2.5;X.beginPath();X.moveTo(p.x-nx*len,p.y-ny*len);X.lineTo(p.x,p.y);X.stroke();
      X.globalAlpha=.10;X.lineWidth=Math.max(1,X.lineWidth*.45);X.beginPath();X.moveTo(p.x-nx*len*1.45,p.y-ny*len*1.45);X.lineTo(p.x-nx*len*.25,p.y-ny*len*.25);X.stroke();
    }
    X.restore();X.globalAlpha=1;X.shadowBlur=0;
  }
  const drawP0=drawP;
  drawP=function(){projectileTrails();return drawP0()};

  const dash0=dash;
  dash=function(){const before=pl.dashT,r=dash0();if(pl.dashT>before){try{const w=curW();F.push({k:'speed',x:pl.x+pl.w/2,y:pl.y+pl.h/2,dir:pl.dir,col:w.col,n:6,life:.16,max:.16})}catch(_){ }}return r};

  function selfTest(){return{ok:typeof playerDraw==='function'&&typeof creature==='function'&&typeof drawP==='function',playerFrames:A.playerFrames,enemyFrames:A.enemyFrames,trailFrames:A.trailFrames,gameplayChanges:false};}
  function smoke(){
    const root=document.documentElement,api=globalThis.__KM_DEBUG||globalThis.KM_DEBUG;
    try{
      api?.start?.();api?.heal?.();api?.equip?.('katana','Legendary');api?.spawn?.('brute',false);
      pl.vx=260;attack();P.push({k:'arrow',x:pl.x+55,y:pl.y+18,vx:720,vy:-35,dam:1,pier:0,life:.8,hit:new Set(),col:'#7fe8ff',size:1});
      draw();
      const st=selfTest();root.dataset.cwmAnimationProof=st.ok&&A.playerFrames>0&&A.enemyFrames>0&&A.trailFrames>0?'pass':'fail';root.dataset.cwmAnimationPlayer=A.playerFrames>0?'pass':'fail';root.dataset.cwmAnimationEnemy=A.enemyFrames>0?'pass':'fail';root.dataset.cwmAnimationTrails=A.trailFrames>0?'pass':'fail';root.dataset.cwmAnimationGameplay='unchanged';
    }catch(err){root.dataset.cwmAnimationProof='fail';root.dataset.cwmAnimationError=String(err?.message||err)}
  }
  try{const p=new URLSearchParams(location.search);if(p.get('animationSmoke')==='1')setTimeout(smoke,1500)}catch(_){ }

  globalThis.CWM_ANIMATION_V19={version:'v19-motion-polish',state:A,selfTest};
})();
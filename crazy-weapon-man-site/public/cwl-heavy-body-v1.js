(()=>{
  if(globalThis.__CWL_HEAVY_BODY_V1)return;
  globalThis.__CWL_HEAVY_BODY_V1=true;
  const BUILD='cwl-heavy-body-v1-20260915d';
  const SHEET=320,GRID=4,CELL=SHEET/GRID;
  const FRAME_NAMES=['idle_0','idle_1','run_0','run_1','run_2','heavy_ready','jump_0','air_attack_0','attack_a_1','attack_a_2','victory_0','attack_b_0','death_0'];
  const FRAME_INDEX=Object.fromEntries(FRAME_NAMES.map((n,i)=>[n,i]));
  const SOCKETS={
    idle_0:[10,-8],idle_1:[10,-8],run_0:[11,-7],run_1:[10,-8],run_2:[11,-6],
    heavy_ready:[8,-9],jump_0:[10,-7],air_attack_0:[13,-10],attack_a_1:[12,-11],attack_a_2:[14,-7],
    victory_0:[10,-12],attack_b_0:[12,-9],death_0:[6,-4]
  };
  const prev=globalThis.__CWM_RENDER_HOOK||{};
  const state={build:BUILD,ready:false,error:null,image:null,bounds:{},frame:null,transportChunks:0,priority:false,priorityAt:0,source:'loading'};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const fallback=ctx=>typeof prev.drawPlayer==='function'?prev.drawPlayer(ctx):false;
  const attackT=pl=>(pl?.at||0)>0?1-clamp((pl.at||0)/Math.max(.01,pl.atMax||.2),0,1):0;

  function chooseFrame(ctx){
    const p=ctx.pl,t=Number(ctx.time)||performance.now()/1000,a=attackT(p),speed=Math.abs(p.vx||0);
    if((p.hp??1)<=0||p.dead)return'death_0';
    if(!p.on&&a>.05)return'air_attack_0';
    if(!p.on)return'jump_0';
    if(a>.04){
      const artillery=globalThis.CWM_HEAVY_ART?.isArtillery?.(ctx.w);
      if(artillery)return a<.62?'heavy_ready':'attack_b_0';
      return a<.48?'attack_a_1':'attack_a_2';
    }
    if(speed>28)return ['run_0','run_1','run_2'][Math.floor(t*10)%3];
    return Math.floor(t*2.4)%2?'idle_1':'idle_0';
  }

  function scanBounds(img){
    const c=document.createElement('canvas');c.width=SHEET;c.height=SHEET;
    const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,SHEET,SHEET);
    const px=g.getImageData(0,0,SHEET,SHEET).data;
    for(let i=0;i<FRAME_NAMES.length;i++){
      const cx=(i%GRID)*CELL,cy=Math.floor(i/GRID)*CELL;let minX=CELL,minY=CELL,maxX=-1,maxY=-1;
      for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++){
        if(px[((cy+y)*SHEET+(cx+x))*4+3]>10){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}
      }
      state.bounds[FRAME_NAMES[i]]=maxX>=0?{x:cx+minX,y:cy+minY,w:maxX-minX+1,h:maxY-minY+1}:{x:cx,y:cy,w:CELL,h:CELL};
    }
  }

  function line(g,x1,y1,x2,y2,w,color){g.strokeStyle=color;g.lineWidth=w;g.lineCap='round';g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()}
  function poly(g,pts,fill,stroke='#111827',lw=2){g.fillStyle=fill;g.strokeStyle=stroke;g.lineWidth=lw;g.beginPath();g.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)g.lineTo(pts[i][0],pts[i][1]);g.closePath();g.fill();g.stroke()}
  function ellipse(g,x,y,rx,ry,fill,stroke='#111827',lw=2){g.fillStyle=fill;g.strokeStyle=stroke;g.lineWidth=lw;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill();g.stroke()}

  function drawLadyFrame(g,name,ox,oy){
    const P={skin:'#f2c6b8',hair:'#f2f5ff',hairShade:'#a7d8ec',ink:'#111827',jacket:'#1b1b28',shirt:'#ff4da6',shorts:'#323443',boot:'#14151d',cyan:'#62efff',eye:'#27d9ff'};
    const cfg={
      idle_0:{bob:0,body:0,la:-10,ra:10,ll:-3,rl:4},idle_1:{bob:-1,body:0,la:-7,ra:7,ll:-2,rl:3},
      run_0:{bob:-2,body:5,la:22,ra:-22,ll:16,rl:-18},run_1:{bob:-1,body:2,la:-18,ra:20,ll:-18,rl:16},run_2:{bob:-2,body:5,la:18,ra:-18,ll:11,rl:-12},
      heavy_ready:{bob:0,body:6,la:25,ra:33,ll:-4,rl:6},jump_0:{bob:-7,body:0,la:-16,ra:18,ll:13,rl:-12},air_attack_0:{bob:-7,body:8,la:30,ra:38,ll:15,rl:-8},
      attack_a_1:{bob:-1,body:9,la:28,ra:40,ll:-7,rl:8},attack_a_2:{bob:0,body:-5,la:-25,ra:-35,ll:8,rl:-7},victory_0:{bob:-1,body:0,la:-62,ra:8,ll:-3,rl:4},
      attack_b_0:{bob:-1,body:8,la:22,ra:40,ll:-5,rl:7},death_0:{death:true}
    }[name]||{};
    g.save();g.translate(ox+40,oy+70);
    if(cfg.death){g.translate(-3,-3);g.rotate(-1.2);}
    else g.translate(0,cfg.bob||0);

    const hipY=-25,shoulderY=-47,headY=-60;
    const lean=(cfg.body||0)*.12;
    const ang=v=>(v||0)*Math.PI/180;
    const limb=(sx,sy,len,a)=>[sx+Math.sin(a)*len,sy+Math.cos(a)*len];
    const lK=limb(-6,hipY,15,ang(cfg.ll||0)),rK=limb(6,hipY,15,ang(cfg.rl||0));
    const lF=limb(lK[0],lK[1],14,ang((cfg.ll||0)*.65)),rF=limb(rK[0],rK[1],14,ang((cfg.rl||0)*.65));
    line(g,-6,hipY,lK[0],lK[1],7,P.shorts);line(g,lK[0],lK[1],lF[0],lF[1],6,P.boot);
    line(g,6,hipY,rK[0],rK[1],7,P.shorts);line(g,rK[0],rK[1],rF[0],rF[1],6,P.boot);
    line(g,lF[0]-4,lF[1],lF[0]+5,lF[1],5,P.boot);line(g,rF[0]-4,rF[1],rF[0]+5,rF[1],5,P.boot);

    poly(g,[[-12+lean,hipY],[-14+lean,-43],[0+lean,-51],[14+lean,-43],[12+lean,hipY]],P.jacket,P.ink,2);
    poly(g,[[-7+lean,-43],[0+lean,-48],[7+lean,-43],[5+lean,-29],[-5+lean,-29]],P.shirt,P.ink,1.5);
    g.fillStyle=P.cyan;g.fillRect(-10+lean,-28,20,2);

    const lA=ang(cfg.la||0),rA=ang(cfg.ra||0),lE=limb(-11+lean,shoulderY,14,lA),rE=limb(11+lean,shoulderY,14,rA);
    const lH=limb(lE[0],lE[1],13,lA*.8),rH=limb(rE[0],rE[1],13,rA*.8);
    line(g,-11+lean,shoulderY,lE[0],lE[1],6,P.jacket);line(g,lE[0],lE[1],lH[0],lH[1],5,P.skin);
    line(g,11+lean,shoulderY,rE[0],rE[1],6,P.jacket);line(g,rE[0],rE[1],rH[0],rH[1],5,P.skin);
    ellipse(g,lH[0],lH[1],3.2,3.2,P.skin,P.ink,1);ellipse(g,rH[0],rH[1],3.2,3.2,P.skin,P.ink,1);

    ellipse(g,lean,headY,12,13,P.skin,P.ink,2);
    g.fillStyle=P.hair;g.strokeStyle=P.ink;g.lineWidth=2;g.beginPath();g.arc(lean-1,headY-3,13.5,Math.PI,Math.PI*2);g.lineTo(lean+13,headY+4);g.lineTo(lean+8,headY+10);g.lineTo(lean+3,headY+5);g.lineTo(lean-2,headY+12);g.lineTo(lean-7,headY+5);g.lineTo(lean-13,headY+8);g.lineTo(lean-14,headY-3);g.closePath();g.fill();g.stroke();
    g.strokeStyle=P.hairShade;g.lineWidth=2;g.beginPath();g.moveTo(lean-8,headY-10);g.lineTo(lean-2,headY+6);g.moveTo(lean+2,headY-11);g.lineTo(lean+8,headY+4);g.stroke();
    g.fillStyle=P.eye;g.fillRect(lean+3,headY-2,3,2);g.fillStyle='#fff';g.fillRect(lean+4,headY-2,1,1);
    g.fillStyle=P.shirt;g.fillRect(lean+9,headY+3,3,2);
    g.restore();
  }

  function buildProceduralAtlas(reason){
    try{
      const c=document.createElement('canvas');c.width=SHEET;c.height=SHEET;
      const g=c.getContext('2d');g.imageSmoothingEnabled=false;
      FRAME_NAMES.forEach((name,i)=>drawLadyFrame(g,name,(i%GRID)*CELL,Math.floor(i/GRID)*CELL));
      state.image=c;scanBounds(c);state.ready=true;state.error=null;state.source='procedural-atlas';
      console.warn('CWL Heavy compact WebP unavailable; using procedural Lady atlas',reason||'fallback',BUILD);
      return true;
    }catch(e){state.error='Procedural Lady atlas failed: '+String(e?.message||e);state.source='legacy-fallback';console.error(state.error);return false}
  }

  function initImage(){
    try{
      const chunks=globalThis.__CWL_HEAVY_LITE_B64;
      state.transportChunks=Array.isArray(chunks)?chunks.filter(Boolean).length:0;
      if(!Array.isArray(chunks)||chunks.length<3||chunks.some((x,i)=>i<3&&!x))return buildProceduralAtlas(`transport incomplete ${state.transportChunks}/3`);
      const b64=chunks.slice(0,3).join('').replace(/\s/g,'');
      if(!b64.startsWith('UklG'))return buildProceduralAtlas('transport is not WebP data');
      const img=new Image();state.image=img;
      img.onload=()=>{
        try{scanBounds(img);state.ready=true;state.error=null;state.source='embedded-webp';console.info('Crazy Weapon Lady Heavy body ready',BUILD,state)}
        catch(e){buildProceduralAtlas('frame scan failed: '+String(e?.message||e))}
      };
      img.onerror=()=>buildProceduralAtlas('compact WebP decode failed');
      img.src='data:image/webp;base64,'+b64;
    }catch(e){buildProceduralAtlas(String(e?.message||e))}
  }

  function drawContactShadow(X,p,scale){
    X.save();X.globalAlpha=.28;X.fillStyle='#000';X.beginPath();X.ellipse(p.x+p.w/2,p.y+p.h+2,20*scale,5.5*scale,0,0,Math.PI*2);X.fill();X.restore();
  }

  function drawBody(X,img,b,frame,targetH,elementColor,rarityColor){
    const targetW=targetH*(b.w/b.h),dx=-targetW*.5,dy=-targetH;
    X.save();X.shadowColor=elementColor||rarityColor||'#7cf4ff';X.shadowBlur=10;X.globalAlpha=.32;
    X.drawImage(img,b.x,b.y,b.w,b.h,dx-1.3,dy-1.3,targetW+2.6,targetH+2.6);X.restore();
    X.drawImage(img,b.x,b.y,b.w,b.h,dx,dy,targetW,targetH);
    return {targetW,targetH,dx,dy};
  }

  function drawWeapon(ctx,frame,a,bodyH){
    const X=ctx.X,w=ctx.w,VF=globalThis.CWM_WEAPON_VISUAL;
    if(!w||!VF?.draw||VF.family?.(w)!=='heavy')return;
    const artillery=globalThis.CWM_HEAVY_ART?.isArtillery?.(w),socket=SOCKETS[frame]||SOCKETS.idle_0;
    let ang=artillery?-.05:-.64;
    if(frame==='heavy_ready')ang=artillery?-.12:-.95;
    else if(frame==='attack_a_1')ang=-1.72+a*.75;
    else if(frame==='attack_a_2')ang=-.94+a*1.32;
    else if(frame==='air_attack_0')ang=artillery?-.08:-1.18;
    else if(frame==='attack_b_0')ang=artillery?-.02:-.58;
    else if(frame==='victory_0')ang=-1.05;
    else if(frame==='death_0')ang=.35;
    const sc=clamp(bodyH/104,.55,.82);
    X.save();X.translate(socket[0],socket[1]);X.rotate(ang);
    VF.draw(X,w,{scale:sc,time:ctx.time,glow:true,attacking:a>.04,attackT:a});
    X.restore();
  }

  function drawPlayer(ctx){
    if(!state.ready||!state.image||!ctx?.pl)return fallback(ctx);
    try{
      const VF=globalThis.CWM_WEAPON_VISUAL;
      if(!globalThis.CWM_HEAVY_ONLY?.enabled||!ctx.w||VF?.family?.(ctx.w)!=='heavy')return fallback(ctx);
      const {X,pl}=ctx,frame=chooseFrame(ctx),b=state.bounds[frame];
      if(!b)return fallback(ctx);
      const a=attackT(pl),speed=Math.abs(pl.vx||0),run=pl.on?clamp(speed/240,0,1):0;
      const bodyH=clamp((pl.h||58)*1.43,74,92),bob=pl.on?Math.abs(Math.sin((ctx.time||0)*11))*1.5*run:0;
      const d=VF?.describe?.(ctx.w),elementColor=d?.elementVisual?.c||d?.emissive,rarityColor=d?.rarityColor;
      drawContactShadow(X,pl,bodyH/82);
      X.save();X.translate(pl.x+pl.w/2,pl.y+pl.h+bob);X.scale(pl.dir||1,1);
      if(pl.inv>0&&Math.floor((ctx.time||0)*18)%2===0)X.globalAlpha=.52;
      drawBody(X,state.image,b,frame,bodyH,elementColor,rarityColor);
      drawWeapon(ctx,frame,a,bodyH);
      if(a>.12){X.save();X.globalCompositeOperation='screen';X.globalAlpha=.12+.18*Math.sin(a*Math.PI);X.strokeStyle=elementColor||'#fff176';X.lineWidth=2.5;X.beginPath();X.arc(8,-bodyH*.48,28+a*16,-1.7,-1.7+Math.PI*1.25);X.stroke();X.restore()}
      X.restore();
      state.frame=frame;globalThis.__CWM_V2_ENTITY_LAST={kind:'player-cwl-heavy',zone:ctx.zoneI,at:Date.now(),frame,source:state.source};
      return true;
    }catch(e){state.error=String(e?.message||e);console.warn('CWL Heavy player render failed; using legacy player renderer',e);return fallback(ctx)}
  }

  function installPriority(){
    const current=globalThis.__CWM_RENDER_HOOK||{};
    globalThis.__CWM_RENDER_HOOK={...current,__cwlHeavyBodyPriority:true,drawPlayer};
    state.priority=true;state.priorityAt=Date.now();
    return true;
  }

  globalThis.__CWM_RENDER_HOOK={...prev,drawPlayer};
  globalThis.CWL_HEAVY_BODY={build:BUILD,state,frames:[...FRAME_NAMES],frameIndex:FRAME_INDEX,chooseFrame,drawPlayer,installPriority,ready:()=>state.ready};
  initImage();
})();

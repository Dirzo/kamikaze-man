(()=>{
  if(globalThis.__CWL_HEAVY_BODY_V1)return;
  globalThis.__CWL_HEAVY_BODY_V1=true;
  const BUILD='cwl-heavy-body-v1-20260915b';
  const SHEET=320,GRID=4,CELL=SHEET/GRID;
  const FRAME_NAMES=['idle_0','idle_1','run_0','run_1','run_2','heavy_ready','jump_0','air_attack_0','attack_a_1','attack_a_2','victory_0','attack_b_0','death_0'];
  const FRAME_INDEX=Object.fromEntries(FRAME_NAMES.map((n,i)=>[n,i]));
  const SOCKETS={
    idle_0:[10,-8],idle_1:[10,-8],run_0:[11,-7],run_1:[10,-8],run_2:[11,-6],
    heavy_ready:[8,-9],jump_0:[10,-7],air_attack_0:[13,-10],attack_a_1:[12,-11],attack_a_2:[14,-7],
    victory_0:[10,-12],attack_b_0:[12,-9],death_0:[6,-4]
  };
  const prev=globalThis.__CWM_RENDER_HOOK||{};
  const state={build:BUILD,ready:false,error:null,image:null,bounds:{},frame:null,transportChunks:0};
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

  function initImage(){
    try{
      const chunks=globalThis.__CWL_HEAVY_LITE_B64;
      state.transportChunks=Array.isArray(chunks)?chunks.filter(Boolean).length:0;
      if(!Array.isArray(chunks)||chunks.length<3||chunks.some((x,i)=>i<3&&!x))throw new Error(`Heavy body transport incomplete (${state.transportChunks}/3)`);
      const b64=chunks.slice(0,3).join('').replace(/\s/g,'');
      if(!b64.startsWith('UklG'))throw new Error('Heavy body transport is not WebP data');
      const img=new Image();state.image=img;
      img.onload=()=>{
        try{scanBounds(img);state.ready=true;state.error=null;console.info('Crazy Weapon Lady Heavy body ready',BUILD,state)}
        catch(e){state.error=String(e?.message||e);console.warn('CWL Heavy frame scan failed; legacy player renderer retained',e)}
      };
      img.onerror=()=>{state.error='Heavy body WebP decode failed';console.warn('CWL Heavy body decode failed; legacy player renderer retained')};
      img.src='data:image/webp;base64,'+b64;
    }catch(e){state.error=String(e?.message||e);console.warn('CWL Heavy body transport failed; legacy player renderer retained',e)}
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
      state.frame=frame;globalThis.__CWM_V2_ENTITY_LAST={kind:'player-cwl-heavy',zone:ctx.zoneI,at:Date.now(),frame};
      return true;
    }catch(e){state.error=String(e?.message||e);console.warn('CWL Heavy player render failed; using legacy player renderer',e);return fallback(ctx)}
  }

  globalThis.__CWM_RENDER_HOOK={...prev,drawPlayer};
  globalThis.CWL_HEAVY_BODY={build:BUILD,state,frames:[...FRAME_NAMES],frameIndex:FRAME_INDEX,chooseFrame,ready:()=>state.ready};
  initImage();
})();

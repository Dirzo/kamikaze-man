(()=>{
  if(globalThis.__CWM_SPRITE_INTEGRATION_V4)return;
  globalThis.__CWM_SPRITE_INTEGRATION_V4=true;
  const BUILD='v4-silhouette-integration-20260914a';
  const SEWER=1;
  const H={crawler:58,wizard:78,shieldbro:94,blinker:62,bombchicken:70};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  function pathEllipse(X,x,y,rx,ry){X.ellipse(x,y,Math.max(2,rx),Math.max(2,ry),0,0,Math.PI*2)}
  function addEnemyMask(X,e,bh){
    const cx=e.x+e.w/2,bt=e.y+e.h+2,dir=e.dir||1;
    X.beginPath();
    if(e.type==='crawler'){
      pathEllipse(X,cx,bt-bh*.34,bh*.68,bh*.36);
    }else if(e.type==='wizard'){
      pathEllipse(X,cx-dir*bh*.08,bt-bh*.50,bh*.56,bh*.47);
      pathEllipse(X,cx+dir*bh*.43,bt-bh*.47,bh*.38,bh*.29);
      pathEllipse(X,cx-dir*bh*.34,bt-bh*.70,bh*.28,bh*.25);
    }else if(e.type==='shieldbro'){
      pathEllipse(X,cx+dir*bh*.05,bt-bh*.50,bh*.51,bh*.49);
      pathEllipse(X,cx-dir*bh*.43,bt-bh*.48,bh*.28,bh*.42);
    }else if(e.type==='blinker'){
      pathEllipse(X,cx,bt-bh*.50,bh*.50,bh*.48);
      pathEllipse(X,cx-dir*bh*.30,bt-bh*.52,bh*.31,bh*.27);
    }else if(e.type==='bombchicken'){
      pathEllipse(X,cx-dir*bh*.04,bt-bh*.43,bh*.48,bh*.40);
      pathEllipse(X,cx+dir*bh*.23,bt-bh*.76,bh*.27,bh*.24);
    }else return false;
    X.clip();return true;
  }

  function frenzyScale(d){d=Math.max(1,Number(d)||1);if(d<1000)return 1;return 1+Math.min(4,Math.max(0,Math.floor(Math.log10(d))-2))*.045}
  function addPlayerMask(X,ctx){
    const p=ctx.pl;if(!p)return false;
    const th=88*frenzyScale(ctx.dps),cx=p.x+p.w/2,bt=p.y+p.h+2,dir=p.dir||1,attacking=(p.at||0)>0;
    X.beginPath();
    pathEllipse(X,cx-dir*th*.05,bt-th*.54,th*.41,th*.48);
    pathEllipse(X,cx-dir*th*.05,bt-th*.20,th*.30,th*.23);
    pathEllipse(X,cx+dir*th*.34,bt-th*.46,th*.42,th*.22);
    if(attacking){
      pathEllipse(X,cx+dir*th*.74,bt-th*.47,th*.72,th*.52);
      pathEllipse(X,cx+dir*th*1.18,bt-th*.43,th*.55,th*.42);
    }
    X.clip();return true;
  }

  function groundLight(X,cx,bt,w,col='#96ff43',alpha=.12){
    X.save();
    const g=X.createRadialGradient(cx,bt-3,2,cx,bt-3,w);
    g.addColorStop(0,col);g.addColorStop(.42,col+'88');g.addColorStop(1,'rgba(0,0,0,0)');
    X.globalAlpha=alpha;X.fillStyle=g;X.fillRect(cx-w,bt-w*.35,w*2,w*.7);X.restore();
  }
  function contactShadow(X,cx,bt,w,a=.26){X.save();X.globalAlpha=a;X.fillStyle='#020509';X.filter='blur(2px)';X.beginPath();X.ellipse(cx,bt+1,w*.46,Math.max(3,w*.08),0,0,Math.PI*2);X.fill();X.restore()}

  function install(){
    const current=globalThis.__CWM_RENDER_HOOK||{};
    if(!current.drawPlayer||!current.drawEnemy){setTimeout(install,50);return}
    if(current.__cwmSilhouetteV4)return;
    const prev=current;
    function drawEnemy(ctx){
      const e=ctx.e;
      if(ctx.zoneI!==SEWER||!e||e.boss||!H[e.type])return typeof prev.drawEnemy==='function'?prev.drawEnemy(ctx):false;
      const X=ctx.X,bh=H[e.type]*(e.elite?1.15:1),cx=e.x+e.w/2,bt=e.y+e.h+2;
      groundLight(X,cx,bt,bh*.85,e.type==='blinker'?'#b84cff':'#9dff46',e.type==='blinker'?.07:.10);
      contactShadow(X,cx,bt,bh*.72,e.type==='blinker'?.16:.24);
      X.save();addEnemyMask(X,e,bh);const handled=prev.drawEnemy(ctx);X.restore();return handled;
    }
    function drawPlayer(ctx){
      if(!ctx.pl)return typeof prev.drawPlayer==='function'?prev.drawPlayer(ctx):false;
      const X=ctx.X,p=ctx.pl,th=88*frenzyScale(ctx.dps),cx=p.x+p.w/2,bt=p.y+p.h+2;
      const col=ctx.w?.element?.col||ctx.w?.col||'#73f2ff';
      groundLight(X,cx,bt,th*.82,'#9dff46',.10);contactShadow(X,cx,bt,th*.68,.25);
      X.save();addPlayerMask(X,ctx);const handled=prev.drawPlayer(ctx);X.restore();
      if((p.at||0)>0){X.save();X.globalAlpha=.10;X.strokeStyle=col;X.lineWidth=3;X.shadowColor=col;X.shadowBlur=14;X.beginPath();X.arc(cx+(p.dir||1)*th*.34,bt-th*.48,th*.34,0,Math.PI*2);X.stroke();X.restore()}
      return handled;
    }
    globalThis.__CWM_RENDER_HOOK={...prev,__cwmSilhouetteV4:true,drawEnemy,drawPlayer};
    globalThis.CWM_V2_INTEGRATION={build:BUILD,maskedSprites:true,grounding:true,zone:'Disco Sewer of Compliance'};
    console.info('CWM sprite silhouette integration installed',globalThis.CWM_V2_INTEGRATION);
  }
  install();
})();

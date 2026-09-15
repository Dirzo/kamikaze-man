(()=>{
  if(globalThis.__CWM_SPRITE_INTEGRATION_V9)return;
  globalThis.__CWM_SPRITE_INTEGRATION_V9=true;
  globalThis.__CWM_INTEGRATED_BASIC_ATTACKS=true;
  const BUILD='v9-heavy-artillery-integration-20260914a',SEWER=1;
  const H={crawler:58,wizard:78,shieldbro:94,blinker:62,bombchicken:70};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
  const VF=()=>globalThis.CWM_WEAPON_VISUAL,HA=()=>globalThis.CWM_HEAVY_ART;
  function family(w){return VF()?.family?.(w)||({sword:'blade',dagger:'blade',katana:'blade',hammer:'heavy',bow:'ranged',wand:'caster',staff:'caster',nunchucks:'trick',shuriken:'trick'}[w?.type]||'blade')}
  function frenzyScale(d){d=Math.max(1,Number(d)||1);if(d<1000)return 1;return 1+Math.min(4,Math.max(0,Math.floor(Math.log10(d))-2))*.045}
  function shadow(X,cx,bt,w,a=.22){X.save();X.globalAlpha=a;X.filter='blur(1.6px)';X.fillStyle='#02040a';X.beginPath();X.ellipse(cx,bt+1,w*.42,Math.max(3,w*.075),0,0,Math.PI*2);X.fill();X.restore()}
  function groundLight(X,cx,bt,w,alpha=.08,col='#9eff46'){X.save();const g=X.createRadialGradient(cx,bt-2,2,cx,bt-2,w);g.addColorStop(0,col+'a6');g.addColorStop(.44,col+'32');g.addColorStop(1,'rgba(0,0,0,0)');X.globalAlpha=alpha;X.fillStyle=g;X.fillRect(cx-w,bt-w*.3,w*2,w*.6);X.restore()}
  function attackT(p){return (p.at||0)>0&&p.atMax>0?clamp(1-p.at/p.atMax,0,1):0}
  function phase(p){const t=attackT(p);if(!(p.at>0))return{active:false,t:0,wind:0,strike:0,recover:0};if(t<.28)return{active:true,t,wind:ease(t/.28),strike:0,recover:0};if(t<.62)return{active:true,t,wind:1,strike:ease((t-.28)/.34),recover:0};return{active:true,t,wind:1,strike:1,recover:ease((t-.62)/.38)}}
  function cleanPlayer(p){const cp={...p,at:0};if((p.at||0)>0&&p.on){cp.vx=0;cp.dashT=0}return cp}
  function heavyProfile(w){const h=HA();if(!h)return null;const m=h.meta(w);return{...m,artillery:h.isArtillery(w),melee:h.isMelee(w)}}
  function bodyMotion(p,w){
    const q=phase(p),dir=p.dir||1,f=family(w);if(!q.active)return{q,dx:0,dy:0,rot:0,sc:1};
    if(f==='heavy'){
      const hp=heavyProfile(w);
      if(hp?.artillery){let dx=0,dy=0,rot=0,sc=1;if(q.strike===0){dx=-dir*3*q.wind;dy=2*q.wind;rot=-dir*.018*q.wind;sc=1-.012*q.wind}else if(q.recover===0){const kick=Math.sin(q.strike*Math.PI);dx=-dir*(5+11*kick);dy=1+2*kick;rot=-dir*(.02+.045*kick);sc=1-.018*kick}else{dx=lerp(-dir*5,0,q.recover);dy=lerp(1,0,q.recover);rot=lerp(-dir*.02,0,q.recover);sc=lerp(.99,1,q.recover)}return{q,dx,dy,rot,sc,artillery:true,subtype:hp.subtype}}
      let dx=0,dy=0,rot=0,sc=1;if(q.strike===0){dx=-dir*10*q.wind;dy=3*q.wind;rot=-dir*.12*q.wind;sc=1-.01*q.wind}else if(q.recover===0){dx=dir*lerp(-10,22,q.strike);dy=-5*Math.sin(q.strike*Math.PI);rot=dir*lerp(-.12,.15,q.strike);sc=1+.04*Math.sin(q.strike*Math.PI)}else{dx=dir*lerp(22,0,q.recover);dy=lerp(-2,0,q.recover);rot=dir*lerp(.15,0,q.recover);sc=lerp(1.02,1,q.recover)}return{q,dx,dy,rot,sc,artillery:false,subtype:hp?.subtype}
    }
    const power=f==='blade'?1:f==='trick'?.92:f==='ranged'?.48:.62;let dx=0,dy=0,rot=0,sc=1;if(q.strike===0){dx=-dir*7*power*q.wind;rot=-dir*.075*power*q.wind;dy=q.wind}else if(q.recover===0){dx=dir*lerp(-7*power,15*power,q.strike);rot=dir*lerp(-.075*power,.095*power,q.strike);dy=-2*Math.sin(q.strike*Math.PI);sc=1+.025*power*Math.sin(q.strike*Math.PI)}else{dx=dir*lerp(15*power,0,q.recover);rot=dir*lerp(.095*power,0,q.recover);dy=lerp(-1,0,q.recover);sc=lerp(1.012,1,q.recover)}if(f==='ranged'){rot*=.20;dy-=2*q.wind}if(f==='caster'){rot*=.30;dy-=3*Math.sin(q.t*Math.PI)}return{q,dx,dy,rot,sc}
  }
  function socket(w,p){
    const q=phase(p),f=family(w),variant=(p.combo||0)&1;let x=.21,y=.46,a=-.08,s=.78;
    if(f==='heavy'){
      const hp=heavyProfile(w),st=hp?.subtype;
      if(!q.active){if(hp?.artillery){x=.23;y=.46;s=1.10;a=st==='scrap_mortar'?-.28:st==='siege_toaster'?-.04:-.07}else{x=.18;y=.47;s=1.07;a=st==='pile_driver'?-.55:-.20}return{x,y,a,s}}
      if(hp?.artillery){x=.25;y=.45;s=1.13;a=st==='scrap_mortar'?-.30:-.05;if(q.strike){x=lerp(.25,.20,q.strike);a+=.025*Math.sin(q.strike*Math.PI)}if(q.recover){x=lerp(.20,.23,q.recover);a=lerp(a,-.07,q.recover)}return{x,y,a,s}}
      x=.25;y=.45;s=1.15;const start=st==='pile_driver'?-1.34:variant?.68:-1.06,end=st==='pile_driver'?.10:variant?-.76:.48;a=lerp(-.18,start,q.wind);if(q.strike){x=lerp(.25,.44,q.strike);y=lerp(.45,.40,q.strike);a=lerp(start,end,q.strike)}if(q.recover){x=lerp(.44,.20,q.recover);y=lerp(.40,.47,q.recover);a=lerp(end,-.18,q.recover)}return{x,y,a,s}
    }
    if(!q.active){if(!p.on){x=.20;y=.46;a=(p.vy||0)<0?-.14:.08;s=.74}else if(Math.abs(p.vx||0)>45){x=.19;y=.46;a=.02;s=.78}if(f==='ranged'){x=.27;y=.46;s=.88;a=-.08}else if(f==='caster'){x=.25;y=.45;s=.90;a=-.28}else if(f==='trick'){x=.23;y=.44;s=.84;a=-.12}return{x,y,a,s}}
    if(f==='ranged'){x=.28;y=.45;s=.92;a=lerp(-.08,-.22,q.wind);if(q.strike)a=lerp(-.22,.08,q.strike);if(q.recover)a=lerp(.08,-.08,q.recover)}else if(f==='caster'){x=.28;y=.45;s=.94;a=lerp(-.42,-.70,q.wind);if(q.strike){x=lerp(.28,.38,q.strike);a=lerp(-.70,-.02,q.strike)}if(q.recover){x=lerp(.38,.24,q.recover);a=lerp(-.02,-.18,q.recover)}}else if(f==='trick'){x=.24;y=.44;s=.90;const start=variant?-.82:.54,end=variant?.72:-.70;a=lerp(-.10,start,q.wind);if(q.strike){x=lerp(.24,.42,q.strike);a=lerp(start,end,q.strike)}if(q.recover){x=lerp(.42,.22,q.recover);a=lerp(end,-.10,q.recover)}}else{x=.25;y=.45;s=.98;const start=variant?.62:-.92,end=variant?-.72:.58;a=lerp(-.08,start,q.wind);if(q.strike){x=lerp(.25,.38,q.strike);y=lerp(.45,.42,q.strike);a=lerp(start,end,q.strike)}if(q.recover){x=lerp(.38,.21,q.recover);y=lerp(.42,.46,q.recover);a=lerp(end,-.08,q.recover)}}return{x,y,a,s}
  }
  function drawWeapon(X,w,p,cx,bt,th,dir,time){const sys=VF();if(!w||!sys?.draw)return;const sk=socket(w,p),desc=sys.describe(w),fam=desc.family,familyMul=fam==='heavy'?1.05:fam==='ranged'?.94:fam==='caster'?.96:fam==='trick'?.92:1,sc=th*sk.s/82*familyMul,q=phase(p);X.save();X.translate(cx+dir*th*sk.x,bt-th*sk.y);if(dir<0)X.scale(-1,1);X.rotate(sk.a);sys.draw(X,w,{scale:sc,time,glow:true,attacking:q.active,attackT:q.t});X.restore()}
  function integratedRim(X,p,w,cx,bt,th){const d=VF()?.describe?.(w);if(!d)return;const q=phase(p),col=d.emissive;X.save();X.globalCompositeOperation='screen';X.strokeStyle=col;X.shadowColor=col;X.shadowBlur=q.active?12:6;X.lineWidth=q.active?3:2;X.globalAlpha=q.active?.14:.06;X.beginPath();X.ellipse(cx,bt-th*.48,th*.34,th*.47,0,0,Math.PI*2);X.stroke();X.restore()}
  function install(){
    const current=globalThis.__CWM_RENDER_HOOK||{};
    if(!current.drawPlayer||!current.drawEnemy||!VF()?.draw||!HA()?.build){setTimeout(install,50);return}
    if(current.__cwmIntegrationV9)return;
    const prev=current;
    function drawEnemy(ctx){const e=ctx.e;if(ctx.zoneI!==SEWER||!e||e.boss||!H[e.type])return typeof prev.drawEnemy==='function'?prev.drawEnemy(ctx):false;const X=ctx.X,bh=H[e.type]*(e.elite?1.15:1),cx=e.x+e.w/2,bt=e.y+e.h+2;groundLight(X,cx,bt,bh*.84,e.type==='blinker'?.05:.07,e.type==='blinker'?'#c25bff':'#9eff46');shadow(X,cx,bt,bh*.76,e.type==='blinker'?.13:.19);return prev.drawEnemy(ctx)}
    function drawPlayer(ctx){if(!ctx.pl)return typeof prev.drawPlayer==='function'?prev.drawPlayer(ctx):false;const X=ctx.X,p=ctx.pl,th=90*frenzyScale(ctx.dps),cx=p.x+p.w/2,bt=p.y+p.h+2,dir=p.dir||1,m=bodyMotion(p,ctx.w),attacking=m.q.active,time=ctx.time||performance.now()/1000,d=VF().describe(ctx.w),bounce=d.elementVisual?.c||'#9eff46';groundLight(X,cx,bt,th*.80,family(ctx.w)==='heavy'?.08:.06,bounce);shadow(X,cx,bt,th*(family(ctx.w)==='heavy'?.76:.69),family(ctx.w)==='heavy'?.24:.20);X.save();X.translate(cx,bt);X.rotate(m.rot);X.scale(m.sc,m.sc);X.translate(-cx+m.dx,-bt+m.dy);const clean=cleanPlayer(p);if(attacking&&m.q.strike<.25)drawWeapon(X,ctx.w,p,cx,bt,th,dir,time);const handled=prev.drawPlayer({...ctx,pl:clean,w:null});if(!attacking||m.q.strike>=.25)drawWeapon(X,ctx.w,p,cx,bt,th,dir,time);integratedRim(X,p,ctx.w,cx,bt,th);X.restore();return handled}
    globalThis.__CWM_RENDER_HOOK={...prev,__cwmIntegrationV9:true,drawEnemy,drawPlayer};
    globalThis.CWM_V9_CONTENT={build:BUILD,weaponVisual:VF().build,heavyArt:HA().build,nameAware:true,heavySubtypes:Object.keys(HA().labels),sceneTarget:'concept-rendering'};
    console.info('CWM v9 heavy artillery integration installed',globalThis.CWM_V9_CONTENT)
  }
  install()
})();
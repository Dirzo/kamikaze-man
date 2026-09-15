(()=>{
  if(globalThis.__CWM_SPRITE_INTEGRATION_V8)return;
  globalThis.__CWM_SPRITE_INTEGRATION_V8=true;
  globalThis.__CWM_INTEGRATED_BASIC_ATTACKS=true;
  const BUILD='v8-name-aware-weapon-integration-20260914a',SEWER=1;
  const H={crawler:58,wizard:78,shieldbro:94,blinker:62,bombchicken:70};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t);
  const VF=()=>globalThis.CWM_WEAPON_VISUAL;
  function family(w){return VF()?.family?.(w)||({sword:'blade',dagger:'blade',katana:'blade',hammer:'heavy',bow:'ranged',wand:'caster',staff:'caster',nunchucks:'trick',shuriken:'trick'}[w?.type]||'blade')}
  function frenzyScale(d){d=Math.max(1,Number(d)||1);if(d<1000)return 1;return 1+Math.min(4,Math.max(0,Math.floor(Math.log10(d))-2))*.045}
  function shadow(X,cx,bt,w,a=.22){X.save();X.globalAlpha=a;X.filter='blur(1.6px)';X.fillStyle='#02040a';X.beginPath();X.ellipse(cx,bt+1,w*.42,Math.max(3,w*.075),0,0,Math.PI*2);X.fill();X.restore()}
  function groundLight(X,cx,bt,w,alpha=.08,col='#9eff46'){X.save();const g=X.createRadialGradient(cx,bt-2,2,cx,bt-2,w);g.addColorStop(0,col+'a6');g.addColorStop(.44,col+'32');g.addColorStop(1,'rgba(0,0,0,0)');X.globalAlpha=alpha;X.fillStyle=g;X.fillRect(cx-w,bt-w*.3,w*2,w*.6);X.restore()}
  function attackT(p){return (p.at||0)>0&&p.atMax>0?clamp(1-p.at/p.atMax,0,1):0}
  function phase(p){const t=attackT(p);if(!(p.at>0))return{active:false,t:0,wind:0,strike:0,recover:0};if(t<.28)return{active:true,t,wind:ease(t/.28),strike:0,recover:0};if(t<.62)return{active:true,t,wind:1,strike:ease((t-.28)/.34),recover:0};return{active:true,t,wind:1,strike:1,recover:ease((t-.62)/.38)}}
  function cleanPlayer(p){const cp={...p,at:0};if((p.at||0)>0&&p.on){cp.vx=0;cp.dashT=0}return cp}
  function bodyMotion(p,w){
    const q=phase(p),dir=p.dir||1,f=family(w);if(!q.active)return{q,dx:0,dy:0,rot:0,sc:1};
    const power=f==='heavy'?1.42:f==='blade'?1:f==='trick'?.92:f==='ranged'?.48:.62;
    let dx=0,dy=0,rot=0,sc=1;
    if(q.strike===0){dx=-dir*7*power*q.wind;rot=-dir*.075*power*q.wind;dy=q.wind}
    else if(q.recover===0){dx=dir*lerp(-7*power,15*power,q.strike);rot=dir*lerp(-.075*power,.095*power,q.strike);dy=-2*Math.sin(q.strike*Math.PI);sc=1+.025*power*Math.sin(q.strike*Math.PI)}
    else{dx=dir*lerp(15*power,0,q.recover);rot=dir*lerp(.095*power,0,q.recover);dy=lerp(-1,0,q.recover);sc=lerp(1.012,1,q.recover)}
    if(f==='ranged'){rot*=.20;dy-=2*q.wind}if(f==='caster'){rot*=.30;dy-=3*Math.sin(q.t*Math.PI)}return{q,dx,dy,rot,sc}
  }
  function socket(w,p){
    const q=phase(p),f=family(w),variant=(p.combo||0)&1;let x=.21,y=.46,a=-.08,s=.78;
    if(!q.active){if(!p.on){x=.20;y=.46;a=(p.vy||0)<0?-.14:.08;s=.74}else if(Math.abs(p.vx||0)>45){x=.19;y=.46;a=.02;s=.78}if(f==='heavy'){x=.18;y=.47;s=.93;a=-.20}else if(f==='ranged'){x=.27;y=.46;s=.88;a=-.08}else if(f==='caster'){x=.25;y=.45;s=.90;a=-.28}else if(f==='trick'){x=.23;y=.44;s=.84;a=-.12}return{x,y,a,s}}
    if(f==='ranged'){x=.28;y=.45;s=.92;a=lerp(-.08,-.22,q.wind);if(q.strike)a=lerp(-.22,.08,q.strike);if(q.recover)a=lerp(.08,-.08,q.recover)}
    else if(f==='caster'){x=.28;y=.45;s=.94;a=lerp(-.42,-.70,q.wind);if(q.strike){x=lerp(.28,.38,q.strike);a=lerp(-.70,-.02,q.strike)}if(q.recover){x=lerp(.38,.24,q.recover);a=lerp(-.02,-.18,q.recover)}}
    else if(f==='trick'){x=.24;y=.44;s=.90;const start=variant?-.82:.54,end=variant?.72:-.70;a=lerp(-.10,start,q.wind);if(q.strike){x=lerp(.24,.42,q.strike);a=lerp(start,end,q.strike)}if(q.recover){x=lerp(.42,.22,q.recover);a=lerp(end,-.10,q.recover)}}
    else{x=.25;y=.45;s=f==='heavy'?1.08:.98;const start=variant?.62:-.92,end=variant?-.72:.58;a=lerp(-.08,start,q.wind);if(f==='heavy'){a=lerp(-.15,-1.05,q.wind);if(q.strike)a=lerp(-1.05,.42,q.strike)}if(q.strike){x=lerp(.25,f==='heavy'?.42:.38,q.strike);y=lerp(.45,.42,q.strike);if(f!=='heavy')a=lerp(start,end,q.strike)}if(q.recover){x=lerp(f==='heavy'?.42:.38,.21,q.recover);y=lerp(.42,.46,q.recover);a=lerp(f==='heavy'?.42:end,-.08,q.recover)}}
    return{x,y,a,s}
  }
  function drawWeapon(X,w,p,cx,bt,th,dir,time){const sys=VF();if(!w||!sys?.draw)return;const sk=socket(w,p),desc=sys.describe(w),fam=desc.family,familyMul=fam==='heavy'?1.05:fam==='ranged'?.94:fam==='caster'?.96:fam==='trick'?.92:1,sc=th*sk.s/82*familyMul;X.save();X.translate(cx+dir*th*sk.x,bt-th*sk.y);if(dir<0)X.scale(-1,1);X.rotate(sk.a);sys.draw(X,w,{scale:sc,time,glow:true});X.restore()}
  function integratedRim(X,p,w,cx,bt,th){const d=VF()?.describe?.(w);if(!d)return;const q=phase(p),col=d.emissive;X.save();X.globalCompositeOperation='screen';X.strokeStyle=col;X.shadowColor=col;X.shadowBlur=q.active?12:6;X.lineWidth=q.active?3:2;X.globalAlpha=q.active?.16:.07;X.beginPath();X.ellipse(cx,bt-th*.48,th*.34,th*.47,0,0,Math.PI*2);X.stroke();X.restore()}
  function install(){
    const current=globalThis.__CWM_RENDER_HOOK||{};
    if(!current.drawPlayer||!current.drawEnemy||!VF()?.draw){setTimeout(install,50);return}
    if(current.__cwmIntegrationV8)return;
    const prev=current;
    function drawEnemy(ctx){const e=ctx.e;if(ctx.zoneI!==SEWER||!e||e.boss||!H[e.type])return typeof prev.drawEnemy==='function'?prev.drawEnemy(ctx):false;const X=ctx.X,bh=H[e.type]*(e.elite?1.15:1),cx=e.x+e.w/2,bt=e.y+e.h+2;groundLight(X,cx,bt,bh*.84,e.type==='blinker'?.05:.07,e.type==='blinker'?'#c25bff':'#9eff46');shadow(X,cx,bt,bh*.76,e.type==='blinker'?.13:.19);return prev.drawEnemy(ctx)}
    function drawPlayer(ctx){if(!ctx.pl)return typeof prev.drawPlayer==='function'?prev.drawPlayer(ctx):false;const X=ctx.X,p=ctx.pl,th=90*frenzyScale(ctx.dps),cx=p.x+p.w/2,bt=p.y+p.h+2,dir=p.dir||1,m=bodyMotion(p,ctx.w),attacking=m.q.active,time=ctx.time||performance.now()/1000,d=VF().describe(ctx.w),bounce=d.elementVisual?.c||'#9eff46';groundLight(X,cx,bt,th*.80,.06,bounce);shadow(X,cx,bt,th*.69,.20);X.save();X.translate(cx,bt);X.rotate(m.rot);X.scale(m.sc,m.sc);X.translate(-cx+m.dx,-bt+m.dy);const clean=cleanPlayer(p);if(attacking&&m.q.strike<.25)drawWeapon(X,ctx.w,p,cx,bt,th,dir,time);const handled=prev.drawPlayer({...ctx,pl:clean,w:null});if(!attacking||m.q.strike>=.25)drawWeapon(X,ctx.w,p,cx,bt,th,dir,time);integratedRim(X,p,ctx.w,cx,bt,th);X.restore();return handled}
    globalThis.__CWM_RENDER_HOOK={...prev,__cwmIntegrationV8:true,drawEnemy,drawPlayer};
    globalThis.CWM_V8_CONTENT={build:BUILD,weaponVisual:VF().build,nameAware:true,weaponFamilies:['blade','heavy','ranged','caster','trick'],sceneTarget:'concept-rendering'};
    console.info('CWM v8 weapon-aware cast integration installed',globalThis.CWM_V8_CONTENT)
  }
  install();
})();
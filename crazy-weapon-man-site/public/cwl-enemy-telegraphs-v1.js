(()=>{
  if(globalThis.__CWL_ENEMY_TELEGRAPHS_V1)return;
  globalThis.__CWL_ENEMY_TELEGRAPHS_V1=true;
  const BUILD='cwl-enemy-telegraphs-v1-20260915a';
  const state={build:BUILD,installed:false,waitingFor:'legacy integration',draws:0,lastType:'',lastState:'',installedAt:0};
  const TAU=Math.PI*2;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const pulse=()=>.55+.45*Math.sin(performance.now()/95);
  function line(X,x1,y1,x2,y2,col,w=2,a=.65){X.save();X.globalAlpha=a;X.strokeStyle=col;X.lineWidth=w;X.setLineDash([8,7]);X.beginPath();X.moveTo(x1,y1);X.lineTo(x2,y2);X.stroke();X.setLineDash([]);X.restore()}
  function ring(X,x,y,rx,ry,col,a=.5,w=2){X.save();X.globalAlpha=a;X.strokeStyle=col;X.lineWidth=w;X.shadowColor=col;X.shadowBlur=8;X.beginPath();X.ellipse(x,y,rx,ry,0,0,TAU);X.stroke();X.restore()}
  function wedge(X,x,y,dir,len,width,col,a=.35){X.save();X.globalAlpha=a;X.fillStyle=col;X.beginPath();X.moveTo(x,y-width*.35);X.lineTo(x+dir*len,y-width*.5);X.lineTo(x+dir*len,y+width*.5);X.lineTo(x,y+width*.35);X.closePath();X.fill();X.restore()}
  function cross(X,x,y,col,a=.75){X.save();X.globalAlpha=a;X.strokeStyle=col;X.lineWidth=2.5;X.shadowColor=col;X.shadowBlur=10;X.beginPath();X.moveTo(x-14,y);X.lineTo(x+14,y);X.moveTo(x,y-14);X.lineTo(x,y+14);X.stroke();X.restore()}
  function dangerFor(e){
    if(!e||e.dead)return null;
    if(e.type==='wizard'&&e.state==='wind')return{kind:'cast',col:'#9eff46'};
    if(e.type==='shieldbro'&&(e.state==='wind'||e.state==='lunge'||e.state==='bash'))return{kind:'charge',col:'#ff8a3d'};
    if(e.type==='blinker'&&e.state==='blinkwind')return{kind:'blink',col:'#c25bff'};
    if(e.type==='blinker'&&(e.state==='lunge'||e.state==='attack'))return{kind:'charge',col:'#c25bff'};
    if(e.type==='bombchicken'&&(e.state==='bomb'||e.state==='attack'))return{kind:'blast',col:'#ff4f55'};
    return null;
  }
  function before(ctx,d){
    const {X,e,pl}=ctx;if(!X||!e||!d)return;
    const cx=e.x+e.w/2,bt=e.y+e.h+2,pcx=(pl?.x||0)+(pl?.w||0)/2,pcy=(pl?.y||0)+(pl?.h||0)/2,p=pulse();
    X.save();X.globalCompositeOperation='screen';
    if(d.kind==='cast'){
      ring(X,cx,bt,26+7*p,7+2*p,d.col,.38+.22*p,2.2);line(X,cx,e.y+e.h*.45,pcx,pcy,d.col,1.8,.28+.22*p);
    }else if(d.kind==='charge'){
      const dir=e.dir||Math.sign(pcx-cx)||1;wedge(X,cx,bt-6,dir,105+20*p,26,d.col,.15+.13*p);line(X,cx,bt-7,cx+dir*(115+20*p),bt-7,d.col,2,.44+.18*p);
    }else if(d.kind==='blink'){
      ring(X,pcx,Math.min(bt,pcy+28),30+8*p,8+2*p,d.col,.38+.24*p,2.4);cross(X,pcx,pcy,d.col,.46+.28*p);
    }else if(d.kind==='blast'){
      const r=54+10*p;ring(X,cx,bt-4,r,r*.24,d.col,.46+.26*p,3);ring(X,cx,e.y+e.h*.45,22+5*p,22+5*p,d.col,.20+.16*p,2);
    }
    X.restore();
  }
  function after(ctx,d){
    if(!d)return;const {X,e}=ctx,cx=e.x+e.w/2,y=e.y-10,p=pulse();
    X.save();X.globalAlpha=.72+.2*p;X.fillStyle=d.col;X.shadowColor=d.col;X.shadowBlur=9;X.beginPath();X.moveTo(cx,y-10);X.lineTo(cx+7,y+3);X.lineTo(cx-7,y+3);X.closePath();X.fill();X.restore();
    state.draws++;state.lastType=e.type||'';state.lastState=e.state||'';
  }
  function install(){
    const hook=globalThis.__CWM_RENDER_HOOK;
    if(!hook?.drawEnemy)return false;
    const settled=!!(hook.__cwmIntegrationV9||globalThis.CWM_V9_CONTENT);
    if(!settled)return false;
    if(hook.drawEnemy.__cwlTelegraph){state.installed=true;return true}
    const base=hook.drawEnemy;
    const wrapped=function(ctx){const d=dangerFor(ctx?.e);if(d)before(ctx,d);const out=base(ctx);if(d)after(ctx,d);return out};
    wrapped.__cwlTelegraph=true;
    globalThis.__CWM_RENDER_HOOK={...hook,__cwlTelegraphsV1:true,drawEnemy:wrapped};
    state.installed=true;state.waitingFor='';state.installedAt=Date.now();
    console.info('Crazy Weapon Lady enemy telegraphs installed',BUILD);
    return true;
  }
  let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>90){clearInterval(timer);if(!state.installed){state.waitingFor='integration unavailable';console.warn('CWL enemy telegraphs could not attach',state)}}},100);
  globalThis.CWL_ENEMY_TELEGRAPHS={build:BUILD,state,dangerFor,reinstall:install};
})();

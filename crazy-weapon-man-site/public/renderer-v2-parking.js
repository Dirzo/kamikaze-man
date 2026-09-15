(()=>{
  if(globalThis.__CWM_V2_PARKING_RENDERER)return;
  globalThis.__CWM_V2_PARKING_RENDERER=true;
  const BUILD='cwl-parking-v1-20260915a',PARKING=2,prev=globalThis.__CWM_RENDER_HOOK||{};
  const C={ink:'#080b12',sky0:'#0b1220',sky1:'#17263a',sky2:'#25364a',asphalt:'#232b35',asphalt2:'#313b47',steel:'#596776',hi:'#8ca0b4',amber:'#ffbe55',cyan:'#6ae9ff',mag:'#f45cb6',red:'#ff5c6d',paper:'#e9e0c3',green:'#83e681'};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function rr(X,x,y,w,h,r,f,s=C.ink,l=3){X.beginPath();X.roundRect(x,y,w,h,r);X.fillStyle=f;X.fill();if(s){X.strokeStyle=s;X.lineWidth=l;X.stroke()}}
  function line(X,x1,y1,x2,y2,c,w=3,a=1){X.save();X.globalAlpha=a;X.strokeStyle=c;X.lineWidth=w;X.lineCap='round';X.beginPath();X.moveTo(x1,y1);X.lineTo(x2,y2);X.stroke();X.restore()}
  function ellipse(X,x,y,rx,ry,f,s=C.ink,l=3){X.beginPath();X.ellipse(x,y,rx,ry,0,0,Math.PI*2);X.fillStyle=f;X.fill();if(s){X.strokeStyle=s;X.lineWidth=l;X.stroke()}}
  function poly(X,pts,f,s=C.ink,l=3){X.beginPath();X.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)X.lineTo(pts[i][0],pts[i][1]);X.closePath();X.fillStyle=f;X.fill();if(s){X.strokeStyle=s;X.lineWidth=l;X.stroke()}}
  function glowDot(X,x,y,r,c){X.save();X.shadowColor=c;X.shadowBlur=r*3;X.fillStyle=c;X.beginPath();X.arc(x,y,r,0,Math.PI*2);X.fill();X.restore()}
  function hash(s){let h=2166136261;for(const ch of String(s||'parking')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
  function platform(X,p){
    X.fillStyle='#121821';X.fillRect(p.x-3,p.y-3,p.w+6,p.h+8);
    let g=X.createLinearGradient(0,p.y,0,p.y+p.h);g.addColorStop(0,'#7f8d9b');g.addColorStop(.18,'#667584');g.addColorStop(1,'#39434e');X.fillStyle=g;X.fillRect(p.x,p.y,p.w,p.h);
    X.fillStyle='#1a2028';X.fillRect(p.x,p.y+p.h-6,p.w,6);
    X.globalAlpha=.5;for(let x=p.x+13;x<p.x+p.w-6;x+=38){X.fillStyle='#d9b64d';X.fillRect(x,p.y+p.h-5,16,3)}X.globalAlpha=1;
  }
  function lamp(X,x,y,side=1){
    line(X,x,y,x,y+150,'#313d4a',8);line(X,x,y,x+side*44,y,'#313d4a',7);rr(X,x+side*28-17,y-8,34,15,4,'#343f4d',C.ink,2);glowDot(X,x+side*28,y,5,C.amber);
    let g=X.createRadialGradient(x+side*28,y,2,x+side*28,y+70,95);g.addColorStop(0,'rgba(255,190,85,.20)');g.addColorStop(1,'rgba(255,190,85,0)');X.fillStyle=g;X.beginPath();X.moveTo(x+side*17,y+7);X.lineTo(x+side*96,y+170);X.lineTo(x-side*46,y+170);X.closePath();X.fill();
  }
  function swordMeter(X,x,y,flip=1){
    X.save();X.translate(x,y);X.scale(flip,1);
    line(X,0,0,0,73,'#3c4957',6);rr(X,-14,-19,28,25,7,'#222d39',C.ink,3);glowDot(X,0,-7,3,C.cyan);
    X.fillStyle='#8797a6';X.strokeStyle=C.ink;X.lineWidth=2;X.beginPath();X.moveTo(0,13);X.lineTo(6,31);X.lineTo(3,44);X.lineTo(8,60);X.lineTo(0,72);X.lineTo(-8,60);X.lineTo(-3,44);X.lineTo(-6,31);X.closePath();X.fill();X.stroke();
    line(X,-13,19,13,19,C.amber,3);X.restore();
  }
  function garage(X,W,G){
    const x=W*.08,y=G*.18,w=W*.42,h=G*.48;
    X.save();X.globalAlpha=.78;rr(X,x,y,w,h,8,'#182331','#0a0e15',8);
    for(let r=0;r<3;r++){const yy=y+42+r*66;X.fillStyle='#0d1620';X.fillRect(x+20,yy,w-40,35);for(let c=0;c<6;c++){const xx=x+38+c*(w-76)/5;line(X,xx,yy+1,xx,yy+34,'#2c3948',3);if((c+r)%3===0)glowDot(X,xx+9,yy+17,2.3,C.amber)}}
    X.fillStyle='#283647';X.fillRect(x+w-54,y+18,24,h-36);for(let yy=y+30;yy<y+h-20;yy+=28)line(X,x+w-50,yy,x+w-34,yy,'#9db0bf',2,.45);
    X.restore();
  }
  function skyline(X,W,G){
    X.save();X.globalAlpha=.58;let x=-20,i=0;while(x<W+40){const w=54+((i*37)%70),h=45+((i*83)%150);X.fillStyle=i%2?'#101a27':'#132130';X.fillRect(x,G*.63-h,w,h);for(let wx=x+13;wx<x+w-8;wx+=19)for(let wy=G*.63-h+16;wy<G*.63-10;wy+=24){if(((wx+wy+i)>>3)%5===0){X.fillStyle='#d8ae5d';X.globalAlpha=.16;X.fillRect(wx,wy,5,8);X.globalAlpha=.58}}x+=w+8;i++}X.restore();
  }
  function fence(X,W,G){X.save();X.globalAlpha=.38;line(X,0,G*.64,W,G*.64,'#7b8a99',4);for(let x=0;x<W;x+=46){line(X,x,G*.64-90,x,G*.64,'#657483',3);line(X,x,G*.64-90,x+46,G*.64,'#657483',1.5,.5);line(X,x+46,G*.64-90,x,G*.64,'#657483',1.5,.5)}X.restore()}
  function drawBg(ctx){
    if(ctx.zoneI!==PARKING)return typeof prev.drawBg==='function'?prev.drawBg(ctx):false;
    const {X,W,H,G,time,platforms}=ctx;X.save();
    let sky=X.createLinearGradient(0,0,0,G);sky.addColorStop(0,C.sky0);sky.addColorStop(.55,C.sky1);sky.addColorStop(1,C.sky2);X.fillStyle=sky;X.fillRect(0,0,W,H);
    X.globalAlpha=.28;for(let i=0;i<7;i++){const x=((i*211+time*5)% (W+280))-140,y=65+(i%3)*54;X.fillStyle='#8ba0b5';X.beginPath();X.ellipse(x,y,100+(i%2)*45,22+(i%3)*6,0,0,Math.PI*2);X.fill()}X.globalAlpha=1;
    skyline(X,W,G);garage(X,W,G);fence(X,W,G);
    X.save();X.globalAlpha=.74;X.fillStyle='#d8e1ee';X.beginPath();X.arc(W*.82,G*.19,58,0,Math.PI*2);X.fill();X.globalCompositeOperation='destination-out';X.beginPath();X.arc(W*.845,G*.175,54,0,Math.PI*2);X.fill();X.restore();
    lamp(X,W*.13,118,1);lamp(X,W*.63,104,-1);lamp(X,W*.90,156,-1);
    X.fillStyle='#222a33';X.fillRect(0,G,W,H-G);let asphalt=X.createLinearGradient(0,G,0,H);asphalt.addColorStop(0,'#313b46');asphalt.addColorStop(1,'#1d232b');X.fillStyle=asphalt;X.fillRect(0,G,W,H-G);
    X.globalAlpha=.24;for(let x=30;x<W;x+=150){X.fillStyle='#dbe4ea';X.save();X.translate(x,G+47);X.rotate(-.06);X.fillRect(-38,-3,76,6);X.restore()}X.globalAlpha=1;
    line(X,0,G+4,W,G+4,'#71dff0',3,.55);line(X,0,G+12,W,G+12,'#91d6e1',1,.28);
    for(const p of platforms||[])if(!p.disabled)platform(X,p);
    swordMeter(X,W*.32,G-70,1);swordMeter(X,W*.69,G-72,-1);
    rr(X,W*.40,55,W*.28,52,9,'#111923e8','#394a5d',4);X.textAlign='center';X.fillStyle='#dce8f2';X.font='1000 16px system-ui';X.fillText('MUNICIPAL SWORD PARKING',W*.54,79);X.fillStyle=C.amber;X.font='900 9px system-ui';X.fillText('PERMIT REQUIRED · DUELS VALIDATED AT KIOSK',W*.54,94);X.textAlign='left';
    X.restore();document.documentElement.dataset.cwlParkingBg='pass';globalThis.__CWM_V2_LAST_DRAW={build:BUILD,zone:ctx.zoneI,at:Date.now()};return true;
  }
  function drawLauncher(ctx,e,seed){
    const {X,time}=ctx,dir=e.dir||1,cx=e.x+e.w/2,cy=e.y+e.h/2,hit=clamp((e.hitT||0)/.22,0,1);X.save();X.translate(cx-(e.hitDir||0)*hit*6,cy);X.scale(dir*(1+hit*.07),1-hit*.05);
    X.save();X.globalAlpha=.28;ellipse(X,0,e.h*.47,e.w*.52,6,'#000',null,0);X.restore();
    const jacket=seed%2?'#47556b':'#596070';line(X,-7,7,-12,e.h*.37,jacket,8);line(X,7,7,11,e.h*.37,jacket,8);line(X,-11,e.h*.37,-18,e.h*.46,'#202733',7);line(X,11,e.h*.37,19,e.h*.46,'#202733',7);
    rr(X,-15,-13,30,31,8,jacket,C.ink,3);X.fillStyle='#f1d7c6';ellipse(X,0,-24,10,11,'#d7b7aa',C.ink,3);X.fillStyle='#1a202a';X.beginPath();X.arc(0,-27,11,Math.PI,Math.PI*2);X.fill();
    X.fillStyle=C.paper;X.fillRect(-9,-8,12,14);line(X,-7,-4,1,-4,'#8f7c5c',1.4);line(X,-7,0,0,0,'#8f7c5c',1.4);
    X.save();X.translate(13,-2);X.rotate(-.08+Math.sin(time*4+seed)*.015);rr(X,0,-10,42,20,6,'#303b47',C.ink,4);rr(X,32,-7,20,14,4,'#687787',C.ink,3);glowDot(X,46,0,3,seed%3?C.cyan:C.mag);poly(X,[[8,-10],[13,-24],[18,-10]],'#d9dde2',C.ink,2);poly(X,[[21,-10],[27,-23],[31,-8]],'#d9dde2',C.ink,2);line(X,5,11,-1,23,'#2a333f',5);X.restore();
    if(e.elite){X.strokeStyle=C.red;X.lineWidth=2.5;X.globalAlpha=.7;X.beginPath();X.arc(0,0,Math.max(e.w,e.h)*.58,0,Math.PI*2);X.stroke()}
    X.restore();return true;
  }
  function drawWarden(ctx,e,seed){
    const {X}=ctx,dir=e.dir||1,cx=e.x+e.w/2,cy=e.y+e.h/2;X.save();X.translate(cx,cy);X.scale(dir,1);X.save();X.globalAlpha=.3;ellipse(X,0,e.h*.46,e.w*.54,7,'#000',null,0);X.restore();
    line(X,-8,9,-12,e.h*.38,'#313b49',9);line(X,8,9,12,e.h*.38,'#313b49',9);rr(X,-18,-17,36,36,8,'#253442',C.ink,4);ellipse(X,0,-28,11,12,'#bea69d',C.ink,3);rr(X,-13,-36,26,10,4,'#35495b',C.ink,2);X.fillStyle=C.amber;X.fillRect(-4,-34,8,3);
    X.save();X.translate(-24,-4);rr(X,-9,-20,18,43,6,'#455565',C.ink,4);line(X,-5,-13,5,13,C.amber,3);X.restore();
    X.save();X.translate(19,0);X.rotate(-.25);line(X,0,-2,30,-2,'#8d99a2',5);poly(X,[[28,-8],[43,-2],[28,4]],'#d0d6dc',C.ink,2);X.restore();X.restore();return true;
  }
  function drawEnemy(ctx){
    if(ctx.zoneI!==PARKING||!ctx.e||ctx.e.boss)return typeof prev.drawEnemy==='function'?prev.drawEnemy(ctx):false;
    const seed=hash(ctx.e.type),handled=(seed%4===0)?drawWarden(ctx,ctx.e,seed):drawLauncher(ctx,ctx.e,seed);
    document.documentElement.dataset.cwlParkingEnemy='pass';return handled;
  }
  function afterEntities(ctx){
    if(ctx.zoneI!==PARKING){if(typeof prev.afterEntities==='function')prev.afterEntities(ctx);return}
    if(typeof prev.afterEntities==='function')prev.afterEntities(ctx);
    const {X,W,H,G,time}=ctx;X.save();let haze=X.createLinearGradient(0,G-100,0,H);haze.addColorStop(0,'rgba(86,180,210,0)');haze.addColorStop(1,'rgba(74,119,143,.13)');X.fillStyle=haze;X.fillRect(0,G-100,W,H-G+100);X.globalAlpha=.18;for(let i=0;i<10;i++){const x=(i*157+time*22)%(W+60)-30,y=G+25+(i%3)*24;line(X,x,y,x+18,y-3,'#dce8ef',2)}X.restore();
  }
  globalThis.__CWM_RENDER_HOOK={...prev,drawBg,drawEnemy,afterEntities};
  globalThis.CWM_V2_PARKING={build:BUILD,zone:PARKING,selfTest:()=>({ok:true,build:BUILD,zone:PARKING})};
})();

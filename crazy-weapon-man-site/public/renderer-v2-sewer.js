(()=>{
if(globalThis.__CWM_V2_SEWER_RENDERER)return;
globalThis.__CWM_V2_SEWER_RENDERER=true;
const BUILD='v2-sewer-alpha2-native-hook',SEWER=1,prev=globalThis.__CWM_RENDER_HOOK||{};
const C={ink:'#10101a',steel:'#41536a',hi:'#70869c',cyan:'#62e8ff',mag:'#d34da5',acid:'#a7ff3f',gold:'#ffd35b'};
function rr(X,x,y,w,h,r,f,s=C.ink,l=4){X.beginPath();X.roundRect(x,y,w,h,r);X.fillStyle=f;X.fill();if(s){X.strokeStyle=s;X.lineWidth=l;X.stroke()}}
function ln(X,a,b,c,d,col,w=5){X.strokeStyle=col;X.lineWidth=w;X.lineCap='round';X.beginPath();X.moveTo(a,b);X.lineTo(c,d);X.stroke()}
function pipe(X,x,y,w,h){rr(X,x,y,w,h,16,C.steel,C.ink,7);X.globalAlpha=.28;rr(X,x+6,y+5,w-12,Math.max(5,h*.2),8,C.hi,null,0);X.globalAlpha=1;for(let p=x+42;p<x+w-10;p+=92){rr(X,p,y-6,13,h+12,5,'#2a3445',C.ink,4)}}
function grate(X,x,y,r){X.save();X.translate(x,y);X.fillStyle='#192230';X.strokeStyle=C.ink;X.lineWidth=9;X.beginPath();X.arc(0,0,r,0,Math.PI*2);X.fill();X.stroke();X.strokeStyle='#4c5c70';X.lineWidth=5;for(let i=-3;i<=3;i++){X.beginPath();X.moveTo(i*r*.2,-r*.75);X.lineTo(i*r*.2,r*.75);X.stroke()}X.restore()}
function fall(X,t,x,y,w,h){let g=X.createLinearGradient(x,y,x+w,y);g.addColorStop(0,'#35a53d');g.addColorStop(.5,C.acid);g.addColorStop(1,'#38ba43');X.save();X.shadowBlur=20;X.shadowColor='#65ff42';X.fillStyle=g;X.beginPath();X.moveTo(x,y);for(let q=0;q<=w;q+=12)X.lineTo(x+q,y+Math.sin(t*3+q*.11)*6);X.lineTo(x+w,y+h);X.lineTo(x,y+h);X.closePath();X.fill();X.restore()}
function plat(X,p){X.fillStyle=C.ink;X.fillRect(p.x-4,p.y-4,p.w+8,p.h+9);let g=X.createLinearGradient(0,p.y,0,p.y+p.h);g.addColorStop(0,'#738499');g.addColorStop(1,'#303a4b');X.fillStyle=g;X.fillRect(p.x,p.y,p.w,p.h);X.fillStyle='#20242d';X.fillRect(p.x,p.y+p.h-8,p.w,8);for(let x=p.x;x<p.x+p.w;x+=28){X.fillStyle=((x-p.x)/28|0)%2?'#20242d':C.gold;X.beginPath();X.moveTo(x,p.y+p.h-8);X.lineTo(Math.min(p.x+p.w,x+14),p.y+p.h-8);X.lineTo(Math.min(p.x+p.w,x+25),p.y+p.h);X.lineTo(Math.min(p.x+p.w,x+11),p.y+p.h);X.closePath();X.fill()}}
function drawBg(ctx){
 if(ctx.zoneI!==SEWER)return typeof prev.drawBg==='function'?prev.drawBg(ctx):false;
 const {X,W,H,G,time,platforms,mapScene}=ctx;X.save();
 let sky=X.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#101626');sky.addColorStop(.58,'#1d2d43');sky.addColorStop(1,'#0d2b31');X.fillStyle=sky;X.fillRect(0,0,W,H);
 X.globalAlpha=.75;for(let y=12;y<G;y+=42){for(let x=((y/42|0)%2?-42:0);x<W+84;x+=84){X.fillStyle=(x+y)%3?'#293548':'#344156';X.fillRect(x,y,79,37);X.strokeStyle='#111827';X.lineWidth=3;X.strokeRect(x,y,79,37)}}X.globalAlpha=1;
 X.fillStyle='#141c28';X.strokeStyle=C.ink;X.lineWidth=14;X.beginPath();X.arc(W/2,285,190,Math.PI,0);X.lineTo(W/2+190,510);X.lineTo(W/2-190,510);X.closePath();X.fill();X.stroke();
 X.strokeStyle='#3b4b61';X.lineWidth=17;X.beginPath();X.arc(W/2,285,147,Math.PI,0);X.stroke();
 pipe(X,-70,88,480,55);pipe(X,900,70,450,50);pipe(X,115,245,275,40);
 grate(X,165,176,60);grate(X,1110,240,84);
 rr(X,60,250,155,112,28,'#222d3c',C.ink,9);grate(X,138,304,48);fall(X,time,92,343,92,G-343);
 rr(X,1030,255,160,112,28,'#222d3c',C.ink,9);grate(X,1110,310,50);fall(X,time,1070,350,85,G-350);
 rr(X,W/2-132,52,264,62,12,'#26283a',C.ink,7);X.fillStyle=C.gold;X.font='1000 20px system-ui';X.textAlign='center';X.fillText('MUNICIPAL COMPLIANCE SEWER',W/2,86);
 for(const [x,y,c] of [[460,85,C.cyan],[780,85,C.mag]]){X.shadowBlur=24;X.shadowColor=c;X.fillStyle=c;X.beginPath();X.arc(x,y,10,0,Math.PI*2);X.fill();X.shadowBlur=0}
 X.textAlign='left';X.globalAlpha=.74;X.font='1000 29px system-ui';X.strokeStyle=C.ink;X.lineWidth=7;X.strokeText('COMPLY?',92,335);X.fillStyle=C.mag;X.fillText('COMPLY?',92,335);X.strokeText('NO REFUNDS',865,337);X.fillStyle=C.acid;X.fillText('NO REFUNDS',865,337);X.globalAlpha=1;
 X.fillStyle='#172127';X.fillRect(0,G,W,H-G);let sludge=X.createLinearGradient(0,G-10,0,H);sludge.addColorStop(0,'#b7ff45');sludge.addColorStop(.3,'#53d340');sludge.addColorStop(1,'#225b35');X.fillStyle=sludge;X.fillRect(0,G-10,W,H-G+10);
 if(mapScene?.water){X.globalAlpha=.5;X.fillStyle='#5de54b';X.fillRect(mapScene.water.x,G-13,mapScene.water.w,H-G+13);X.globalAlpha=1}
 for(const p of platforms||[])if(!p.disabled)plat(X,p);
 X.strokeStyle='#e8ffa0';X.lineWidth=3;X.globalAlpha=.7;for(let x=-20;x<W+30;x+=46){let y=G-3+Math.sin(time*3+x*.05)*3;X.beginPath();X.moveTo(x,y);X.quadraticCurveTo(x+12,y-7,x+24,y);X.quadraticCurveTo(x+35,y+5,x+46,y);X.stroke()}X.globalAlpha=1;
 X.fillStyle='#07111bcc';X.strokeStyle='#72ebff99';X.lineWidth=2;X.beginPath();X.roundRect(W-222,12,208,30,8);X.fill();X.stroke();X.fillStyle='#9df6ff';X.textAlign='center';X.font='900 10px ui-monospace,monospace';X.fillText('V2 SEWER • NATIVE HOOK',W-118,31);
 X.restore();globalThis.__CWM_V2_LAST_DRAW={build:BUILD,zone:ctx.zoneI,at:Date.now()};return true;
}
function afterEntities(ctx){
 if(ctx.zoneI!==SEWER){if(typeof prev.afterEntities==='function')prev.afterEntities(ctx);return}
 const {X,W,H,G,time}=ctx;X.save();X.globalAlpha=.27;X.strokeStyle='#111722';X.lineWidth=8;for(const x of [42,W-46])for(let i=0;i<10;i++){let y=i*58+Math.sin(time*1.4+i)*4;X.beginPath();X.ellipse(x,y,8,15,i%2?0:Math.PI/2,0,Math.PI*2);X.stroke()}let g=X.createLinearGradient(0,G-120,0,H);g.addColorStop(0,'rgba(120,255,70,0)');g.addColorStop(1,'rgba(120,255,70,.11)');X.fillStyle=g;X.fillRect(0,G-120,W,H-G+120);X.restore()
}
globalThis.__CWM_RENDER_HOOK={...prev,drawBg,afterEntities};
globalThis.CWM_V2_RENDERER={build:BUILD,zone:'Disco Sewer of Compliance',nativeBridge:globalThis.__CWM_NATIVE_RENDER_BRIDGE||'waiting'};
console.info('CWM v2 sewer renderer armed',globalThis.CWM_V2_RENDERER);
})();
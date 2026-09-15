(()=>{
if(globalThis.__CWM_SEWER_LAYERS_V3)return;
globalThis.__CWM_SEWER_LAYERS_V3=true;
const BUILD='v3-sewer-layers-alpha1',SEWER=1,prev=globalThis.__CWM_RENDER_HOOK||{};
const TAU=Math.PI*2;
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function rr(X,x,y,w,h,r,fill,stroke=null,lw=2){X.beginPath();X.roundRect(x,y,w,h,r);if(fill){X.fillStyle=fill;X.fill()}if(stroke){X.strokeStyle=stroke;X.lineWidth=lw;X.stroke()}}
function backPipes(X,W){
  X.save();X.globalAlpha=.26;X.strokeStyle='#050811';X.lineCap='round';
  for(const [y,w] of [[150,16],[205,10],[404,14]]){X.lineWidth=w;X.beginPath();X.moveTo(-30,y);X.bezierCurveTo(W*.25,y-25,W*.67,y+34,W+30,y-8);X.stroke()}
  X.globalAlpha=.18;X.strokeStyle='#78dff3';X.lineWidth=2;for(const y of [145,200]){X.beginPath();X.moveTo(0,y);X.lineTo(W,y+18);X.stroke()}
  X.restore();
}
function rearCatwalk(X,W,G){
  X.save();X.globalAlpha=.22;X.fillStyle='#0a0f18';X.fillRect(0,G-188,W,9);X.strokeStyle='#25354b';X.lineWidth=4;X.beginPath();X.moveTo(0,G-197);X.lineTo(W,G-197);X.stroke();
  for(let x=18;x<W;x+=76){X.fillRect(x,G-197,7,45);X.beginPath();X.moveTo(x+3,G-197);X.lineTo(x+45,G-155);X.stroke()}
  X.restore();
}
function wallDecals(X,W,G){
  X.save();X.globalAlpha=.22;X.font='900 12px ui-monospace,monospace';X.fillStyle='#8aa2bc';
  const a=[['FLOW 17-B',55,118],['BIOHAZARD WAIVER',W-214,151],['PIPE TAX',360,G-155],['DO NOT LICK',W-330,G-115]];
  for(const [s,x,y] of a)X.fillText(s,x,y);
  X.globalAlpha=.17;X.strokeStyle='#d155a7';X.lineWidth=3;X.beginPath();X.arc(W*.38,300,24,.2,5.7);X.stroke();X.beginPath();X.moveTo(W*.38-18,300);X.lineTo(W*.38+18,300);X.stroke();
  X.restore();
}
function backMist(X,W,G,time){
  X.save();X.globalCompositeOperation='screen';
  for(let i=0;i<5;i++){
    const x=(i+.5)*W/5+Math.sin(time*.22+i*1.9)*35,y=G-65-Math.sin(time*.31+i)*28;
    const r=72+i*8,g=X.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(87,255,94,.07)');g.addColorStop(1,'rgba(87,255,94,0)');X.fillStyle=g;X.beginPath();X.arc(x,y,r,0,TAU);X.fill();
  }
  X.restore();
}
function lamps(X,W,time){
  X.save();for(const [i,x,c] of [[0,310,'#5ee9ff'],[1,W-310,'#ff57c8']]){const pulse=.72+.18*Math.sin(time*2.3+i*2);X.globalAlpha=pulse;X.shadowColor=c;X.shadowBlur=28;rr(X,x-28,22,56,14,7,'#182635','#070a11',3);X.fillStyle=c;X.fillRect(x-18,27,36,4)}X.restore();
}
function drips(X,W,G,time){
  X.save();X.strokeStyle='#81ff4a';X.lineCap='round';for(let i=0;i<13;i++){const x=(i*97+43)%W,base=54+(i%4)*68,len=12+(i*11)%27;X.globalAlpha=.18+.13*Math.sin(time*1.7+i);X.lineWidth=2+(i%3);X.beginPath();X.moveTo(x,base);X.lineTo(x,base+len);X.stroke();if((i+Math.floor(time*2))%5===0){X.fillStyle='#a8ff68';X.beginPath();X.arc(x,base+len+8+(time*28%18),2.1,0,TAU);X.fill()}}X.restore();
}
function slimeBubbles(X,W,G,time){
  X.save();for(let i=0;i<14;i++){const x=(i*113+70)%W,r=2+(i%4),phase=(time*.23+i*.137)%1,y=G+22+phase*46;X.globalAlpha=.14*(1-phase);X.fillStyle=i%3?'#d9ff77':'#69ffcf';X.beginPath();X.arc(x,y,r,0,TAU);X.fill()}X.restore();
}
function floorReflection(X,W,G,time){
  X.save();X.globalCompositeOperation='screen';const g=X.createLinearGradient(0,G-2,0,G+55);g.addColorStop(0,'rgba(196,255,98,.18)');g.addColorStop(1,'rgba(196,255,98,0)');X.fillStyle=g;X.fillRect(0,G-2,W,60);X.globalAlpha=.10;X.strokeStyle='#b6ff6a';X.lineWidth=2;for(let i=0;i<7;i++){const y=G+8+i*7,off=Math.sin(time*1.5+i)*18;X.beginPath();X.moveTo(W*.28+off,y);X.lineTo(W*.72-off,y);X.stroke()}X.restore();
}
function drawBg(ctx){
  const handled=typeof prev.drawBg==='function'?prev.drawBg(ctx):false;
  if(ctx.zoneI!==SEWER)return handled;
  const {X,W,G,time}=ctx;X.save();
  backPipes(X,W);rearCatwalk(X,W,G);wallDecals(X,W,G);backMist(X,W,G,time);lamps(X,W,time);drips(X,W,G,time);floorReflection(X,W,G,time);slimeBubbles(X,W,G,time);
  X.restore();globalThis.__CWM_SEWER_LAYERS_LAST={build:BUILD,at:Date.now()};return true;
}
function foregroundMachinery(X,W,G,time){
  X.save();X.globalAlpha=.9;
  for(const side of [0,1]){const x=side?W-34:34;X.fillStyle='#080c14';X.strokeStyle='#202b3a';X.lineWidth=5;X.beginPath();X.roundRect(x-42,G-190,84,245,22);X.fill();X.stroke();X.fillStyle='#152130';for(let y=G-160;y<G+30;y+=34)X.fillRect(x-24,y,48,8);X.strokeStyle=side?'#5d254f':'#214d58';X.lineWidth=3;X.beginPath();X.moveTo(x,G-182);X.lineTo(x+Math.sin(time*.8+(side?1:0))*8,G+34);X.stroke()}
  X.restore();
}
function chain(X,x,time,phase){
  X.save();X.strokeStyle='#070b12';X.lineWidth=7;X.globalAlpha=.85;for(let i=0;i<7;i++){const y=-14+i*30,dx=Math.sin(time*.72+phase+i*.45)*5;X.beginPath();X.ellipse(x+dx,y,7,13,i%2?0:Math.PI/2,0,TAU);X.stroke()}X.restore();
}
function spores(X,W,H,G,time){
  X.save();X.globalCompositeOperation='screen';for(let i=0;i<20;i++){const x=(i*71+Math.sin(i*9.1)*130+W)%W,phase=(time*(.055+(i%4)*.009)+i*.083)%1,y=G-phase*(G-70);X.globalAlpha=.10+.10*(1-phase);X.fillStyle=i%4===0?'#ff66d4':'#8bff65';X.beginPath();X.arc(x,y,1.2+(i%3)*.7,0,TAU);X.fill()}X.restore();
}
function foregroundFog(X,W,H,G,time){
  X.save();const g=X.createLinearGradient(0,G-70,0,H);g.addColorStop(0,'rgba(60,255,115,0)');g.addColorStop(.55,'rgba(60,255,115,.035)');g.addColorStop(1,'rgba(16,40,28,.24)');X.fillStyle=g;X.fillRect(0,G-70,W,H-G+70);
  X.globalAlpha=.08;X.fillStyle='#a4ff74';for(let i=0;i<5;i++){const x=(i*270+time*18)% (W+260)-130;X.beginPath();X.ellipse(x,G+34,150,26,0,0,TAU);X.fill()}X.restore();
}
function vignette(X,W,H){X.save();const g=X.createRadialGradient(W*.5,H*.48,H*.18,W*.5,H*.48,H*.78);g.addColorStop(.56,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,4,11,.34)');X.fillStyle=g;X.fillRect(0,0,W,H);X.restore()}
function afterEntities(ctx){
  if(typeof prev.afterEntities==='function')prev.afterEntities(ctx);
  if(ctx.zoneI!==SEWER)return;
  const {X,W,H,G,time}=ctx;X.save();foregroundMachinery(X,W,G,time);chain(X,82,time,0);chain(X,W-96,time,2.4);spores(X,W,H,G,time);foregroundFog(X,W,H,G,time);vignette(X,W,H);X.restore();
}
globalThis.__CWM_RENDER_HOOK={...prev,drawBg,afterEntities};
globalThis.CWM_SEWER_LAYERS_V3={build:BUILD,zone:'Disco Sewer of Compliance'};
console.info('CWM sewer depth layers armed',globalThis.CWM_SEWER_LAYERS_V3);
})();

(()=>{
  if(globalThis.__CWM_V2_SEWER_RENDERER)return;
  globalThis.__CWM_V2_SEWER_RENDERER=true;

  const BUILD='v2-sewer-alpha1';
  const SEWER_ZONE=1;
  const C={
    ink:'#10101a', ink2:'#181827', wall:'#263146', wall2:'#34415a', steel:'#41536a', steelHi:'#70869c',
    purple:'#6b2f7d', magenta:'#d34da5', cyan:'#62e8ff', acid:'#a7ff3f', acid2:'#51d93e', acidDark:'#294c2f',
    warm:'#ffd35b', rust:'#8f5e48', fog:'#90e7e2'
  };

  function rr(x,y,w,h,r,fill,stroke=C.ink,lw=4){
    X.beginPath();X.roundRect(x,y,w,h,r);X.fillStyle=fill;X.fill();
    if(stroke){X.strokeStyle=stroke;X.lineWidth=lw;X.stroke()}
  }
  function line(x1,y1,x2,y2,col,w=5){X.strokeStyle=col;X.lineWidth=w;X.lineCap='round';X.beginPath();X.moveTo(x1,y1);X.lineTo(x2,y2);X.stroke()}
  function pipe(x,y,w,h,col=C.steel,hi=C.steelHi){
    rr(x,y,w,h,Math.min(18,h*.34),col,C.ink,7);
    X.globalAlpha=.34;rr(x+6,y+5,w-12,Math.max(5,h*.22),Math.min(9,h*.2),hi,null,0);X.globalAlpha=1;
    for(let px=x+42;px<x+w-15;px+=92){rr(px,y-7,13,h+14,5,'#2b3447',C.ink,4);line(px+4,y,px+4,y+h,'#667991',2)}
  }
  function lamp(x,y,col=C.cyan){
    X.save();X.shadowBlur=26;X.shadowColor=col;X.fillStyle=col;X.beginPath();X.arc(x,y,10,0,Math.PI*2);X.fill();X.shadowBlur=0;
    X.fillStyle='#dffaff';X.beginPath();X.arc(x-2,y-2,4,0,Math.PI*2);X.fill();X.restore();
  }
  function grate(cx,cy,r){
    X.save();X.translate(cx,cy);X.fillStyle='#1b2230';X.strokeStyle=C.ink;X.lineWidth=9;X.beginPath();X.arc(0,0,r,0,Math.PI*2);X.fill();X.stroke();
    X.strokeStyle='#49566c';X.lineWidth=5;for(let i=-3;i<=3;i++){X.beginPath();X.moveTo(i*r*.2,-r*.78);X.lineTo(i*r*.2,r*.78);X.stroke()}
    X.beginPath();X.arc(0,0,r*.68,0,Math.PI*2);X.stroke();X.restore();
  }
  function brickWall(){
    X.fillStyle='#20293a';X.fillRect(0,0,W,G);
    X.globalAlpha=.62;
    for(let y=16;y<G;y+=42){
      const off=((y/42)|0)%2?42:0;
      for(let x=-off;x<W+90;x+=84){
        X.fillStyle=((x+y)/42)%3<1?'#2b3549':'#263044';
        X.fillRect(x,y,79,37);
        X.strokeStyle='#121826';X.lineWidth=3;X.strokeRect(x,y,79,37);
        X.globalAlpha=.12;X.fillStyle='#93a9be';X.fillRect(x+5,y+5,52,4);X.globalAlpha=.62;
      }
    }
    X.globalAlpha=1;
  }
  function toxicFall(x,y,w,h){
    const grad=X.createLinearGradient(x,y,x+w,y);grad.addColorStop(0,'#39a93f');grad.addColorStop(.46,C.acid);grad.addColorStop(.7,'#e6ff79');grad.addColorStop(1,'#42c13f');
    X.save();X.shadowBlur=20;X.shadowColor='#6dff3d';X.fillStyle=grad;X.beginPath();
    X.moveTo(x,y);for(let xx=0;xx<=w;xx+=12){X.lineTo(x+xx,y+Math.sin(time*3+xx*.11)*7)}
    X.lineTo(x+w,y+h);for(let xx=w;xx>=0;xx-=14){X.lineTo(x+xx,y+h+Math.sin(time*4+xx*.13)*5)}X.closePath();X.fill();X.shadowBlur=0;
    X.globalAlpha=.5;X.fillStyle='#ecffad';for(let i=0;i<5;i++){const sx=x+12+i*(w-24)/4+Math.sin(time*2+i)*5;X.fillRect(sx,y,3,h)}X.restore();
  }
  function graffiti(x,y,text,col,rot=-.05,size=28){
    X.save();X.translate(x,y);X.rotate(rot);X.globalAlpha=.72;X.font=`1000 ${size}px system-ui`;X.lineJoin='round';X.strokeStyle=C.ink;X.lineWidth=7;X.strokeText(text,0,0);X.fillStyle=col;X.fillText(text,0,0);X.restore();
  }
  function sewerFar(){
    const sky=X.createLinearGradient(0,0,0,G);sky.addColorStop(0,'#111626');sky.addColorStop(.56,'#1c293d');sky.addColorStop(1,'#112e32');X.fillStyle=sky;X.fillRect(0,0,W,H);
    brickWall();
    X.save();X.globalAlpha=.78;X.fillStyle='#171d2a';X.strokeStyle=C.ink;X.lineWidth=13;X.beginPath();X.arc(620,272,184,Math.PI,0);X.lineTo(804,505);X.lineTo(436,505);X.closePath();X.fill();X.stroke();
    X.strokeStyle='#39465d';X.lineWidth=16;X.beginPath();X.arc(620,272,143,Math.PI,0);X.stroke();
    X.strokeStyle='#20293a';X.lineWidth=7;X.beginPath();X.arc(620,272,107,Math.PI,0);X.stroke();X.restore();
    X.save();X.globalAlpha=.55;pipe(-90,90,510,55,'#303a50','#65778a');pipe(895,68,520,48,'#30384b','#5e7184');pipe(120,246,260,38,'#2c3748','#617689');X.restore();
    grate(1110,240,85);grate(165,175,60);
    graffiti(92,335,'COMPLY?',C.magenta,-.09,31);graffiti(870,335,'NO REFUNDS',C.acid,.045,23);
    X.globalAlpha=.18;X.fillStyle='#6b3e83';for(let i=0;i<7;i++)X.fillRect(40+i*198,355+(i%2)*36,126,18);X.globalAlpha=1;
  }
  function sewerMid(){
    pipe(-36,390,410,78,'#405063','#71859a');pipe(888,382,430,84,'#3b4d63','#6e8297');
    rr(62,250,150,112,28,'#222c3c',C.ink,9);grate(137,305,48);toxicFall(93,342,91,G-342);
    rr(1033,258,158,108,28,'#242d3e',C.ink,9);grate(1112,309,50);toxicFall(1071,348,84,G-348);
    rr(505,55,226,58,12,'#27273a',C.ink,7);X.fillStyle=C.warm;X.font='1000 20px system-ui';X.textAlign='center';X.fillText('MUNICIPAL COMPLIANCE SEWER',618,87);X.textAlign='left';
    lamp(470,84,C.cyan);lamp(768,84,C.magenta);
    for(const [x,y,c] of [[294,120,C.magenta],[842,145,C.cyan],[355,332,C.acid],[775,302,C.warm]]){
      rr(x,y,78,48,8,'#1f2838',C.ink,5);X.globalAlpha=.65;X.fillStyle=c;X.fillRect(x+13,y+14,52,6);X.fillRect(x+13,y+27,34,5);X.globalAlpha=1;
    }
    X.fillStyle='#65d342';X.globalAlpha=.5;for(let i=0;i<13;i++){let x=20+i*101+Math.sin(i*4)*16,h=8+(i%4)*8;X.beginPath();X.roundRect(x,440,25,h,8);X.fill()}X.globalAlpha=1;
  }
  function drawSludgeFloor(){
    const baseY=G-9;
    X.fillStyle='#182027';X.fillRect(0,G,W,H-G);
    X.strokeStyle=C.ink;X.lineWidth=9;X.beginPath();X.moveTo(0,G);X.lineTo(W,G);X.stroke();
    const g=X.createLinearGradient(0,baseY,0,H);g.addColorStop(0,'#b4ff45');g.addColorStop(.28,'#57d23f');g.addColorStop(1,'#235e35');X.fillStyle=g;X.fillRect(0,baseY,W,H-baseY);
    X.save();X.globalAlpha=.72;X.strokeStyle='#e6ff98';X.lineWidth=3;for(let x=-20;x<W+30;x+=45){const yy=baseY+6+Math.sin(time*3.1+x*.05)*3;X.beginPath();X.moveTo(x,yy);X.quadraticCurveTo(x+12,yy-7,x+24,yy);X.quadraticCurveTo(x+34,yy+5,x+45,yy);X.stroke()}X.restore();
    X.globalAlpha=.45;X.fillStyle='#dfff93';for(let i=0;i<15;i++){const x=(i*97+time*(8+i%3)*10)%(W+40)-20,y=G+15+(i%3)*14,r=2+(i%4);X.beginPath();X.arc(x,y,r,0,Math.PI*2);X.fill()}X.globalAlpha=1;
  }
  function platformV2(p){
    const y=p.y,w=p.w,h=p.h;
    X.fillStyle=C.ink;X.beginPath();X.roundRect(p.x-4,y-4,w+8,h+10,5);X.fill();
    const grad=X.createLinearGradient(0,y,0,y+h);grad.addColorStop(0,'#718095');grad.addColorStop(.22,'#4c5b70');grad.addColorStop(1,'#313b4c');X.fillStyle=grad;X.beginPath();X.roundRect(p.x,y,w,h,3);X.fill();
    X.fillStyle='#8fa0b0';X.globalAlpha=.42;X.fillRect(p.x+6,y+5,w-12,4);X.globalAlpha=1;
    X.fillStyle='#20242d';X.fillRect(p.x,y+h-8,w,8);for(let sx=p.x;sx<p.x+w;sx+=28){X.fillStyle=(Math.floor((sx-p.x)/28)%2===0)?C.warm:'#20242d';X.beginPath();X.moveTo(sx,y+h-8);X.lineTo(Math.min(p.x+w,sx+14),y+h-8);X.lineTo(Math.min(p.x+w,sx+25),y+h);X.lineTo(Math.min(p.x+w,sx+11),y+h);X.closePath();X.fill()}
    if(((p.x+p.y)|0)%3===0){X.fillStyle='#6ee347';X.globalAlpha=.72;for(let i=18;i<w-12;i+=62){const d=7+((i+p.x)|0)%14;X.beginPath();X.roundRect(p.x+i,y-2,22,6+d,5);X.fill()}X.globalAlpha=1}
  }
  function sewerWorld(){
    drawSludgeFloor();
    if(typeof mapScene!=='undefined'&&mapScene?.water){const wv=mapScene.water;X.globalAlpha=.5;X.fillStyle='#5be54b';X.fillRect(wv.x,G-13,wv.w,H-G+13);X.globalAlpha=1}
    if(typeof platforms!=='undefined')for(const p of platforms)if(!p.disabled)platformV2(p);
    X.globalAlpha=.82;for(const x of [248,934]){line(x,414,x,566,'#263142',9);line(x+30,414,x+30,566,'#263142',9);for(let y=427;y<562;y+=26)line(x,y,x+30,y,'#72869a',5)}X.globalAlpha=1;
  }
  function drawSewerBackground(){X.save();sewerFar();sewerMid();sewerWorld();X.restore()}
  function sewerForeground(){
    X.save();X.globalAlpha=.44;X.strokeStyle='#1a1d28';X.lineWidth=8;
    for(const x of [42,W-46]){for(let i=0;i<11;i++){const y=-10+i*57+Math.sin(time*1.4+i)*4;X.beginPath();X.ellipse(x+Math.sin(time+i)*3,y,8,15,i%2?0:Math.PI/2,0,Math.PI*2);X.stroke()}}
    X.globalAlpha=.30;pipe(-120,560,390,72,'#202a38','#46596d');pipe(W-255,580,390,78,'#202936','#43576a');
    const glow=X.createLinearGradient(0,G-120,0,H);glow.addColorStop(0,'rgba(120,255,70,0)');glow.addColorStop(1,'rgba(120,255,70,.13)');X.fillStyle=glow;X.fillRect(0,G-120,W,H-G+120);X.restore();
  }

  const baseDrawBg=drawBg;
  drawBg=function(){if(typeof zoneI!=='undefined'&&zoneI===SEWER_ZONE){drawSewerBackground();return}return baseDrawBg()};

  const baseCinematic=typeof drawCinematicPass==='function'?drawCinematicPass:null;
  if(baseCinematic){drawCinematicPass=function(){if(typeof zoneI!=='undefined'&&zoneI===SEWER_ZONE)sewerForeground();return baseCinematic()}}

  const baseAmbient=typeof drawAmbientMotes==='function'?drawAmbientMotes:null;
  if(baseAmbient){drawAmbientMotes=function(){baseAmbient();if(zoneI!==SEWER_ZONE)return;X.save();for(let i=0;i<12;i++){const x=(i*127+time*(10+(i%4)*3))%(W+60)-30;const y=G-35-((i*53+time*(14+i%3))%270);X.globalAlpha=.07+(i%3)*.025;X.fillStyle=i%2?C.acid:C.cyan;X.beginPath();X.arc(x,y,2+(i%4),0,Math.PI*2);X.fill()}X.restore()}}

  globalThis.CWM_V2_RENDERER={build:BUILD,zone:'Disco Sewer of Compliance',layers:['far','mid','world','entities (existing)','foreground','cinematic']};
  console.info('Crazy Weapon Man v2 renderer shell loaded',globalThis.CWM_V2_RENDERER);
})();

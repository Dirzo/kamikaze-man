(()=>{
  if(globalThis.__CWM_FRENZY_VISUAL_HOTFIX)return;
  globalThis.__CWM_FRENZY_VISUAL_HOTFIX=true;
  if(typeof playerDraw!=='function'||typeof estimateDPS!=='function'||typeof curW!=='function')return;

  function tierFor(dps){
    const n=Number(dps)||0;
    if(n<1000)return 0;
    return Math.max(1,Math.floor(Math.log10(n))-2);
  }
  function bodyAngle(w){
    const atk=pl.at>0?1-pl.at/Math.max(.01,pl.atMax):0,step=pl.combo%3;
    let body=0;
    if(atk&&w.type==='sword'){if(step===1)body=-.18+atk*.3;else if(step===2)body=.17-atk*.3;else body=-.24+atk*.42}
    else if(atk&&w.type==='dagger')body=-.08+atk*.12;
    else if(atk&&w.type==='nunchucks')body=Math.sin(atk*Math.PI*2)*.10;
    else if(atk&&w.type==='katana')body=-.22+atk*.36;
    else if(atk&&w.type==='shuriken')body=-.05;
    else if(atk&&w.type==='hammer')body=-.2+atk*.32;
    else if(atk&&w.type==='staff')body=-.1;
    else if(atk&&(w.type==='bow'||w.type==='wand'))body=w.type==='bow'?-.09:-.06;
    return body;
  }
  function frenzyScale(tier){
    if(tier===1)return 2.35;
    if(tier===2)return 3.00;
    if(tier===3)return 3.75;
    if(tier===4)return 4.60;
    return Math.min(6.8,4.60+(tier-4)*.60);
  }
  function drawHugeFrenzyHead(){
    if(!gameStarted||over)return;
    const w=curW(),dps=Math.max(0,estimateDPS(w)),tier=tierFor(dps);
    if(!tier)return;
    const run=pl.on?Math.min(1,Math.abs(pl.vx)/190):0;
    const cy=time*12,bob=Math.abs(Math.sin(cy))*2*run,breathe=1+Math.sin(time*5.2)*.018;
    const body=bodyAngle(w),hs=frenzyScale(tier)*(1+Math.sin(time*(4+tier))*.018);
    const twitch=.45+tier*.38;
    const col=tier>=4?'#ff4df3':tier>=3?'#ff455f':tier>=2?'#ff9f43':'#fff176';
    const headArmor=pl.armors?.head||null;

    X.save();
    X.translate(pl.x+17,pl.y+25+bob);
    X.scale(pl.dir*1.08,breathe*1.08);
    X.rotate(body);
    X.translate(Math.sin(time*(19+tier*2))*twitch,-19+Math.cos(time*(15+tier))*twitch*.35);
    X.rotate(Math.sin(time*(8+tier*1.7))*.025*tier);
    X.scale(hs,hs);

    X.globalAlpha=.18;X.strokeStyle=col;X.lineWidth=1.15;
    for(let i=0;i<Math.min(5,tier+1);i++){X.beginPath();X.arc(0,0,12+i*3.7+Math.sin(time*6+i)*.8,0,Math.PI*2);X.stroke()}
    X.globalAlpha=1;

    X.fillStyle='#ead9c7';X.beginPath();X.arc(0,0,9.8,0,Math.PI*2);X.fill();

    if(headArmor){
      X.fillStyle=headArmor.col;X.shadowColor=headArmor.col;X.shadowBlur=5+tier*2;
      X.beginPath();X.arc(0,-2,11.2,Math.PI,Math.PI*2);X.lineTo(10,1);X.lineTo(8,5.5);X.lineTo(3.8,.2);X.lineTo(-3.8,.2);X.lineTo(-8,5.5);X.lineTo(-10,1);X.closePath();X.fill();X.shadowBlur=0;
    }else{
      X.fillStyle=tier>=4?`hsl(${(time*150)%360} 95% 45%)`:'#1c2330';
      const lift=12+tier*6;
      X.beginPath();
      X.moveTo(-10,-5);X.lineTo(-15,-12-lift*.38);X.lineTo(-10,-10-lift*.22);X.lineTo(-7,-17-lift*.55);X.lineTo(-2,-11-lift*.18);X.lineTo(2,-20-lift*.66);X.lineTo(6,-11-lift*.18);X.lineTo(11,-17-lift*.52);X.lineTo(15,-9-lift*.28);X.lineTo(11,-3);X.closePath();X.fill();
    }

    X.strokeStyle='#222936';X.lineWidth=1.8+Math.min(2,tier*.35);
    X.beginPath();X.moveTo(-8,-6.5);X.lineTo(-.5,-9.3-tier*.25);X.moveTo(1,-4.3);X.lineTo(8,-7.4-tier*.18);X.stroke();

    X.fillStyle='#fff';
    X.beginPath();X.ellipse(-4.1,-2.2,2.9+tier*.18,3.6+tier*.30,.22,0,Math.PI*2);X.fill();
    X.beginPath();X.ellipse(4.2,-.2,2.2+tier*.20,2.0+tier*.18,-.20,0,Math.PI*2);X.fill();

    if(tier>=1){
      X.strokeStyle='#d83350';X.lineWidth=.5+.08*tier;
      for(let i=0;i<3+tier;i++){
        X.beginPath();X.moveTo(-7+i*.45,-.4+i*.22);X.lineTo(-5.2+i*.28,-2.0-i*.25);X.stroke();
        X.beginPath();X.moveTo(6.8-i*.38,.8-i*.14);X.lineTo(5.0-i*.22,.1+i*.16);X.stroke();
      }
    }

    X.fillStyle=tier>=3?'#ff2448':'#10151d';
    const pr=Math.max(.32,.85-tier*.08);
    X.beginPath();X.arc(-4.4,-2.8-tier*.14,pr,0,Math.PI*2);X.fill();
    X.beginPath();X.arc(4.55,.25,Math.max(.28,pr*.68),0,Math.PI*2);X.fill();

    X.strokeStyle='#671629';X.lineWidth=2.1+Math.min(2.6,tier*.42);
    X.beginPath();X.moveTo(-6.4,4.9);X.quadraticCurveTo(1.2,12.8+tier*1.9,8.7,3.4-tier*.18);X.stroke();
    X.fillStyle='#fff5e8';X.globalAlpha=.92;
    for(let i=0;i<5;i++){X.fillRect(-2.7+i*1.45,6.4+i*.38,1.0,1.7)}
    X.globalAlpha=1;

    if(tier>=2){
      X.fillStyle='#ff6688';X.globalAlpha=.78;X.beginPath();X.ellipse(1.5,8.5+tier*.35,4+tier*.42,1.6+tier*.22,.02,0,Math.PI);X.fill();X.globalAlpha=1;
    }
    if(tier>=3){
      X.fillStyle='#ff708b';X.beginPath();X.arc(-6.4,1.7,1.3+tier*.12,0,Math.PI*2);X.arc(6.2,2.1,1.2+tier*.1,0,Math.PI*2);X.fill();
    }
    X.restore();
  }

  const previousPlayerDraw=playerDraw;
  playerDraw=function(){
    previousPlayerDraw();
    drawHugeFrenzyHead();
  };

  const style=document.createElement('style');
  style.textContent='[data-frenzy-chip]{font-size:11px!important;box-shadow:0 0 14px #fff17655!important}';
  document.head.appendChild(style);
})();
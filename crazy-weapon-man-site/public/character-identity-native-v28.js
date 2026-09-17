(()=>{
  if(globalThis.__CWM_CHARACTER_NATIVE_V28)return;
  globalThis.__CWM_CHARACTER_NATIVE_V28=true;
  const S={outfitDraws:0,hpDraws:0,lastType:'',lastRole:'',lastColor:'',error:null};
  const clamp01=n=>Math.max(0,Math.min(1,n));
  const valid=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:'#8fefff';
  function mix(a,b,t=.5){a=valid(a);b=valid(b);t=clamp01(t);const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16),ac=[A>>16,A>>8&255,A&255],bc=[B>>16,B>>8&255,B&255],v=ac.map((x,i)=>Math.round(x+(bc[i]-x)*t));return '#'+((v[0]<<16)|(v[1]<<8)|v[2]).toString(16).padStart(6,'0')}
  function role(w){const t=w?.type||'sword';if(t==='hammer')return'JUGGERNAUT';if(t==='staff'||t==='wand')return'ARCANE';if(t==='bow')return'RANGER';if(t==='dagger'||t==='shuriken')return'ASSASSIN';if(t==='katana'||t==='nunchucks')return'RONIN';return'VANGUARD'}
  function palette(w){const a=valid(w?.element?.col||w?.col),q=rarityRank(w);return{a,q,d:mix(a,'#05080d',.73),m:mix(a,'#243141',.48),l:mix(a,'#ffffff',.34)}}
  function bodyPose(w){const run=pl.on?Math.min(1,Math.abs(pl.vx||0)/190):0,bob=Math.abs(Math.sin(time*12))*2*run,atk=pl.at>0?1-pl.at/Math.max(.01,pl.atMax):0;let rot=0;if(atk&&w.type==='hammer')rot=-.20+atk*.32;else if(atk&&w.type==='katana')rot=-.22+atk*.36;else if(atk&&w.type==='dagger')rot=-.08+atk*.12;else if(atk&&(w.type==='wand'||w.type==='staff'))rot=-.08;else if(atk&&w.type==='bow')rot=-.07;return{bob,rot}}
  function drawOutfit(){
    if(!gameStarted)return;const w=curW();if(!w)return;const p=palette(w),r=role(w),po=bodyPose(w);S.outfitDraws++;S.lastType=w.type;S.lastRole=r;S.lastColor=p.a;
    X.save();X.translate(pl.x+pl.w/2,pl.y+25+po.bob);X.scale((pl.dir||1)*1.14,1.14);X.rotate(po.rot);if(pl.inv>0&&Math.floor(time*18)%2===0)X.globalAlpha=.58;X.lineJoin='round';X.shadowColor=p.a;X.shadowBlur=p.q>=4?8+p.q:3;
    if(r==='ARCANE'){
      X.fillStyle=p.d;X.beginPath();X.moveTo(-15,-16);X.lineTo(15,-16);X.lineTo(20,19);X.lineTo(8,13);X.lineTo(1,26);X.lineTo(-7,14);X.lineTo(-20,19);X.closePath();X.fill();
      X.fillStyle=p.m;X.beginPath();X.moveTo(-14,-15);X.lineTo(0,-24);X.lineTo(14,-15);X.lineTo(8,-5);X.lineTo(-8,-5);X.closePath();X.fill();
      X.strokeStyle=p.a;X.lineWidth=3.2;X.globalAlpha=.96;X.beginPath();X.moveTo(0,-10);X.lineTo(0,17);X.moveTo(-11,1);X.lineTo(11,1);X.stroke();X.fillStyle=p.l;X.beginPath();X.arc(0,2,4.5,0,Math.PI*2);X.fill();
      X.fillStyle=p.a;X.globalAlpha=.68;X.beginPath();X.moveTo(-15,-12);X.lineTo(-23,3);X.lineTo(-16,14);X.closePath();X.fill();X.beginPath();X.moveTo(15,-12);X.lineTo(23,3);X.lineTo(16,14);X.closePath();X.fill();
    }else if(r==='JUGGERNAUT'){
      X.fillStyle=p.d;X.beginPath();X.roundRect(-15,-15,30,32,5);X.fill();X.fillStyle=p.m;X.beginPath();X.roundRect(-22,-13,11,14,3);X.roundRect(11,-13,11,14,3);X.fill();X.fillStyle=p.a;X.fillRect(-13,6,26,6);X.fillRect(-3,-12,6,20);X.fillStyle='#10151d';X.fillRect(-11,12,22,5);
    }else if(r==='RANGER'){
      X.fillStyle=p.d;X.beginPath();X.roundRect(-14,-15,28,31,6);X.fill();X.fillStyle=p.m;X.beginPath();X.moveTo(-15,-13);X.lineTo(-23,5);X.lineTo(-10,18);X.lineTo(-5,-7);X.closePath();X.fill();X.strokeStyle=p.a;X.lineWidth=4;X.beginPath();X.moveTo(-12,-12);X.lineTo(11,14);X.stroke();for(let i=0;i<3;i++){X.lineWidth=2;X.beginPath();X.moveTo(12,-11+i*4);X.lineTo(19,-17+i*4);X.stroke()}
    }else if(r==='ASSASSIN'){
      X.fillStyle=mix(p.d,'#000000',.28);X.beginPath();X.roundRect(-14,-15,28,31,4);X.fill();X.fillStyle=p.a;X.globalAlpha=.82;X.beginPath();X.moveTo(-15,-11);X.lineTo(12,10);X.lineTo(8,16);X.lineTo(-17,-5);X.closePath();X.fill();X.fillRect(-15,6,30,5);X.fillStyle=p.l;X.globalAlpha=.92;X.fillRect(-7,-19,14,3);
    }else if(r==='RONIN'){
      X.fillStyle=p.d;X.beginPath();X.moveTo(-15,-15);X.lineTo(15,-15);X.lineTo(12,13);X.lineTo(4,18);X.lineTo(0,11);X.lineTo(-5,18);X.lineTo(-12,13);X.closePath();X.fill();X.fillStyle=p.a;X.fillRect(-16,4,32,6);X.strokeStyle=p.l;X.lineWidth=2.6;X.beginPath();X.moveTo(-10,-8);X.lineTo(0,2);X.lineTo(10,-8);X.stroke();
    }else{
      X.fillStyle=p.d;X.beginPath();X.roundRect(-15,-15,30,31,6);X.fill();X.fillStyle=p.m;X.beginPath();X.moveTo(-15,-11);X.lineTo(-22,-5);X.lineTo(-16,4);X.lineTo(-10,-2);X.closePath();X.moveTo(15,-11);X.lineTo(22,-5);X.lineTo(16,4);X.lineTo(10,-2);X.closePath();X.fill();X.fillStyle=p.a;X.fillRect(-3,-12,6,26);X.fillRect(-13,6,26,5);
    }
    X.globalAlpha=1;X.shadowBlur=0;if(p.q>=5){X.strokeStyle=p.a;X.globalAlpha=.30+.08*Math.sin(time*8);X.lineWidth=2.5;X.beginPath();X.ellipse(0,0,23,30,0,0,Math.PI*2);X.stroke()}X.restore();
  }
  let hpLag=1;
  function drawHp(){
    if(!gameStarted)return;const w=curW();if(!w)return;const p=palette(w),max=Math.max(1,pl.max),hp=clamp01(pl.hp/max),W=122,H=10,cx=pl.x+pl.w/2,y=pl.y-58;hpLag+=(hp-hpLag)*.12;hpLag=clamp01(hpLag);S.hpDraws++;
    X.save();X.textAlign='center';X.textBaseline='bottom';X.font='1000 8px system-ui';X.lineWidth=3;X.strokeStyle='#000';X.strokeText('CRAZY WEAPON MAN',cx,y-5);X.fillStyle='#fff';X.fillText('CRAZY WEAPON MAN',cx,y-5);
    X.fillStyle='rgba(2,5,9,.96)';X.fillRect(cx-W/2-3,y-2,W+6,H+4);X.strokeStyle=p.a;X.lineWidth=2;X.strokeRect(cx-W/2-2,y-1,W+4,H+2);X.fillStyle='#611522';X.fillRect(cx-W/2,y,W*hpLag,H);const g=X.createLinearGradient(cx-W/2,y,cx+W/2,y);g.addColorStop(0,'#ff2447');g.addColorStop(1,hp<.3?'#ff6a3d':'#ff8d9a');X.fillStyle=g;X.fillRect(cx-W/2,y,W*hp,H);X.fillStyle='#fff';X.globalAlpha=.28;X.fillRect(cx-W/2,y,W*hp,2);X.globalAlpha=1;
    const label=`${Math.max(0,Math.ceil(pl.hp))} / ${Math.ceil(max)}  •  ${rLabel(w)}`;X.font='1000 7px system-ui';X.textBaseline='top';X.strokeStyle='#000';X.lineWidth=3;X.strokeText(label,cx,y+H+3);X.fillStyle=p.l;X.fillText(label,cx,y+H+3);X.restore();
  }
  function rLabel(w){return role(w)+' '+String(w.type||'weapon').toUpperCase()}
  const basePlayerDraw=playerDraw;playerDraw=function(){const out=basePlayerDraw();try{drawOutfit()}catch(e){if(!S.error)S.error=String(e)}return out};
  const baseDraw=draw;draw=function(){const out=baseDraw();try{drawHp()}catch(e){if(!S.error)S.error=String(e)}return out};
  globalThis.CWM_CHARACTER_NATIVE_V28={state:()=>({...S}),roleFor:role};
  const stamp=document.createElement('div');stamp.id='cwmV28BuildStamp';stamp.textContent='CHARACTER RUNTIME V28';stamp.style.cssText='margin:5px auto 0;text-align:center;color:#5f7891;font:900 8px/1 system-ui;letter-spacing:.12em';document.getElementById('startGame')?.insertAdjacentElement('afterend',stamp);
  if(new URLSearchParams(location.search).get('runtimeV28Smoke')==='1'){
    setTimeout(()=>{try{window.__KM_DEBUG?.start();window.__KM_DEBUG?.equip('wand','Legendary') }catch(e){S.error=String(e)}},180);
    setTimeout(()=>{const ok=S.outfitDraws>5&&S.hpDraws>5&&S.lastType==='wand'&&!S.error;document.documentElement.dataset.cwmCharacterV28=ok?'pass':'fail';document.documentElement.dataset.cwmCharacterFrames=`${S.outfitDraws}/${S.hpDraws}`;document.documentElement.dataset.cwmCharacterRole=S.lastRole||'none';document.documentElement.dataset.cwmCharacterError=S.error||''},1200);
  }
})();
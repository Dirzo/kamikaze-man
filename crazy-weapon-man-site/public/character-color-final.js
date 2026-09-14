(()=>{
  const COLOR_KEY='crazyWeaponMan.characterColor.v1';
  const BUILD='0914-color-native-1';
  const validColor=()=>{
    try{
      const c=localStorage.getItem(COLOR_KEY)||'#566a84';
      return /^#[0-9A-Fa-f]{6}$/.test(c)?c:'#566a84';
    }catch(_){return '#566a84'}
  };
  const mix=(hex,amt)=>{
    const n=parseInt(hex.slice(1),16),t=amt<0?0:255,p=Math.abs(amt);
    const r=n>>16,g=n>>8&255,b=n&255;
    return '#'+((1<<24)+(Math.round((t-r)*p)+r<<16)+(Math.round((t-g)*p)+g<<8)+(Math.round((t-b)*p)+b)).toString(16).slice(1);
  };

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

  function drawSelectedOutfit(){
    if(typeof X==='undefined'||typeof pl==='undefined'||typeof curW!=='function'||!gameStarted)return;
    const c=validColor(),dark=mix(c,-.32),light=mix(c,.28),w=curW();
    const run=pl.on?Math.min(1,Math.abs(pl.vx)/190):0,cy=time*12,st=Math.sin(cy)*9*run,bob=Math.abs(Math.sin(cy))*2*run,breathe=1+Math.sin(time*5.2)*.018;
    const armored=!!pl.armors?.body;
    X.save();
    X.translate(pl.x+17,pl.y+25+bob);
    X.scale(pl.dir*1.08,breathe*1.08);
    X.rotate(bodyAngle(w));
    if(pl.inv>0&&Math.floor(time*18)%2===0)X.globalAlpha=.55;

    if(!armored){
      /* Opaque selected-color jacket: this intentionally replaces the old white/default torso. */
      X.fillStyle=c;X.strokeStyle=dark;X.lineWidth=1.6;
      X.beginPath();X.roundRect(-11,-14,22,29,7);X.fill();X.stroke();
      X.fillStyle=light;X.globalAlpha*=.58;X.fillRect(-7,-10,14,3);X.globalAlpha=Math.min(1,X.globalAlpha/.58);
      X.fillStyle=dark;X.globalAlpha*=.72;X.fillRect(-2,-13,4,27);X.globalAlpha=Math.min(1,X.globalAlpha/.72);
      /* Sleeves and lower outfit make the palette readable even behind large weapons. */
      X.fillStyle=c;X.beginPath();X.roundRect(-15,-9,6,18,3);X.roundRect(9,-9,6,18,3);X.fill();
      X.fillStyle=dark;X.beginPath();X.roundRect(-11+st*.18,12,8,16,3);X.roundRect(3-st*.18,12,8,16,3);X.fill();
      X.fillStyle=c;X.globalAlpha*=.82;X.beginPath();X.moveTo(-10,2);X.lineTo(-15,18+Math.sin(time*10)*2);X.lineTo(-2,12);X.lineTo(2,12);X.lineTo(15,18-Math.sin(time*10)*2);X.lineTo(10,2);X.closePath();X.fill();
    }else{
      /* Keep loot armor readable while preserving the player's chosen identity color. */
      X.globalAlpha*=.95;X.fillStyle=c;X.shadowColor=c;X.shadowBlur=5;
      X.fillRect(-2,-11,4,22);X.fillRect(-9,7,18,3);
      X.fillStyle=light;X.fillRect(-7,-8,14,2);X.shadowBlur=0;
    }
    X.restore();
  }

  if(typeof playerDraw==='function'&&!globalThis.__CWM_FINAL_CHARACTER_COLOR){
    globalThis.__CWM_FINAL_CHARACTER_COLOR=true;
    const base=playerDraw;
    playerDraw=function(){const r=base();drawSelectedOutfit();return r};
  }

  /* Tiny title-only build stamp so deployment vs cache problems are obvious. */
  const title=document.querySelector('.titleInner')||document.querySelector('.titleScreen')||document.body;
  if(title&&!document.getElementById('cwmBuildStamp')){
    const s=document.createElement('div');s.id='cwmBuildStamp';s.textContent='UI BUILD '+BUILD;
    s.style.cssText='margin:6px auto 0;color:#71849a;font:800 8px/1 system-ui;letter-spacing:.12em;text-align:center;opacity:.8';
    const start=document.getElementById('startGame');start?start.insertAdjacentElement('afterend',s):title.appendChild(s);
  }
  globalThis.__CWM_UI_BUILD=BUILD;
})();

(()=>{
  if(globalThis.__CWM_CHARACTER_HAIR_V29)return;
  globalThis.__CWM_CHARACTER_HAIR_V29=true;

  const S={hairDraws:0,lastType:'',lastColor:'',error:null};
  const valid=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c:'#dce7f2';
  function mix(a,b,t=.5){
    a=valid(a);b=valid(b);t=Math.max(0,Math.min(1,t));
    const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16),ac=[A>>16,A>>8&255,A&255],bc=[B>>16,B>>8&255,B&255];
    const v=ac.map((x,i)=>Math.round(x+(bc[i]-x)*t));
    return '#'+((v[0]<<16)|(v[1]<<8)|v[2]).toString(16).padStart(6,'0');
  }
  function bodyPose(w){
    const run=pl.on?Math.min(1,Math.abs(pl.vx||0)/190):0;
    const bob=Math.abs(Math.sin(time*12))*2*run;
    const atk=pl.at>0?1-pl.at/Math.max(.01,pl.atMax):0;
    const step=pl.combo%3;
    let body=0;
    if(atk&&w.type==='sword'){
      if(step===1)body=-.18+atk*.3;
      else if(step===2)body=.17-atk*.3;
      else body=-.24+atk*.42;
    }else if(atk&&w.type==='dagger')body=-.08+atk*.12;
    else if(atk&&w.type==='nunchucks')body=Math.sin(atk*Math.PI*2)*.10;
    else if(atk&&w.type==='katana')body=-.22+atk*.36;
    else if(atk&&w.type==='shuriken')body=-.05;
    else if(atk&&w.type==='hammer')body=-.2+atk*.32;
    else if(atk&&w.type==='staff')body=-.1;
    else if(atk&&w.type==='bow')body=-.09;
    else if(atk&&w.type==='wand')body=-.06;
    return{bob,body};
  }
  function drawHair(){
    if(!gameStarted)return false;
    const w=curW();if(!w)return false;
    const q=rarityRank(w),col=valid(w.col),dark=mix(col,'#080b11',.44),light=mix(col,'#ffffff',.34),p=bodyPose(w);
    S.hairDraws++;S.lastType=w.type||'';S.lastColor=col;
    X.save();
    X.translate(pl.x+17,pl.y+25+p.bob);
    X.scale(pl.dir||1,1);
    X.rotate(p.body);
    X.translate(0,-19);
    if(pl.inv>0&&Math.floor(time*18)%2===0)X.globalAlpha=.45;
    X.lineJoin='round';X.shadowColor=col;X.shadowBlur=q>=4?5+q:2;
    X.fillStyle=dark;
    X.beginPath();
    X.moveTo(-9,-5);
    X.lineTo(-13,-11);
    X.lineTo(-8,-9);
    X.lineTo(-5,-16);
    X.lineTo(-1,-10);
    X.lineTo(2,-18);
    X.lineTo(5,-10);
    X.lineTo(9,-15);
    X.lineTo(12,-9);
    X.lineTo(10,-4);
    X.lineTo(7,-7);
    X.lineTo(3,-5);
    X.lineTo(0,-7);
    X.lineTo(-4,-5);
    X.closePath();
    X.fill();
    X.fillStyle=col;X.globalAlpha*=.92;
    X.beginPath();
    X.moveTo(-7,-8);X.lineTo(-4,-14);X.lineTo(-2,-8);X.closePath();
    X.moveTo(-1,-8);X.lineTo(2,-16);X.lineTo(4,-8);X.closePath();
    X.moveTo(5,-8);X.lineTo(8,-13);X.lineTo(9,-7);X.closePath();
    X.fill();
    if(q>=4){X.fillStyle=light;X.globalAlpha*=.72;X.beginPath();X.moveTo(-4,-10);X.lineTo(-2,-14);X.lineTo(-1,-10);X.closePath();X.moveTo(3,-10);X.lineTo(5,-13);X.lineTo(6,-9);X.closePath();X.fill()}
    X.restore();
    return true;
  }

  const playerDraw0=playerDraw;
  playerDraw=function(){
    const r=playerDraw0();
    try{drawHair()}catch(e){if(!S.error)S.error=String(e)}
    return r;
  };

  globalThis.CWM_CHARACTER_HAIR_V29={state:()=>({...S}),drawHair};

  if(new URLSearchParams(location.search).get('characterV29Smoke')==='1'){
    setTimeout(()=>{try{window.__KM_DEBUG?.start?.();window.__KM_DEBUG?.equip?.('wand','Legendary')}catch(e){S.error=String(e)}},180);
    setTimeout(()=>{
      const root=document.documentElement,ok=S.hairDraws>0&&S.lastType==='wand'&&!S.error;
      root.dataset.cwmHairV29=ok?'pass':'fail';
      root.dataset.cwmHairFrames=String(S.hairDraws);
      root.dataset.cwmHairType=S.lastType||'none';
      root.dataset.cwmHairColor=S.lastColor||'none';
      root.dataset.cwmHairError=S.error||'';
      root.dataset.cwmOutfitOverlay='none';
    },1200);
  }
})();
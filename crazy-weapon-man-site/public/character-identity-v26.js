(()=>{
  if(globalThis.__CWM_CHARACTER_IDENTITY_V26)return;
  globalThis.__CWM_CHARACTER_IDENTITY_V26=true;

  const S={draws:0,hpDraws:0,outfitDraws:0,lastType:'',lastColor:'',hpLag:1};
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const hex=(c,f='#8fefff')=>/^#[0-9a-f]{6}$/i.test(c||'')?c:f;
  function mix(a,b,t=.5){
    a=hex(a,'#566a84');b=hex(b,'#101722');t=clamp(t);
    const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16),ar=A>>16,ag=A>>8&255,ab=A&255,br=B>>16,bg=B>>8&255,bb=B&255;
    const v=(Math.round(ar+(br-ar)*t)<<16)|(Math.round(ag+(bg-ag)*t)<<8)|Math.round(ab+(bb-ab)*t);
    return '#'+v.toString(16).padStart(6,'0');
  }
  function palette(w){
    const accent=hex(w?.element?.col||w?.col,'#8fefff'),q=typeof rarityRank==='function'?rarityRank(w):0;
    return{accent,q,dark:mix(accent,'#071019',.72),mid:mix(accent,'#172333',.48),light:mix(accent,'#ffffff',.34),glow:q>=5?accent:null};
  }
  function profile(w){
    const t=w?.type||'sword';
    if(t==='hammer')return{role:'juggernaut',label:'FORGE'};
    if(t==='staff'||t==='wand')return{role:'caster',label:'ARCANE'};
    if(t==='bow')return{role:'ranger',label:'RANGER'};
    if(t==='dagger'||t==='shuriken')return{role:'assassin',label:'SHADOW'};
    if(t==='katana'||t==='nunchucks')return{role:'martial',label:'RONIN'};
    return{role:'vanguard',label:'VANGUARD'};
  }
  function bodyPose(w){
    const run=pl.on?Math.min(1,Math.abs(pl.vx||0)/190):0,cy=(typeof time==='number'?time:0)*12,bob=Math.abs(Math.sin(cy))*2*run;
    const atk=pl.at>0?1-pl.at/Math.max(.01,pl.atMax||.01):0,step=(pl.combo||0)%3;let body=0;
    if(atk&&w.type==='sword'){if(step===1)body=-.18+atk*.3;else if(step===2)body=.17-atk*.3;else body=-.24+atk*.42}
    else if(atk&&w.type==='dagger')body=-.08+atk*.12;
    else if(atk&&w.type==='nunchucks')body=Math.sin(atk*Math.PI*2)*.10;
    else if(atk&&w.type==='katana')body=-.22+atk*.36;
    else if(atk&&w.type==='shuriken')body=-.05;
    else if(atk&&w.type==='hammer')body=-.2+atk*.32;
    else if(atk&&w.type==='staff')body=-.1;
    else if(atk&&w.type==='bow')body=-.09;
    else if(atk&&w.type==='wand')body=-.06;
    return{bob,body};
  }
  function trim(p,q){
    X.strokeStyle=p.light;X.lineWidth=q>=7?2.2:1.35;X.globalAlpha=q>=4?.78:.48;
    X.beginPath();X.moveTo(-8,-11);X.lineTo(8,-11);X.moveTo(-9,7);X.lineTo(9,7);X.stroke();
    if(q>=6){X.shadowColor=p.accent;X.shadowBlur=9+q;X.globalAlpha=.55;X.strokeRect(-10,-13,20,27);X.shadowBlur=0}
    X.globalAlpha=1;
  }
  function drawOutfit(){
    if(typeof X==='undefined'||typeof pl==='undefined'||typeof curW!=='function')return;
    const w=curW();if(!w)return;const p=palette(w),pr=profile(w),pose=bodyPose(w),dir=pl.dir||1;
    S.lastType=w.type||'';S.lastColor=p.accent;S.outfitDraws++;
    X.save();X.translate(pl.x+17,pl.y+25+pose.bob);X.scale(dir*1.08,1.08);X.rotate(pose.body);
    X.shadowColor=p.glow||'transparent';X.shadowBlur=p.glow?6+p.q*.7:0;

    if(pr.role==='juggernaut'){
      X.fillStyle=p.dark;X.beginPath();X.roundRect(-12,-14,24,28,5);X.fill();
      X.fillStyle=p.mid;X.beginPath();X.roundRect(-17,-12,8,11,3);X.roundRect(9,-12,8,11,3);X.fill();
      X.fillStyle=p.accent;X.globalAlpha=.78;X.fillRect(-10,7,20,5);X.fillRect(-2,-11,4,18);X.globalAlpha=1;
      X.fillStyle='#121820';X.fillRect(-8,11,16,4);trim(p,p.q);
    }else if(pr.role==='caster'){
      X.fillStyle=p.dark;X.beginPath();X.moveTo(-11,-13);X.lineTo(11,-13);X.lineTo(16,18);X.lineTo(4,13);X.lineTo(0,22);X.lineTo(-5,13);X.lineTo(-16,18);X.closePath();X.fill();
      X.fillStyle=p.mid;X.beginPath();X.moveTo(-9,-13);X.lineTo(0,-19);X.lineTo(9,-13);X.lineTo(6,-6);X.lineTo(-6,-6);X.closePath();X.fill();
      X.strokeStyle=p.accent;X.lineWidth=2;X.globalAlpha=.8;X.beginPath();X.moveTo(0,-8);X.lineTo(0,13);X.moveTo(-8,1);X.lineTo(8,1);X.stroke();X.globalAlpha=1;
      X.fillStyle=p.light;X.beginPath();X.arc(0,2,3.2,0,Math.PI*2);X.fill();trim(p,p.q);
    }else if(pr.role==='ranger'){
      X.fillStyle=p.dark;X.beginPath();X.roundRect(-11,-14,22,28,6);X.fill();
      X.fillStyle=p.mid;X.beginPath();X.moveTo(-13,-13);X.lineTo(-18,5);X.lineTo(-8,14);X.lineTo(-4,-8);X.closePath();X.fill();
      X.strokeStyle=p.accent;X.lineWidth=3;X.globalAlpha=.72;X.beginPath();X.moveTo(-9,-12);X.lineTo(8,12);X.stroke();
      X.globalAlpha=.9;X.lineWidth=2;for(let i=0;i<3;i++){X.beginPath();X.moveTo(9,-10+i*4);X.lineTo(15,-15+i*4);X.stroke()}X.globalAlpha=1;trim(p,p.q);
    }else if(pr.role==='assassin'){
      X.fillStyle=mix(p.dark,'#000000',.18);X.beginPath();X.roundRect(-11,-14,22,28,4);X.fill();
      X.fillStyle=p.accent;X.globalAlpha=.68;X.beginPath();X.moveTo(-11,-10);X.lineTo(9,9);X.lineTo(6,13);X.lineTo(-13,-6);X.closePath();X.fill();
      X.globalAlpha=.86;X.fillRect(-12,7,24,4);X.globalAlpha=1;
      X.strokeStyle=p.light;X.lineWidth=1.4;X.beginPath();X.moveTo(-7,-9);X.lineTo(8,6);X.stroke();trim(p,p.q);
    }else if(pr.role==='martial'){
      X.fillStyle=p.dark;X.beginPath();X.moveTo(-12,-13);X.lineTo(12,-13);X.lineTo(10,12);X.lineTo(3,15);X.lineTo(0,10);X.lineTo(-4,15);X.lineTo(-10,12);X.closePath();X.fill();
      X.fillStyle=p.accent;X.globalAlpha=.82;X.fillRect(-13,5,26,5);X.globalAlpha=1;
      X.strokeStyle=p.light;X.lineWidth=2;X.beginPath();X.moveTo(-9,-8);X.lineTo(0,1);X.lineTo(9,-8);X.stroke();trim(p,p.q);
    }else{
      X.fillStyle=p.dark;X.beginPath();X.roundRect(-12,-14,24,28,6);X.fill();
      X.fillStyle=p.mid;X.beginPath();X.moveTo(-12,-10);X.lineTo(-17,-5);X.lineTo(-13,3);X.lineTo(-9,-2);X.closePath();X.moveTo(12,-10);X.lineTo(17,-5);X.lineTo(13,3);X.lineTo(9,-2);X.closePath();X.fill();
      X.fillStyle=p.accent;X.globalAlpha=.72;X.fillRect(-2,-12,4,24);X.fillRect(-10,7,20,4);X.globalAlpha=1;trim(p,p.q);
    }

    if(p.q>=8){X.strokeStyle=p.accent;X.shadowColor=p.accent;X.shadowBlur=13;X.globalAlpha=.25+.08*Math.sin((typeof time==='number'?time:0)*7);X.lineWidth=3;X.strokeRect(-13,-15,26,31);X.globalAlpha=1;X.shadowBlur=0}
    X.restore();
  }
  function drawHp(){
    if(typeof X==='undefined'||typeof pl==='undefined'||typeof curW!=='function')return;
    const max=Math.max(1,Number(pl.max||pl.maxHp||1)),hp=clamp(Number(pl.hp||0)/max),w=curW(),p=palette(w),W=92,H=7,cx=pl.x+pl.w/2,y=pl.y-37;
    S.hpLag+=((hp)-S.hpLag)*.08;S.hpLag=clamp(S.hpLag);S.hpDraws++;
    X.save();X.textAlign='center';X.textBaseline='bottom';X.font='900 6px system-ui';X.fillStyle='#eef7ff';X.shadowColor='#000';X.shadowBlur=4;X.fillText('CRAZY WEAPON MAN',cx,y-3);X.shadowBlur=0;
    X.fillStyle='rgba(3,7,12,.88)';X.fillRect(cx-W/2-2,y-1,W+4,H+2);X.strokeStyle=p.accent;X.globalAlpha=.72;X.lineWidth=1;X.strokeRect(cx-W/2-1.5,y-.5,W+3,H+1);X.globalAlpha=1;
    X.fillStyle='#6b1b2d';X.globalAlpha=.72;X.fillRect(cx-W/2,y,W*S.hpLag,H);X.globalAlpha=1;
    const grad=X.createLinearGradient(cx-W/2,y,cx+W/2,y);grad.addColorStop(0,'#ff304f');grad.addColorStop(1,hp<.28?'#ff6b48':'#ff8792');X.fillStyle=grad;X.fillRect(cx-W/2,y,W*hp,H);
    X.fillStyle='#fff';X.globalAlpha=.24;X.fillRect(cx-W/2,y,W*hp,1);X.globalAlpha=1;
    X.font='900 6px system-ui';X.textBaseline='top';X.fillStyle='#d8e6ef';X.fillText(`${Math.max(0,Math.ceil(Number(pl.hp)||0))} / ${Math.ceil(max)}`,cx,y+H+2);
    X.restore();
  }

  const baseDraw=typeof playerDraw==='function'?playerDraw:null;
  if(baseDraw){
    playerDraw=function(){const r=baseDraw();try{drawOutfit();drawHp();S.draws++}catch(e){if(!S.err){S.err=String(e);console.warn('Character identity v26 fallback',e)}}return r};
  }

  function selfTest(){
    const roles=['hammer','staff','bow','dagger','katana','sword'].map(t=>profile({type:t}).role);
    return{ok:!!baseDraw&&new Set(roles).size===6,roles,draws:S.draws,hpDraws:S.hpDraws,outfitDraws:S.outfitDraws,lastType:S.lastType,lastColor:S.lastColor,error:S.err||null};
  }
  globalThis.CWM_CHARACTER_IDENTITY_V26={state:()=>({...S}),profile,palette,selfTest};

  if(new URLSearchParams(location.search).get('characterIdentitySmoke')==='1'){
    setTimeout(()=>{
      try{
        const api=globalThis.__KM_DEBUG||globalThis.KM_DEBUG;api?.equip?.('hammer','Legendary');
        if(typeof pl!=='undefined'){pl.hp=Math.max(1,Math.round((pl.max||pl.maxHp||100)*.62));pl.inv=0}
        drawOutfit();drawHp();S.draws++;
        const root=document.documentElement,t=selfTest(),hammer=profile({type:'hammer'}).role,staff=profile({type:'staff'}).role,bow=profile({type:'bow'}).role;
        root.dataset.cwmCharacterIdentityProof=(t.ok&&S.draws>0&&S.hpDraws>0&&S.outfitDraws>0)?'pass':'fail';
        root.dataset.cwmCharacterOutfits=[hammer,staff,bow].join('/');root.dataset.cwmCharacterDraws=String(S.draws);root.dataset.cwmCharacterType=S.lastType||'none';
      }catch(e){const r=document.documentElement;r.dataset.cwmCharacterIdentityProof='fail';r.dataset.cwmCharacterIdentityError=(e?.name||'Error')+':'+(e?.message||String(e)).replace(/\s+/g,' ').slice(0,100)}
    },1300);
  }
})();

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
    const accent=hex(w?.element?.col||w?.col,'#8fefff'),q=typeof rarityRank==='function'?rarityRank(w):Number(w?.__rarityRank||0);
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
  function bodyPose(w,P){
    const run=P.on?Math.min(1,Math.abs(P.vx||0)/190):0,cy=(typeof time==='number'?time:0)*12,bob=Math.abs(Math.sin(cy))*2*run;
    const atk=P.at>0?1-P.at/Math.max(.01,P.atMax||.01):0,step=(P.combo||0)%3;let body=0;
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
  function trim(X,p,q){
    X.strokeStyle=p.light;X.lineWidth=q>=7?2.2:1.35;X.globalAlpha=q>=4?.78:.48;
    X.beginPath();X.moveTo(-8,-11);X.lineTo(8,-11);X.moveTo(-9,7);X.lineTo(9,7);X.stroke();
    if(q>=6){X.shadowColor=p.accent;X.shadowBlur=9+q;X.globalAlpha=.55;X.strokeRect(-10,-13,20,27);X.shadowBlur=0}
    X.globalAlpha=1;
  }
  function drawOutfit(P=(typeof pl!=='undefined'?pl:null),w=(typeof curW==='function'?curW():null),X=(typeof globalThis.X!=='undefined'?globalThis.X:null)){
    if(!X||!P||!w)return false;const p=palette(w),pr=profile(w),pose=bodyPose(w,P),dir=P.dir||1;
    S.lastType=w.type||'';S.lastColor=p.accent;S.outfitDraws++;
    X.save();X.translate(P.x+17,P.y+25+pose.bob);X.scale(dir*1.08,1.08);X.rotate(pose.body);
    X.shadowColor=p.glow||'transparent';X.shadowBlur=p.glow?6+p.q*.7:0;
    if(pr.role==='juggernaut'){
      X.fillStyle=p.dark;X.beginPath();X.roundRect(-12,-14,24,28,5);X.fill();X.fillStyle=p.mid;X.beginPath();X.roundRect(-17,-12,8,11,3);X.roundRect(9,-12,8,11,3);X.fill();X.fillStyle=p.accent;X.globalAlpha=.78;X.fillRect(-10,7,20,5);X.fillRect(-2,-11,4,18);X.globalAlpha=1;X.fillStyle='#121820';X.fillRect(-8,11,16,4);trim(X,p,p.q);
    }else if(pr.role==='caster'){
      X.fillStyle=p.dark;X.beginPath();X.moveTo(-11,-13);X.lineTo(11,-13);X.lineTo(16,18);X.lineTo(4,13);X.lineTo(0,22);X.lineTo(-5,13);X.lineTo(-16,18);X.closePath();X.fill();X.fillStyle=p.mid;X.beginPath();X.moveTo(-9,-13);X.lineTo(0,-19);X.lineTo(9,-13);X.lineTo(6,-6);X.lineTo(-6,-6);X.closePath();X.fill();X.strokeStyle=p.accent;X.lineWidth=2;X.globalAlpha=.8;X.beginPath();X.moveTo(0,-8);X.lineTo(0,13);X.moveTo(-8,1);X.lineTo(8,1);X.stroke();X.globalAlpha=1;X.fillStyle=p.light;X.beginPath();X.arc(0,2,3.2,0,Math.PI*2);X.fill();trim(X,p,p.q);
    }else if(pr.role==='ranger'){
      X.fillStyle=p.dark;X.beginPath();X.roundRect(-11,-14,22,28,6);X.fill();X.fillStyle=p.mid;X.beginPath();X.moveTo(-13,-13);X.lineTo(-18,5);X.lineTo(-8,14);X.lineTo(-4,-8);X.closePath();X.fill();X.strokeStyle=p.accent;X.lineWidth=3;X.globalAlpha=.72;X.beginPath();X.moveTo(-9,-12);X.lineTo(8,12);X.stroke();X.globalAlpha=.9;X.lineWidth=2;for(let i=0;i<3;i++){X.beginPath();X.moveTo(9,-10+i*4);X.lineTo(15,-15+i*4);X.stroke()}X.globalAlpha=1;trim(X,p,p.q);
    }else if(pr.role==='assassin'){
      X.fillStyle=mix(p.dark,'#000000',.18);X.beginPath();X.roundRect(-11,-14,22,28,4);X.fill();X.fillStyle=p.accent;X.globalAlpha=.68;X.beginPath();X.moveTo(-11,-10);X.lineTo(9,9);X.lineTo(6,13);X.lineTo(-13,-6);X.closePath();X.fill();X.globalAlpha=.86;X.fillRect(-12,7,24,4);X.globalAlpha=1;X.strokeStyle=p.light;X.lineWidth=1.4;X.beginPath();X.moveTo(-7,-9);X.lineTo(8,6);X.stroke();trim(X,p,p.q);
    }else if(pr.role==='martial'){
      X.fillStyle=p.dark;X.beginPath();X.moveTo(-12,-13);X.lineTo(12,-13);X.lineTo(10,12);X.lineTo(3,15);X.lineTo(0,10);X.lineTo(-4,15);X.lineTo(-10,12);X.closePath();X.fill();X.fillStyle=p.accent;X.globalAlpha=.82;X.fillRect(-13,5,26,5);X.globalAlpha=1;X.strokeStyle=p.light;X.lineWidth=2;X.beginPath();X.moveTo(-9,-8);X.lineTo(0,1);X.lineTo(9,-8);X.stroke();trim(X,p,p.q);
    }else{
      X.fillStyle=p.dark;X.beginPath();X.roundRect(-12,-14,24,28,6);X.fill();X.fillStyle=p.mid;X.beginPath();X.moveTo(-12,-10);X.lineTo(-17,-5);X.lineTo(-13,3);X.lineTo(-9,-2);X.closePath();X.moveTo(12,-10);X.lineTo(17,-5);X.lineTo(13,3);X.lineTo(9,-2);X.closePath();X.fill();X.fillStyle=p.accent;X.globalAlpha=.72;X.fillRect(-2,-12,4,24);X.fillRect(-10,7,20,4);X.globalAlpha=1;trim(X,p,p.q);
    }
    if(p.q>=8){X.strokeStyle=p.accent;X.shadowColor=p.accent;X.shadowBlur=13;X.globalAlpha=.25+.08*Math.sin((typeof time==='number'?time:0)*7);X.lineWidth=3;X.strokeRect(-13,-15,26,31);X.globalAlpha=1;X.shadowBlur=0}
    X.restore();return true;
  }
  function drawHp(P=(typeof pl!=='undefined'?pl:null),w=(typeof curW==='function'?curW():null),X=(typeof globalThis.X!=='undefined'?globalThis.X:null)){
    if(!X||!P||!w)return false;const max=Math.max(1,Number(P.max||P.maxHp||1)),hp=clamp(Number(P.hp||0)/max),p=palette(w),W=92,H=7,cx=P.x+(P.w||34)/2,y=P.y-37;
    S.hpLag+=((hp)-S.hpLag)*.08;S.hpLag=clamp(S.hpLag);S.hpDraws++;
    X.save();X.textAlign='center';X.textBaseline='bottom';X.font='900 6px system-ui';X.fillStyle='#eef7ff';X.shadowColor='#000';X.shadowBlur=4;X.fillText('CRAZY WEAPON MAN',cx,y-3);X.shadowBlur=0;X.fillStyle='rgba(3,7,12,.88)';X.fillRect(cx-W/2-2,y-1,W+4,H+2);X.strokeStyle=p.accent;X.globalAlpha=.72;X.lineWidth=1;X.strokeRect(cx-W/2-1.5,y-.5,W+3,H+1);X.globalAlpha=1;X.fillStyle='#6b1b2d';X.globalAlpha=.72;X.fillRect(cx-W/2,y,W*S.hpLag,H);X.globalAlpha=1;const grad=X.createLinearGradient(cx-W/2,y,cx+W/2,y);grad.addColorStop(0,'#ff304f');grad.addColorStop(1,hp<.28?'#ff6b48':'#ff8792');X.fillStyle=grad;X.fillRect(cx-W/2,y,W*hp,H);X.fillStyle='#fff';X.globalAlpha=.24;X.fillRect(cx-W/2,y,W*hp,1);X.globalAlpha=1;X.font='900 6px system-ui';X.textBaseline='top';X.fillStyle='#d8e6ef';X.fillText(`${Math.max(0,Math.ceil(Number(P.hp)||0))} / ${Math.ceil(max)}`,cx,y+H+2);X.restore();return true;
  }
  const baseDraw=typeof playerDraw==='function'?playerDraw:null;
  if(baseDraw){playerDraw=function(){const r=baseDraw();try{drawOutfit();drawHp();S.draws++}catch(e){if(!S.err){S.err=String(e);console.warn('Character identity v26 fallback',e)}}return r}}
  function selfTest(){const roles=['hammer','staff','bow','dagger','katana','sword'].map(t=>profile({type:t}).role);return{ok:!!baseDraw&&new Set(roles).size===6,roles,draws:S.draws,hpDraws:S.hpDraws,outfitDraws:S.outfitDraws,lastType:S.lastType,lastColor:S.lastColor,error:S.err||null}}
  globalThis.CWM_CHARACTER_IDENTITY_V26={state:()=>({...S}),profile,palette,selfTest,drawOutfit,drawHp};
  if(new URLSearchParams(location.search).get('characterIdentitySmoke')==='1'){
    setTimeout(()=>{try{
      let c=document.getElementById('cwmCharacterSmokeCanvas');if(!c){c=document.createElement('canvas');c.id='cwmCharacterSmokeCanvas';c.width=260;c.height=180;c.style.position='fixed';c.style.left='18px';c.style.bottom='18px';c.style.zIndex='99999';c.style.background='#08101a';document.body.appendChild(c)}
      const ctx=c.getContext('2d'),fakeP={x:105,y:92,w:34,h:50,hp:620,max:1000,dir:1,on:true,vx:0,at:0,atMax:.2,combo:0},fakeW={type:'hammer',col:'#ff9a45',__rarityRank:8,element:{col:'#ff9a45'}};
      const a=drawOutfit(fakeP,fakeW,ctx),h=drawHp(fakeP,fakeW,ctx);S.draws++;
      const root=document.documentElement,t=selfTest();root.dataset.cwmCharacterIdentityProof=(t.ok&&a&&h&&S.hpDraws>0&&S.outfitDraws>0)?'pass':'fail';root.dataset.cwmCharacterOutfits=[profile({type:'hammer'}).role,profile({type:'staff'}).role,profile({type:'bow'}).role].join('/');root.dataset.cwmCharacterDraws=String(S.draws);root.dataset.cwmCharacterType=S.lastType||'none';
    }catch(e){const r=document.documentElement;r.dataset.cwmCharacterIdentityProof='fail';r.dataset.cwmCharacterIdentityError=(e?.name||'Error')+':'+(e?.message||String(e)).replace(/\s+/g,' ').slice(0,100)}},1300)
  }
})();
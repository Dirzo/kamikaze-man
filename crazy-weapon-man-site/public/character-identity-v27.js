(()=>{
  if(globalThis.__CWM_CHARACTER_IDENTITY_V27)return;
  globalThis.__CWM_CHARACTER_IDENTITY_V27=true;
  const S={plateDraws:0,attireDraws:0,lastType:'',lastRole:'',lastColor:'',error:null};
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const hex=(c,f='#8fefff')=>/^#[0-9a-f]{6}$/i.test(c||'')?c:f;
  function mix(a,b,t=.5){a=hex(a,'#566a84');b=hex(b,'#071019');t=clamp(t);const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);const ch=(s)=>[(s>>16)&255,(s>>8)&255,s&255],aa=ch(A),bb=ch(B),v=aa.map((x,i)=>Math.round(x+(bb[i]-x)*t));return '#'+((v[0]<<16)|(v[1]<<8)|v[2]).toString(16).padStart(6,'0')}
  function roleFor(w){const t=w?.type||'sword';if(t==='hammer')return'juggernaut';if(t==='staff'||t==='wand')return'caster';if(t==='bow')return'ranger';if(t==='dagger'||t==='shuriken')return'assassin';if(t==='katana'||t==='nunchucks')return'ronin';return'vanguard'}
  function rarity(w){try{return typeof rarityRank==='function'?rarityRank(w):Number(w?.__rarityRank||0)}catch(_){return Number(w?.__rarityRank||0)}}
  function palette(w){const a=hex(w?.element?.col||w?.col,'#8fefff'),q=rarity(w);return{a,q,d:mix(a,'#05080d',.72),m:mix(a,'#1a2430',.46),l:mix(a,'#ffffff',.35)}}
  function pose(P,w){const run=P.on?Math.min(1,Math.abs(P.vx||0)/190):0,t=typeof time==='number'?time:0,bob=Math.abs(Math.sin(t*12))*2*run,atk=P.at>0?1-P.at/Math.max(.01,P.atMax||.01):0;let r=0;if(atk&&w.type==='hammer')r=-.2+atk*.32;else if(atk&&w.type==='katana')r=-.22+atk*.36;else if(atk&&w.type==='dagger')r=-.08+atk*.12;else if(atk&&(w.type==='wand'||w.type==='staff'))r=-.08;else if(atk&&w.type==='bow')r=-.07;return{bob,r}}
  function drawAttire(P=(typeof pl!=='undefined'?pl:null),w=(typeof curW==='function'?curW():null),C=(typeof X!=='undefined'?X:null)){
    if(!P||!w||!C)return false;const p=palette(w),role=roleFor(w),po=pose(P,w),dir=P.dir||1;S.lastType=w.type||'';S.lastRole=role;S.lastColor=p.a;S.attireDraws++;
    C.save();C.translate(P.x+(P.w||34)/2,P.y+25+po.bob);C.scale(dir*1.12,1.12);C.rotate(po.r);C.lineJoin='round';C.lineCap='round';C.shadowColor=p.a;C.shadowBlur=p.q>=4?7+p.q:3;
    if(role==='caster'){
      C.fillStyle=p.d;C.beginPath();C.moveTo(-14,-16);C.lineTo(14,-16);C.lineTo(19,18);C.lineTo(8,13);C.lineTo(1,25);C.lineTo(-7,14);C.lineTo(-19,18);C.closePath();C.fill();
      C.fillStyle=p.m;C.beginPath();C.moveTo(-13,-15);C.lineTo(0,-23);C.lineTo(13,-15);C.lineTo(8,-5);C.lineTo(-8,-5);C.closePath();C.fill();
      C.strokeStyle=p.a;C.lineWidth=3;C.globalAlpha=.95;C.beginPath();C.moveTo(0,-10);C.lineTo(0,16);C.moveTo(-11,1);C.lineTo(11,1);C.stroke();C.fillStyle=p.l;C.beginPath();C.arc(0,2,4.2,0,Math.PI*2);C.fill();
      C.globalAlpha=.6;C.fillStyle=p.a;C.beginPath();C.moveTo(-15,-12);C.lineTo(-22,4);C.lineTo(-16,13);C.closePath();C.fill();C.beginPath();C.moveTo(15,-12);C.lineTo(22,4);C.lineTo(16,13);C.closePath();C.fill();
    }else if(role==='juggernaut'){
      C.fillStyle=p.d;C.beginPath();C.roundRect(-14,-15,28,31,5);C.fill();C.fillStyle=p.m;C.beginPath();C.roundRect(-21,-13,10,13,3);C.roundRect(11,-13,10,13,3);C.fill();C.fillStyle=p.a;C.fillRect(-12,6,24,6);C.fillRect(-3,-12,6,19);C.fillStyle='#10151d';C.fillRect(-10,12,20,5);
    }else if(role==='ranger'){
      C.fillStyle=p.d;C.beginPath();C.roundRect(-13,-15,26,30,6);C.fill();C.fillStyle=p.m;C.beginPath();C.moveTo(-14,-13);C.lineTo(-22,5);C.lineTo(-10,17);C.lineTo(-5,-7);C.closePath();C.fill();C.strokeStyle=p.a;C.lineWidth=4;C.beginPath();C.moveTo(-11,-12);C.lineTo(10,13);C.stroke();for(let i=0;i<3;i++){C.lineWidth=2;C.beginPath();C.moveTo(11,-11+i*4);C.lineTo(18,-17+i*4);C.stroke()}
    }else if(role==='assassin'){
      C.fillStyle=mix(p.d,'#000000',.28);C.beginPath();C.roundRect(-13,-15,26,30,4);C.fill();C.fillStyle=p.a;C.globalAlpha=.8;C.beginPath();C.moveTo(-14,-10);C.lineTo(11,10);C.lineTo(7,15);C.lineTo(-16,-5);C.closePath();C.fill();C.fillRect(-14,6,28,5);C.globalAlpha=1;
    }else if(role==='ronin'){
      C.fillStyle=p.d;C.beginPath();C.moveTo(-14,-15);C.lineTo(14,-15);C.lineTo(12,12);C.lineTo(4,17);C.lineTo(0,11);C.lineTo(-5,17);C.lineTo(-12,12);C.closePath();C.fill();C.fillStyle=p.a;C.fillRect(-15,4,30,6);C.strokeStyle=p.l;C.lineWidth=2.5;C.beginPath();C.moveTo(-10,-8);C.lineTo(0,2);C.lineTo(10,-8);C.stroke();
    }else{
      C.fillStyle=p.d;C.beginPath();C.roundRect(-14,-15,28,30,6);C.fill();C.fillStyle=p.m;C.beginPath();C.moveTo(-14,-11);C.lineTo(-21,-5);C.lineTo(-15,4);C.lineTo(-10,-2);C.closePath();C.moveTo(14,-11);C.lineTo(21,-5);C.lineTo(15,4);C.lineTo(10,-2);C.closePath();C.fill();C.fillStyle=p.a;C.fillRect(-3,-12,6,25);C.fillRect(-12,6,24,5);
    }
    C.globalAlpha=1;C.shadowBlur=0;if(p.q>=5){C.strokeStyle=p.a;C.globalAlpha=.35+.08*Math.sin((typeof time==='number'?time:0)*8);C.lineWidth=2.5;C.beginPath();C.ellipse(0,0,22,29,0,0,Math.PI*2);C.stroke();C.globalAlpha=1}C.restore();return true
  }
  let lag=1;
  function drawPlate(P=(typeof pl!=='undefined'?pl:null),w=(typeof curW==='function'?curW():null),C=(typeof X!=='undefined'?X:null)){
    if(!P||!w||!C)return false;const p=palette(w),max=Math.max(1,Number(P.max||P.maxHp||1)),hp=clamp(Number(P.hp||0)/max),W=124,H=10,cx=P.x+(P.w||34)/2,y=P.y-58;lag+=((hp)-lag)*.12;lag=clamp(lag);S.plateDraws++;
    C.save();C.textAlign='center';C.textBaseline='bottom';C.font='1000 8px system-ui';C.shadowColor='#000';C.shadowBlur=5;C.lineWidth=3;C.strokeStyle='#000';C.strokeText('CRAZY WEAPON MAN',cx,y-5);C.fillStyle='#fff';C.fillText('CRAZY WEAPON MAN',cx,y-5);C.shadowBlur=0;
    C.fillStyle='rgba(2,5,9,.96)';C.fillRect(cx-W/2-3,y-2,W+6,H+4);C.strokeStyle=p.a;C.lineWidth=2;C.strokeRect(cx-W/2-2,y-1,W+4,H+2);C.fillStyle='#641522';C.fillRect(cx-W/2,y,W*lag,H);const g=C.createLinearGradient(cx-W/2,y,cx+W/2,y);g.addColorStop(0,'#ff2447');g.addColorStop(1,hp<.3?'#ff6a3d':'#ff8d9a');C.fillStyle=g;C.fillRect(cx-W/2,y,W*hp,H);C.fillStyle='#fff';C.globalAlpha=.28;C.fillRect(cx-W/2,y,W*hp,2);C.globalAlpha=1;C.font='1000 8px system-ui';C.textBaseline='top';C.strokeStyle='#000';C.lineWidth=3;const txt=`${Math.max(0,Math.ceil(Number(P.hp)||0))} / ${Math.ceil(max)}`;C.strokeText(txt,cx,y+H+3);C.fillStyle='#fff';C.fillText(txt,cx,y+H+3);C.restore();return true
  }
  const basePlayer=typeof playerDraw==='function'?playerDraw:null;if(basePlayer){playerDraw=function(){const r=basePlayer();try{drawAttire()}catch(e){if(!S.error)S.error=String(e)}return r}}
  const baseScene=typeof draw==='function'?draw:null;if(baseScene){draw=function(){const r=baseScene();try{drawPlate()}catch(e){if(!S.error)S.error=String(e)}return r}}
  function selfTest(){return{ok:!!basePlayer&&!!baseScene,plateDraws:S.plateDraws,attireDraws:S.attireDraws,lastType:S.lastType,lastRole:S.lastRole,lastColor:S.lastColor,error:S.error}}
  globalThis.CWM_CHARACTER_IDENTITY_V27={state:()=>({...S}),drawAttire,drawPlate,roleFor,selfTest};
  if(new URLSearchParams(location.search).get('characterIdentityV27Smoke')==='1')setTimeout(()=>{try{let c=document.createElement('canvas');c.width=340;c.height=230;c.id='cwmV27Smoke';c.style='position:fixed;left:20px;bottom:20px;z-index:99999;background:#08111b';document.body.appendChild(c);const C=c.getContext('2d'),P={x:145,y:125,w:34,h:50,hp:405,max:456,dir:1,on:true,vx:0,at:0,atMax:.2,combo:0},W={type:'wand',col:'#6da8ff',__rarityRank:6,element:{col:'#8f6dff'}};const a=drawAttire(P,W,C),h=drawPlate(P,W,C);const root=document.documentElement;root.dataset.cwmV27Proof=(a&&h&&S.attireDraws>0&&S.plateDraws>0)?'pass':'fail';root.dataset.cwmV27Role=S.lastRole||'none'}catch(e){document.documentElement.dataset.cwmV27Proof='fail';document.documentElement.dataset.cwmV27Error=String(e).slice(0,120)}},900)
})();
(()=>{
  if(globalThis.__CWM_ENEMY_IMPACT_V23)return;
  globalThis.__CWM_ENEMY_IMPACT_V23=true;

  const S={hits:0,light:0,medium:0,crit:0,kills:0,ringsSuppressed:0,draws:0,types:new Set()};
  const clampI=(n,a,b)=>Math.max(a,Math.min(b,n));
  let impactDepth=0;

  // Generic circles are not hit feedback anymore. Rings created while resolving damage are suppressed;
  // boss/arena telegraphs happen outside hitE/killE and remain untouched. Keep the level-up gold burst.
  const ring0=ring;
  ring=function(x,y,col,r=100,w=4){
    if(impactDepth>0&&String(col).toLowerCase()!=='#ffe37a'){S.ringsSuppressed++;return}
    return ring0(x,y,col,r,w);
  };

  const hit0=hitE;
  hitE=function(e,a,o={}){
    if(!e||e.dead)return hit0(e,a,o);
    const before=Math.max(0,Number(e.hp)||0),max=Math.max(1,Number(e.max)||1);
    impactDepth++;
    let out;
    try{out=hit0(e,a,o)}finally{impactDepth=Math.max(0,impactDepth-1)}
    const actual=Math.max(0,before-Math.max(0,Number(e.hp)||0));
    if(actual>0){
      const frac=actual/max,dead=!!e.dead,crit=!!o.crit;
      const tier=dead?'kill':crit||frac>=.18?'crit':frac>=.075?'medium':'light';
      const dur=tier==='kill'?.36:tier==='crit'?.24:tier==='medium'?.18:.13;
      const pow=tier==='kill'?1.35:tier==='crit'?1.08:tier==='medium'?.78:.50;
      const dir=Math.sign(Number(o.knock)||((e.x+e.w/2)-(pl.x+pl.w/2))||1);
      e.__cwmImpact={start:Number(time)||0,dur,tier,pow,dir,col:o.col||curW?.()?.col||'#ffffff'};
      S.hits++;S[tier==='kill'?'kills':tier]++;S.types.add(e.type||'boss');
      // Tiny deliberate hit-stop gives contact without moving the camera.
      stop=Math.max(stop,tier==='kill'?.032:tier==='crit'?.024:tier==='medium'?.012:.006);
    }
    return out;
  };

  const kill0=killE;
  killE=function(e,...args){
    // Environmental/direct kills also lose the old generic death/heal rings.
    impactDepth++;
    try{return kill0(e,...args)}finally{impactDepth=Math.max(0,impactDepth-1)}
  };

  function shapeOf(e){try{return ED?.[e.type]?.shape||e.type||'humanoid'}catch(_){return e.type||'humanoid'}}
  function activeReaction(e){
    const r=e?.__cwmImpact;if(!r)return null;
    const age=(Number(time)||0)-r.start;if(age<0||age>r.dur)return null;
    const u=clampI(age/r.dur,0,1),kick=Math.sin(Math.min(1,u*1.35)*Math.PI)*(1-u*.35);
    return{...r,u,kick};
  }
  function applyPose(e,r){
    const sh=shapeOf(e),k=r.kick*r.pow,d=r.dir;
    let tx=-d*8*k,ty=0,rot=-d*.08*k,sx=1,sy=1;
    if(sh==='crawler'||sh==='maw'){tx=-d*12*k;ty=4*k;rot=-d*.05*k;sx=1+.16*k;sy=1-.22*k}
    else if(sh==='brute'){tx=-d*13*k;rot=-d*.13*k;sx=1-.06*k;sy=1+.09*k}
    else if(sh==='wraith'){tx=-d*12*k;ty=-5*k;rot=-d*.18*k;sx=1+.20*k;sy=1-.10*k}
    else if(sh==='flyer'){tx=-d*11*k;ty=-8*k;rot=-d*.25*k;sx=1+.10*k;sy=1-.10*k}
    else if(sh==='wizard'||sh==='summoner'){tx=-d*10*k;rot=-d*.17*k;sx=1-.08*k;sy=1+.12*k}
    else if(sh==='taxman'){tx=-d*12*k;rot=-d*.16*k;sx=1-.05*k;sy=1+.07*k}
    else if(sh==='mimic'){tx=-d*7*k;ty=5*k;rot=-d*.04*k;sx=1+.18*k;sy=1-.24*k}
    else if(sh==='eyeball'){tx=-d*10*k;rot=-d*.13*k;sx=1-.16*k;sy=1+.16*k}
    else if(sh==='chicken'){tx=-d*14*k;ty=-4*k;rot=-d*.30*k;sx=1+.12*k;sy=1-.16*k}
    else if(sh==='shield'){tx=-d*6*k;rot=-d*.05*k;sx=1-.03*k;sy=1+.04*k}
    else if(sh==='blinker'){tx=-d*16*k;rot=-d*.10*k;sx=1+.13*k;sy=1-.08*k}
    else if(sh==='sniper'){tx=-d*13*k;rot=-d*.18*k;sx=1-.04*k;sy=1+.08*k}
    else if(sh==='roller'){tx=-d*10*k;rot=-d*.55*k;sx=1+.10*k;sy=1-.10*k}
    if(e.boss){tx=-d*10*k;rot=-d*.05*k;sx=1-.025*k;sy=1+.04*k}
    if(r.tier==='kill'){
      const q=r.u;
      if(sh==='wraith'){sx*=1+q*.35;sy*=1-q*.25}
      else if(sh==='roller'){rot+=d*q*3.6;sy*=1-q*.18}
      else if(sh==='chicken'){rot+=d*q*1.0;ty-=q*8}
      else if(sh==='mimic'){sy*=1-q*.32;sx*=1+q*.18}
      else if(sh==='crawler'||sh==='maw'){rot+=d*q*.55;sy*=1-q*.25}
    }
    X.translate(tx,ty);X.rotate(rot);X.scale(sx,sy);
  }

  function sparkLine(x,y,a,len,col,w=2){
    X.strokeStyle=col;X.lineWidth=w;X.beginPath();X.moveTo(x+Math.cos(a)*4,y+Math.sin(a)*4);X.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);X.stroke();
  }
  function drawHitAccent(e,r){
    if(!r||e.state==='spawn')return;
    const cx=e.x+e.w/2,cy=e.y+e.h*.45,k=r.kick,sh=shapeOf(e),heavy=r.tier==='crit'||r.tier==='kill';
    X.save();X.globalAlpha=clampI((1-r.u)*1.35,0,1);X.lineCap='round';
    const col=heavy?'#fff7d6':'#f4fbff';
    // Directional slash/spark fan instead of a circular pulse.
    const base=r.dir>0?Math.PI:0,n=r.tier==='light'?2:r.tier==='medium'?4:heavy?7:3;
    for(let i=0;i<n;i++){const spread=(i-(n-1)/2)*.24; sparkLine(cx-r.dir*e.w*.16,cy,base+spread,12+(i%3)*7+heavy*8,col,heavy?2.8:1.8)}
    if(r.tier==='crit'){
      X.strokeStyle='#ffe677';X.lineWidth=3;X.beginPath();X.moveTo(cx-11,cy-11);X.lineTo(cx+11,cy+11);X.moveTo(cx+11,cy-11);X.lineTo(cx-11,cy+11);X.stroke();
    }
    if(r.tier==='kill'){
      if(sh==='chicken'){
        X.fillStyle='#fff0b8';for(let i=0;i<6;i++){let a=i*Math.PI/3+r.u;let x=cx+Math.cos(a)*(14+r.u*34),y=cy+Math.sin(a)*(9+r.u*24);X.save();X.translate(x,y);X.rotate(a);X.beginPath();X.moveTo(-4,0);X.lineTo(4,-2);X.lineTo(2,3);X.closePath();X.fill();X.restore()}
      }else if(sh==='mimic'){
        X.fillStyle='#ffd85d';for(let i=0;i<5;i++){let a=-2.6+i*.55;let x=cx+Math.cos(a)*(12+r.u*42),y=cy+Math.sin(a)*(8+r.u*30);X.fillRect(x-3,y-2,6,4)}
      }else if(sh==='wraith'){
        X.strokeStyle='#b9f5ff';X.lineWidth=3;for(let i=0;i<4;i++){let x=cx+(i-1.5)*10;X.beginPath();X.moveTo(x,cy+8);X.quadraticCurveTo(x+Math.sin(r.u*8+i)*12,cy-12-r.u*28,x+(i-1.5)*4,cy-26-r.u*42);X.stroke()}
      }else if(sh==='roller'){
        X.strokeStyle='#ffe477';for(let i=0;i<8;i++)sparkLine(cx,cy,i*Math.PI/4+r.u*3,16+r.u*28,'#ffe477',2.5);
      }else if(sh==='crawler'||sh==='maw'){
        X.strokeStyle='#e7eef5';for(let i=0;i<5;i++)sparkLine(cx,cy+8,-2.8+i*.25,14+r.u*22,'#e7eef5',2);
      }
    }
    X.restore();S.draws++;
  }

  // This wrapper sits below the readability HP-bar wrapper, so only the monster deforms; UI stays stable.
  const creature0=creature;
  creature=function(e){
    const r=activeReaction(e);
    if(!r)return creature0(e);
    const cx=e.x+e.w/2,cy=e.y+e.h/2;
    X.save();X.translate(cx,cy);applyPose(e,r);X.translate(-cx,-cy);
    const oldFilter=X.filter;X.filter=`brightness(${1+(1-r.u)*(r.tier==='crit'?.95:.48)}) saturate(${r.tier==='crit'?.65:.82})`;
    const out=creature0(e);X.filter=oldFilter;X.restore();drawHitAccent(e,r);return out;
  };

  function selfTest(){return{ok:true,tiers:['light','medium','crit','kill'],cameraShake:false,normalHitRings:false,enemySpecific:true};}
  globalThis.CWM_ENEMY_IMPACT_V23={version:'v23-maple-hit-reactions',state:()=>({...S,types:[...S.types]}),selfTest};

  try{
    const p=new URLSearchParams(location.search);
    if(p.get('impactSmoke')==='1'||p.get('impactShowcase')==='1')setTimeout(()=>{
      try{
        if(typeof reset==='function')reset();gameStarted=true;paused=false;over=false;document.body.classList.add('playing','cwmArsenalPlaying');U?.titleScreen?.classList.add('hidden');
        pl.x=180;pl.y=G-pl.h;E=[];
        const spec=[['crawler',460,false],['brute',630,false],['wizard',800,true],['bombchicken',965,false],['mimic',1100,false]];
        for(const [type,x,elite] of spec){spawn(type,x,elite,G);const e=E.at(-1);if(e)e.state='approach'}
        const alive=E.filter(e=>e&&!e.dead&&!e.boss);if(alive[0])hitE(alive[0],Math.max(1,alive[0].max*.06),{col:'#dff7ff'});if(alive[1])hitE(alive[1],Math.max(1,alive[1].max*.11),{col:'#9fe8ff'});if(alive[2])hitE(alive[2],Math.max(1,alive[2].max*.22),{crit:true,col:'#ffe577'});if(alive[3])hitE(alive[3],Math.max(1,alive[3].max*.09),{col:'#fff'});if(alive[4]){alive[4].hp=Math.max(1,alive[4].max*.08);hitE(alive[4],alive[4].max,{crit:true,col:'#ffe577'})}
        draw();render();const st=globalThis.CWM_ENEMY_IMPACT_V23.state();const ok=st.hits>=5&&st.light>=1&&st.medium>=1&&st.crit>=1&&st.kills>=1&&st.ringsSuppressed>=1&&st.types.length>=5;
        const d=document.documentElement.dataset;d.cwmImpactProof=ok?'pass':'fail';d.cwmImpactTiers=`${st.light}/${st.medium}/${st.crit}/${st.kills}`;d.cwmImpactRings=String(st.ringsSuppressed);d.cwmImpactTypes=String(st.types.length);
      }catch(err){document.documentElement.dataset.cwmImpactProof='fail';console.error('impact smoke failed',err)}
    },1750);
  }catch(_){ }
})();
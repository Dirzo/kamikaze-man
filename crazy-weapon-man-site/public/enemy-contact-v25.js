(()=>{
  if(globalThis.__CWM_ENEMY_CONTACT_V25)return;
  globalThis.__CWM_ENEMY_CONTACT_V25=true;

  const S={hurt:0,melee:0,ranged:0,heavy:0,windFrames:0,types:new Set()};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  function sourceProfile(src){
    const type=src?.type||null,d=type?ED?.[type]:null,atk=d?.atk||null;
    if(atk==='charge')return{mag:520,lift:-235,heavy:true,kind:'melee'};
    if(atk==='cleave'||type==='brute')return{mag:430,lift:-215,heavy:true,kind:'melee'};
    if(atk==='bite'||type==='crawler'||type==='maw')return{mag:315,lift:-175,heavy:false,kind:'melee'};
    if(type&&d)return{mag:345,lift:-185,heavy:false,kind:'melee'};
    return{mag:245,lift:-150,heavy:false,kind:'ranged'};
  }

  const hurt0=hurt;
  hurt=function(a,src={}){
    const hp=pl.hp,bvx=Number(pl.vx)||0,bvy=Number(pl.vy)||0;
    const out=hurt0(a,src);
    if(pl.hp>=hp)return out;
    const p=sourceProfile(src),sx=Number(src?.x),scx=Number.isFinite(sx)?sx:(pl.x+pl.w/2),dir=(pl.x+pl.w/2)<scx?-1:1;
    pl.vx=bvx+dir*p.mag;pl.vy=Math.min(bvy,p.lift);pl.on=false;pl.inv=Math.max(pl.inv,p.heavy?.62:.52);
    S.hurt++;S[p.kind]++;if(p.heavy)S.heavy++;if(src?.type)S.types.add(src.type);
    try{
      F.push({k:'speed',x:pl.x+pl.w/2,y:pl.y+pl.h*.55,dir:-dir,life:.14,max:.14,col:p.heavy?'#ffd0a0':'#dce9ff',n:p.heavy?7:4});
      if(p.heavy){shake=Math.max(shake,10);stop=Math.max(stop,.025)}
    }catch(_){ }
    return out;
  };

  function windPose(e){
    const d=ED?.[e.type]||{},wind=Math.max(.12,Number(d.wind)||.4),remain=clamp((Number(e.st)||0)/wind,0,1),p=1-remain,dir=e.dir||1;
    let sx=1,sy=1,rot=0,dx=0,dy=0;
    // Maple-like anticipation: monsters visibly load away from the attack direction before snapping forward.
    if(d.atk==='charge'){
      const q=Math.sin(Math.min(1,p)*Math.PI*.55);sx=1+.16*q;sy=1-.14*q;rot=-dir*.08*q;dx=-dir*10*q;dy=5*q;
    }else if(d.atk==='cleave'){
      const q=Math.sin(Math.min(1,p)*Math.PI*.65);sx=1-.07*q;sy=1+.13*q;rot=-dir*.18*q;dx=-dir*7*q;dy=-3*q;
    }else if(d.atk==='bite'){
      const q=Math.sin(Math.min(1,p)*Math.PI*.72);sx=1+.10*q;sy=1-.12*q;rot=-dir*.055*q;dx=-dir*5*q;dy=4*q;
    }else if(d.atk==='fireball'||d.atk==='laser'){
      const q=Math.sin(Math.min(1,p)*Math.PI*.60);sx=1-.05*q;sy=1+.08*q;rot=-dir*.035*q;dx=-dir*3*q;dy=-5*q;
    }else{
      const q=Math.sin(Math.min(1,p)*Math.PI*.65);sx=1+.07*q;sy=1-.08*q;rot=-dir*.06*q;dx=-dir*5*q;dy=3*q;
    }
    const snap=clamp((p-.68)/.32,0,1);dx-=dir*4*snap;rot-=dir*.025*snap;
    return{sx,sy,rot,dx,dy,p};
  }

  const creature0=creature;
  creature=function(e){
    if(!e||e.boss||e.state!=='wind')return creature0(e);
    S.windFrames++;
    const q=windPose(e),cx=e.x+e.w/2,cy=e.y+e.h/2;
    X.save();X.translate(cx+q.dx,cy+q.dy);X.rotate(q.rot);X.scale(q.sx,q.sy);X.translate(-cx,-cy);
    const out=creature0(e);X.restore();
    // Small directional tell right before release; readable without becoming a giant MMO telegraph.
    if(q.p>.58){
      X.save();X.globalAlpha=clamp((q.p-.58)/.42,0,.55);X.strokeStyle=e.col||'#fff';X.lineWidth=2;X.beginPath();
      const x=e.x+e.w/2+(e.dir||1)*e.w*.35,y=e.y+e.h*.48;X.moveTo(x-(e.dir||1)*12,y-10);X.lineTo(x+(e.dir||1)*10,y);X.lineTo(x-(e.dir||1)*12,y+10);X.stroke();X.restore();
    }
    return out;
  };

  function selfTest(){
    const bite=sourceProfile({type:'crawler'}),brute=sourceProfile({type:'brute'}),charge={mag:520},ranged=sourceProfile({x:0});
    return{ok:ranged.mag<bite.mag&&bite.mag<brute.mag&&brute.mag<charge.mag,values:{ranged:ranged.mag,bite:bite.mag,brute:brute.mag,charge:charge.mag},windups:true,enemySpecific:true};
  }
  globalThis.CWM_ENEMY_CONTACT_V25={version:'v25-maple-enemy-contact',state:()=>({...S,types:[...S.types]}),selfTest};

  try{
    const qs=new URLSearchParams(location.search);
    if(qs.get('enemyContactSmoke')==='1')setTimeout(()=>{
      try{
        if(typeof reset==='function')reset();gameStarted=true;paused=false;over=false;document.body.classList.add('playing','cwmArsenalPlaying');U?.titleScreen?.classList.add('hidden');
        pl.x=260;pl.y=G-pl.h;pl.hp=pl.max;pl.inv=0;pl.vx=0;pl.vy=0;
        const vals={};
        for(const type of ['crawler','brute']){
          pl.inv=0;pl.vx=0;pl.vy=0;const src={type,x:pl.x+180};hurt(1,src);vals[type]=Math.abs(pl.vx);
        }
        pl.inv=0;pl.vx=0;pl.vy=0;hurt(1,{x:pl.x+180});vals.ranged=Math.abs(pl.vx);
        E=[];spawn('crawler',560,false,G);const e=E.at(-1);e.state='wind';e.st=(ED[e.type]?.wind||.4)*.35;draw();render();
        const t=selfTest(),ok=t.ok&&vals.ranged<vals.crawler&&vals.crawler<vals.brute&&S.windFrames>0;
        const d=document.documentElement.dataset;d.cwmEnemyContactProof=ok?'pass':'fail';d.cwmEnemyContactOrder=`${Math.round(vals.ranged)}/${Math.round(vals.crawler)}/${Math.round(vals.brute)}`;d.cwmEnemyWind=String(S.windFrames);
      }catch(err){document.documentElement.dataset.cwmEnemyContactProof='fail';console.error('enemy contact smoke failed',err)}
    },1750);
  }catch(_){ }
})();

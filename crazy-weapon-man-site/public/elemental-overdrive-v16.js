(()=>{
  if(globalThis.__CWM_ELEMENTAL_OVERDRIVE_V16)return;
  globalThis.__CWM_ELEMENTAL_OVERDRIVE_V16=true;

  const FAMILIES=new Set(['fire','poison','lightning','water','earth','ice','plasma','void','wind','radiant']);
  const clampE=(n,a,b)=>Math.max(a,Math.min(b,n));
  const live=()=>E.filter(e=>e&&!e.dead&&!e.boss);
  const density=()=>live().length;
  const fxMult=()=>density()>=20?.42:density()>=14?.60:density()>=9?.78:1;
  const elem=w=>w?.element&&FAMILIES.has(w.element.family)?w.element:null;
  const near=(e,n=5,r=190)=>live().filter(x=>x!==e&&Math.hypot((x.x+x.w/2)-(e.x+e.w/2),(x.y+x.h/2)-(e.y+e.h/2))<=r).sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y)).slice(0,n);
  const guard=(w,col)=>({col:col||w.col,sourceType:w.type,__elementTick:true,__arsenalTick:true,__hordeTick:true,__overdriveTick:true});

  function burst(x,y,e,r=100,count=10){
    const m=fxMult(),strong=e?.polarity==='negative';
    try{
      ring(x,y,e?.col||'#fff',r,strong?5:3);
      if(strong)ring(x,y,'#ffffff',r*.66,2);
      part(x,y,e?.col||'#fff',Math.max(3,Math.round(count*m)),strong?230:175,strong?7:5);
    }catch(_){ }
  }
  function lineFx(x,y,x2,y2,e,w=4){try{beam(x,y,x2,y2,e?.col||'#fff',w);if(e?.polarity==='negative')beam(x+2,y-2,x2-2,y2+2,'#fff',Math.max(1,w*.35))}catch(_){ }}

  function markStatus(target,family){
    if(!target)return;
    if(family==='water')target.__cwmWet=Math.max(target.__cwmWet||0,3.2);
    if(family==='ice')target.__cwmChill=Math.max(target.__cwmChill||0,3.0);
    if(family==='poison')target.__cwmToxic=Math.max(target.__cwmToxic||0,4.5);
    if(family==='void')target.__cwmVoidMark=Math.max(target.__cwmVoidMark||0,2.8);
  }

  const hit0=hitE;
  hitE=function(target,amount,o={}){
    const dealt=hit0(target,amount,o);
    if(!dealt||!target||target.dead||o.__overdriveTick)return dealt;
    const w=curW(),e=elem(w);if(!e)return dealt;
    const family=e.family,power=e.polarity==='negative'?1.24:1,cx=target.x+target.w/2,cy=target.y+target.h/2;
    markStatus(target,family);

    // Cross-element reactions persist through weapon swaps and reward rapidly changing loadouts.
    if(target.__cwmWet>0&&family==='fire'&&target.__cwmReactionCombo!==pl.combo){
      target.__cwmReactionCombo=pl.combo;target.__cwmWet=0;burst(cx,cy,{...e,col:'#dff7ff'},92,10);
      for(const t of near(target,4,125))hit0(t,dealt*.18*power,{...guard(w,'#dff7ff'),stun:.10,knock:Math.sign(t.x-target.x)*110});
      try{txt(cx,cy-30,'STEAM BURST','#e8fbff',false)}catch(_){ }
    }
    if(target.__cwmWet>0&&family==='lightning'&&target.__cwmReactionCombo!==pl.combo){
      target.__cwmReactionCombo=pl.combo;const chain=near(target,5,245);
      let from=target;for(const t of chain){lineFx(from.x+from.w/2,from.y+from.h/2,t.x+t.w/2,t.y+t.h/2,e,4);hit0(t,dealt*.19*power,{...guard(w,e.col),stun:.13});t.__cwmWet=Math.max(t.__cwmWet||0,1.6);from=t}
      try{txt(cx,cy-30,'CONDUCTIVE','#c9f6ff',false)}catch(_){ }
    }
    if(target.__cwmWet>0&&family==='ice'&&target.__cwmReactionCombo!==pl.combo){
      target.__cwmReactionCombo=pl.combo;target.__cwmWet=0;target.stun=Math.max(target.stun||0,.72);burst(cx,cy,e,82,9);
      for(const t of near(target,3,112))hit0(t,dealt*.16*power,{...guard(w,e.col),stun:.22});
      try{txt(cx,cy-30,'FLASH FREEZE',e.col,false)}catch(_){ }
    }
    if(target.__cwmChill>0&&family==='earth'&&target.__cwmReactionCombo!==pl.combo){
      target.__cwmReactionCombo=pl.combo;target.__cwmChill=0;burst(cx,cy,{...e,col:'#e7f6ff'},105,12);
      hit0(target,dealt*.26*power,{...guard(w,'#e7f6ff'),stun:.30});for(const t of near(target,4,130))hit0(t,dealt*.13*power,{...guard(w,'#d9efff'),stun:.10,knock:Math.sign(t.x-target.x)*150});
      try{txt(cx,cy-30,'SHATTER','#effcff',false)}catch(_){ }
    }
    if(target.__cwmToxic>0&&family==='fire'&&target.__cwmReactionCombo!==pl.combo){
      target.__cwmReactionCombo=pl.combo;target.__cwmToxic=0;burst(cx,cy,{...e,col:'#baff65'},125,13);
      for(const t of near(target,5,145))hit0(t,dealt*.22*power,{...guard(w,'#c8ff73'),stun:.08});
      try{txt(cx,cy-30,'TOXIC COMBUSTION','#caff71',false)}catch(_){ }
    }

    const combo=Number(pl.combo)||0;if(combo<=0||w.__cwmElementOverdriveCombo===combo)return dealt;
    const cadence=family==='plasma'||family==='void'?4:3;if(combo%cadence!==0)return dealt;
    w.__cwmElementOverdriveCombo=combo;
    const q=rarityRank(w),ao=Math.min(1.7,weaponAoe(w)),max=clampE(4+Math.floor(q/2),4,9),targets=near(target,max,185+q*10);

    if(family==='fire'){
      burst(cx,cy,e,130*ao,14);for(const t of targets)hit0(t,dealt*.20*power,{...guard(w,e.col),stun:.06});
    }else if(family==='poison'){
      burst(cx,cy,e,120*ao,12);for(const t of targets){t.__cwmToxic=Math.max(t.__cwmToxic||0,4);hit0(t,dealt*.15*power,{...guard(w,e.col)})}
    }else if(family==='lightning'){
      let from=target;for(const t of targets){lineFx(from.x+from.w/2,from.y+from.h/2,t.x+t.w/2,t.y+t.h/2,e,4.5);hit0(t,dealt*.21*power,{...guard(w,e.col),stun:.10});from=t}
    }else if(family==='water'){
      burst(cx,cy,e,145*ao,10);for(const t of targets){t.__cwmWet=Math.max(t.__cwmWet||0,3);hit0(t,dealt*.15*power,{...guard(w,e.col),knock:Math.sign(t.x-target.x)*(180+q*8),stun:.10})}
    }else if(family==='earth'){
      burst(cx,G-8,e,170*ao,15);for(const t of live().slice(0,14))if(Math.abs(t.x-target.x)<185*ao)hit0(t,dealt*.24*power,{...guard(w,e.col),knock:Math.sign(t.x-target.x||1)*(260+q*16),stun:.18});
    }else if(family==='ice'){
      burst(cx,cy,e,135*ao,14);for(const t of targets){t.__cwmChill=Math.max(t.__cwmChill||0,3);t.stun=Math.max(t.stun||0,.18);hit0(t,dealt*.17*power,{...guard(w,e.col),stun:.15})}
    }else if(family==='plasma'){
      const dir=pl.dir,x2=pl.x+17+dir*(430+q*22);lineFx(pl.x+17,pl.y+20,x2,pl.y+20,e,8);for(const t of live().slice(0,18))if(Math.sign((t.x+t.w/2)-(pl.x+17))===dir&&Math.abs((t.y+t.h/2)-(pl.y+20))<105)hit0(t,dealt*.30*power,{...guard(w,e.col),knock:dir*135});
    }else if(family==='void'){
      burst(cx,cy,e,155*ao,10);for(const t of targets){const dx=cx-(t.x+t.w/2),dy=cy-(t.y+t.h/2),d=Math.max(1,Math.hypot(dx,dy));t.vx+=(dx/d)*(280+q*14);t.vy+=(dy/d)*145;hit0(t,dealt*.20*power,{...guard(w,e.col),stun:.08});t.__cwmVoidMark=Math.max(t.__cwmVoidMark||0,2)}
    }else if(family==='wind'){
      burst(pl.x+17,pl.y+22,e,165*ao,11);for(const t of live().slice(0,14))if(Math.hypot(t.x-pl.x,t.y-pl.y)<190*ao){const dir=Math.sign((t.x+t.w/2)-(pl.x+17))||1;hit0(t,dealt*.16*power,{...guard(w,e.col),knock:dir*(360+q*20),stun:.06});t.vx+=dir*(220+q*12)}
    }else if(family==='radiant'){
      const wounded=live().filter(t=>t.hp/Math.max(1,t.max)<.62).sort((a,b)=>a.hp/a.max-b.hp/b.max).slice(0,max);for(const t of wounded){lineFx(pl.x+17,pl.y+18,t.x+t.w/2,t.y+t.h/2,e,4);hit0(t,dealt*(t.hp/t.max<.28?.34:.22)*power,{...guard(w,e.col),stun:.08})}burst(cx,cy,e,92,8);
    }
    if(density()>=10)try{styleAdd(4+Math.floor(Math.min(20,density())/4),'ELEMENTAL OVERDRIVE')}catch(_){ }
    return dealt;
  };

  const kill0=killE;
  killE=function(dead,...args){
    const eligible=!!dead&&!dead.dead&&!dead.boss,w=curW(),e=elem(w),x=dead?.x+(dead?.w||0)/2,y=dead?.y+(dead?.h||0)/2;
    const r=kill0(dead,...args);
    if(!eligible||!dead?.dead||!e)return r;
    const targets=near(dead,4+Math.floor(rarityRank(w)/3),145),g=guard(w,e.col),power=e.polarity==='negative'?1.20:1;
    if(e.family==='fire'&&dead.__cwmFire){burst(x,y,e,105,10);for(const t of targets)hit0(t,wdmg()*.16*power,{...g,stun:.05})}
    else if(e.family==='poison'&&(dead.__cwmPoison||dead.__cwmToxic)){burst(x,y,e,112,9);for(const t of targets){t.__cwmToxic=Math.max(t.__cwmToxic||0,3.5);hit0(t,wdmg()*.11*power,{...g})}}
    else if(e.family==='ice'&&dead.__cwmChill){burst(x,y,e,120,12);for(const t of targets)hit0(t,wdmg()*.14*power,{...g,stun:.14})}
    else if(e.family==='plasma'){burst(x,y,e,116,12);for(const t of targets.slice(0,3))hit0(t,wdmg()*.15*power,{...g})}
    else if(e.family==='void'&&dead.__cwmVoidMark){burst(x,y,e,130,8);for(const t of targets){t.vx+=(x-(t.x+t.w/2))*.9;hit0(t,wdmg()*.12*power,{...g,stun:.08})}}
    return r;
  };

  const update0=update;
  update=function(dt){
    const r=update0(dt),d=Math.max(0,Math.min(.05,Number(dt)||0));
    for(const e of E){if(!e||e.dead)continue;if(e.__cwmWet>0)e.__cwmWet=Math.max(0,e.__cwmWet-d);if(e.__cwmChill>0)e.__cwmChill=Math.max(0,e.__cwmChill-d);if(e.__cwmToxic>0)e.__cwmToxic=Math.max(0,e.__cwmToxic-d);if(e.__cwmVoidMark>0)e.__cwmVoidMark=Math.max(0,e.__cwmVoidMark-d)}
    return r;
  };

  if(typeof attackMotion==='function'){
    const attack0=attackMotion;
    attackMotion=function(w){const r=attack0(w),e=elem(w);if(!e)return r;const q=rarityRank(w),x=pl.x+17+pl.dir*(38*weaponScale(w)),y=pl.y+20,m=fxMult();
      try{
        if(e.family==='fire'){part(x,y,e.col,Math.max(3,Math.round((5+q*.5)*m)),125+q*8,4);if(q>=6)ring(x,y,'#ffdf8a',30+q*2,2)}
        else if(e.family==='poison'){part(x,y,e.col,Math.max(3,Math.round((6+q*.4)*m)),95,6)}
        else if(e.family==='lightning'){for(let i=0;i<Math.max(1,Math.round(3*m));i++)lineFx(x,y,x+pl.dir*rand(30,72),y+rand(-24,24),e,2)}
        else if(e.family==='water'){ring(x,y,e.col,34+q*2,3);if(q>=5)ring(x,y,'#d9f8ff',22+q,1)}
        else if(e.family==='earth'){F.push({k:'impact',x,y:Math.min(G-4,y+20),col:e.col,life:.18,max:.18,r:28+q*2})}
        else if(e.family==='ice'){for(let i=0;i<Math.max(3,Math.round(6*m));i++){let a=i*Math.PI/3;lineFx(x,y,x+Math.cos(a)*(20+q),y+Math.sin(a)*(20+q),e,1.5)}}
        else if(e.family==='plasma'){ring(x,y,e.col,30+q*2,4);ring(x,y,'#fff',18+q,1);lineFx(pl.x+17,pl.y+20,x+pl.dir*(30+q*2),y,e,3)}
        else if(e.family==='void'){ring(x,y,e.col,38+q*2,4);F.push({k:'vortex',x,y,life:.28,max:.28,pow:.35,dam:0})}
        else if(e.family==='wind'){F.push({k:'speed',x,y,dir:pl.dir,life:.16,max:.16,col:e.col,n:4+Math.floor(q/2)})}
        else if(e.family==='radiant'){for(let i=0;i<Math.max(3,Math.round(7*m));i++){let a=i*Math.PI*2/7;lineFx(x,y,x+Math.cos(a)*(25+q*2),y+Math.sin(a)*(25+q*2),e,1.5)}}
        if(e.polarity==='negative'&&q>=4){chroma=Math.max(chroma,.035);flash=Math.max(flash,.018)}
      }catch(_){ }
      return r;
    };
  }

  if(typeof skillMotion==='function'){
    const skill0=skillMotion;
    skillMotion=function(w){const r=skill0(w),e=elem(w);if(!e)return r;const q=rarityRank(w),x=pl.x+17,y=pl.y+22;
      try{for(let i=0;i<Math.min(4,1+Math.floor(q/3));i++)ring(x,y,i%2?e.col:'#fff',95+i*34+q*3,2+i);part(x,y,e.col,Math.max(8,Math.round((16+q)*fxMult())),260,7);if(e.family==='void')F.push({k:'vortex',x,y,life:.65,max:.65,pow:.65,dam:0});if(e.polarity==='negative'){flash=Math.max(flash,.12);chroma=Math.max(chroma,.10)}}catch(_){ }
      return r;
    };
  }

  if(typeof renderWeaponArt==='function'){
    const art0=renderWeaponArt;
    renderWeaponArt=function(w){const r=art0(w),e=elem(w);if(!e||!U?.wArt)return r;try{
      const g=U.wArt.getContext('2d'),cw=U.wArt.width,ch=U.wArt.height,t=typeof time==='number'?time:performance.now()/1000,q=rarityRank(w);g.save();g.translate(cw/2,ch/2);g.strokeStyle=e.col;g.fillStyle=e.col;g.shadowColor=e.col;g.shadowBlur=12+q*1.2;g.globalAlpha=e.polarity==='negative'?.86:.62;g.lineWidth=2+q*.08;
      const rings=q>=8?3:q>=4?2:1;for(let j=0;j<rings;j++){g.beginPath();g.ellipse(0,0,72+j*12+Math.sin(t*3+j)*5,42+j*7,Math.sin(t*.4+j)*.18,0,Math.PI*2);g.stroke()}
      if(e.family==='lightning'||e.family==='plasma'){for(let i=0;i<5;i++){let a=t*2+i*Math.PI*2/5;g.beginPath();g.moveTo(Math.cos(a)*35,Math.sin(a)*22);g.lineTo(Math.cos(a+.35)*(72+q*2),Math.sin(a+.35)*(42+q));g.stroke()}}
      else if(e.family==='fire'||e.family==='radiant'){for(let i=0;i<8;i++){g.rotate(Math.PI/4);g.beginPath();g.moveTo(45,0);g.lineTo(66+q+Math.sin(t*6+i)*6,0);g.stroke()}}
      else if(e.family==='ice'){for(let i=0;i<6;i++){g.rotate(Math.PI/3);g.beginPath();g.moveTo(38,0);g.lineTo(67+q,0);g.moveTo(55,0);g.lineTo(48,-7);g.moveTo(55,0);g.lineTo(48,7);g.stroke()}}
      else if(e.family==='void'){g.globalAlpha=.28;g.fillStyle='#050109';g.beginPath();g.arc(0,0,34+Math.sin(t*4)*4,0,Math.PI*2);g.fill();g.globalAlpha=.8;for(let i=0;i<4;i++){let a=-t*1.4+i*Math.PI/2;g.beginPath();g.arc(Math.cos(a)*62,Math.sin(a)*31,4+i*.8,0,Math.PI*2);g.stroke()}}
      else if(e.family==='wind'||e.family==='water'){for(let i=0;i<4;i++){g.beginPath();g.arc(0,0,45+i*10,-1.4+t*.3+i*.15,.55+t*.3+i*.15);g.stroke()}}
      else if(e.family==='earth'){for(let i=0;i<7;i++){let a=i*Math.PI*2/7;g.beginPath();g.moveTo(Math.cos(a)*46,Math.sin(a)*28);g.lineTo(Math.cos(a)*(61+q),Math.sin(a)*(39+q*.5));g.stroke()}}
      else if(e.family==='poison'){for(let i=0;i<7;i++){let a=t*.7+i*Math.PI*2/7;g.beginPath();g.arc(Math.cos(a)*(50+i%2*12),Math.sin(a)*(27+i%3*6),3+(i%3),0,Math.PI*2);g.fill()}}
      g.restore();
    }catch(_){ }return r};
  }

  function selfTest(){const w=curW(),e=elem(w);return{ok:FAMILIES.size===10,families:FAMILIES.size,current:e?.family||'none',density:density(),fxScale:fxMult(),reactions:['steam','conductive','flash-freeze','shatter','toxic-combustion']}}
  globalThis.CWM_ELEMENTAL_OVERDRIVE_V16={version:'v16-elemental-overdrive',families:[...FAMILIES],selfTest};
})();
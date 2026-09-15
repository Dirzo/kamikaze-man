(()=>{
  if(globalThis.__CWL_HEAVY_SIGNATURES_V1)return;
  globalThis.__CWL_HEAVY_SIGNATURES_V1=true;
  const BUILD='cwl-heavy-signatures-v1-20260915a';
  const SIG={
    industrial_maul:{name:'GROUND FAULT',short:'GROUND FAULT',desc:'Every fourth hit sends a concussion through nearby enemies.'},
    siege_hammer:{name:'BREACH NOTICE',short:'BREACH',desc:'Every third hit delivers a brutal single-target breach strike.'},
    pile_driver:{name:'HYDRAULIC PUNCH',short:'HYDRAULIC',desc:'Repeated impacts build pressure before a piston-assisted follow-up.'},
    welded_cleaver:{name:'SCRAP EXECUTION',short:'EXECUTION',desc:'Low-health targets are aggressively finished and nearby trash gets clipped.'},
    junk_cannon:{name:'SHRAPNEL TAX',short:'SHRAPNEL',desc:'Every second impact sprays secondary fragments into nearby targets.'},
    scrap_mortar:{name:'DELAYED COMPLIANCE',short:'MORTAR BURST',desc:'Every third hit leaves a delayed blast at the impact point.'},
    rotary_reclaimer:{name:'SPIN-UP',short:'SPIN-UP',desc:'Sustained hits ramp a rapid bonus-damage stream until the trigger goes quiet.'},
    landfill_lobber:{name:'TRASH CASCADE',short:'CASCADE',desc:'Heavy projectiles ricochet through nearby enemies every third hit.'},
    pressure_propeller:{name:'BACKDRAFT',short:'BACKDRAFT',desc:'Every third hit throws a pressure burst through the surrounding pack.'},
    siege_toaster:{name:'BREAKROOM MELTDOWN',short:'MELTDOWN',desc:'Every fourth hit vents catastrophic breakfast-grade heat into the crowd.'}
  };
  let hitCount=0,lastHitAt=-99,lastWeapon=null,lastBase='',lastProc='',procCount=0;
  const targetStacks=new WeakMap();
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const now=()=>typeof time!=='undefined'?Number(time)||0:performance.now()/1000;
  const currentWeapon=()=>{try{return curW()}catch(_){return null}};
  const currentBase=w=>String(w?.heavyBaseId||globalThis.CWM_HEAVY_ART?.subtype?.(w)||'');
  const current=()=>SIG[currentBase(currentWeapon())]||null;
  const rankScale=w=>{try{return 1+Math.min(.35,(Number(rarityRank(w))||0)*.012)}catch(_){return 1}};
  const center=e=>({x:(e?.x||0)+(e?.w||0)/2,y:(e?.y||0)+(e?.h||0)/2});
  const alive=e=>!!e&&!e.dead&&Number(e.hp??1)>0;
  function nearby(e,count=3,range=145){
    try{
      const c=center(e);
      return E.filter(x=>alive(x)&&x!==e&&Math.hypot(center(x).x-c.x,center(x).y-c.y)<=range)
        .sort((a,b)=>Math.hypot(center(a).x-c.x,center(a).y-c.y)-Math.hypot(center(b).x-c.x,center(b).y-c.y)).slice(0,count);
    }catch(_){return []}
  }
  function nearPoint(x,y,count=4,range=145){
    try{return E.filter(alive).filter(e=>Math.hypot(center(e).x-x,center(e).y-y)<=range)
      .sort((a,b)=>Math.hypot(center(a).x-x,center(a).y-y)-Math.hypot(center(b).x-x,center(b).y-y)).slice(0,count)}catch(_){return []}
  }
  function fx(e,col,label,strong=false){
    try{
      const c=center(e);ring(c.x,c.y,col,strong?52:36,strong?4:2);part(c.x,c.y,col,strong?12:7,strong?185:125,strong?6:4);
      if(label)txt(c.x,c.y-28,label,col,strong);
      if(strong)shake=Math.max(shake,5);
    }catch(_){ }
  }
  function beamFx(a,b,col){try{const ca=center(a),cb=center(b);beam(ca.x,ca.y,cb.x,cb.y,col,4)}catch(_){ }}

  function install(){
    try{
      if(typeof hitE!=='function'){setTimeout(install,75);return}
      if(hitE.__cwlHeavySignatures)return;
      const baseHit=hitE;
      function bonusHit(e,damage,opt={}){
        if(!alive(e)||!(damage>0))return 0;
        return baseHit(e,damage,{col:opt.col||'#fff176',stun:opt.stun||0,knock:opt.knock||0,sourceType:'hammer',__elementTick:true,__cwlHeavySignature:true});
      }
      function procLabel(base,e,col,label,strong=false){lastProc=label;procCount++;fx(e,col,label,strong);return base}
      const wrapped=function(e,a,o={}){
        const dealt=baseHit(e,a,o);
        if(!dealt||o.__cwlHeavySignature||o.__elementTick||!e)return dealt;
        const w=currentWeapon();
        if(!w||w.type!=='hammer'||globalThis.CWM_WEAPON_VISUAL?.family?.(w)!=='heavy')return dealt;
        const base=currentBase(w),sig=SIG[base];if(!sig)return dealt;
        const t=now();
        if(w!==lastWeapon||base!==lastBase){lastWeapon=w;lastBase=base;hitCount=0;lastHitAt=t;targetStacks.delete?.(e)}
        if(t-lastHitAt>1.15&&base==='rotary_reclaimer')hitCount=0;
        lastHitAt=t;hitCount++;
        const mult=rankScale(w),d=Math.max(1,Number(dealt)||0),col=w?.element?.col||w?.col||'#fff176';

        if(base==='industrial_maul'&&hitCount%4===0){
          for(const q of nearby(e,3,135)){bonusHit(q,d*.22*mult,{col,stun:.10,knock:Math.sign(center(q).x-center(e).x)*125});beamFx(e,q,col)}
          procLabel(base,e,col,'GROUND FAULT',true);
        }else if(base==='siege_hammer'&&hitCount%3===0&&alive(e)){
          bonusHit(e,d*.34*mult,{col,stun:.13,knock:(w?.type==='hammer'?(pl?.dir||1):1)*230});
          procLabel(base,e,col,'BREACH',true);
        }else if(base==='pile_driver'&&alive(e)){
          const s=targetStacks.get(e)||{n:0,t};s.n=t-s.t>1.7?1:s.n+1;s.t=t;targetStacks.set(e,s);
          if(s.n>=3){s.n=0;bonusHit(e,d*.40*mult,{col,stun:.17,knock:(pl?.dir||1)*170});procLabel(base,e,col,'HYDRAULIC PUNCH',true)}
        }else if(base==='welded_cleaver'){
          const remaining=Number(e.hp);
          if(alive(e)&&Number.isFinite(remaining)&&remaining<=d*1.18){bonusHit(e,d*.52*mult,{col,stun:.05});procLabel(base,e,col,'SCRAP EXECUTION',true)}
          else if(hitCount%4===0){for(const q of nearby(e,2,105))bonusHit(q,d*.18*mult,{col,knock:Math.sign(center(q).x-center(e).x)*80});procLabel(base,e,col,'CLEAVE',false)}
        }else if(base==='junk_cannon'&&hitCount%2===0){
          for(const q of nearby(e,3,170)){bonusHit(q,d*.15*mult,{col,stun:.04,knock:Math.sign(center(q).x-center(e).x)*75});beamFx(e,q,col)}
          procLabel(base,e,col,'SHRAPNEL TAX',false);
        }else if(base==='scrap_mortar'&&hitCount%3===0){
          const c=center(e);lastProc='MORTAR BURST';procCount++;
          try{ring(c.x,c.y,col,40,2)}catch(_){ }
          setTimeout(()=>{
            const targets=nearPoint(c.x,c.y,5,155);for(const q of targets)bonusHit(q,d*.19*mult,{col,stun:.08,knock:Math.sign(center(q).x-c.x)*105});
            try{ring(c.x,c.y,col,82,5);part(c.x,c.y,col,15,210,7);shake=Math.max(shake,6);txt(c.x,c.y-30,'DELAYED COMPLIANCE',col,true)}catch(_){ }
          },190);
        }else if(base==='rotary_reclaimer'){
          const spin=clamp(hitCount-2,0,7);
          if(spin>0&&alive(e)){bonusHit(e,d*(.035+spin*.012)*mult,{col,stun:.025});if(spin===1||spin===5)procLabel(base,e,col,spin>=5?'SPIN-UP MAX':'SPIN-UP',spin>=5)}
        }else if(base==='landfill_lobber'&&hitCount%3===0){
          const qs=nearby(e,2,205);if(qs[0]){bonusHit(qs[0],d*.25*mult,{col,stun:.06,knock:Math.sign(center(qs[0]).x-center(e).x)*100});beamFx(e,qs[0],col)}
          if(qs[1]){bonusHit(qs[1],d*.16*mult,{col,stun:.04,knock:Math.sign(center(qs[1]).x-center(e).x)*70});beamFx(qs[0]||e,qs[1],col)}
          procLabel(base,e,col,'TRASH CASCADE',false);
        }else if(base==='pressure_propeller'&&hitCount%3===0){
          const c=center(e);for(const q of nearby(e,4,145)){const dir=Math.sign(center(q).x-c.x)||1;bonusHit(q,d*.11*mult,{col,stun:.08,knock:dir*245})}
          procLabel(base,e,col,'BACKDRAFT',true);
        }else if(base==='siege_toaster'&&hitCount%4===0){
          for(const q of [e,...nearby(e,4,130)])if(alive(q))bonusHit(q,d*.17*mult,{col:'#ffb65c',stun:.07,knock:Math.sign(center(q).x-center(e).x)*65});
          procLabel(base,e,'#ffb65c','BREAKROOM MELTDOWN',true);
        }
        return dealt;
      };
      wrapped.__cwlHeavySignatures=true;hitE=wrapped;
      globalThis.CWL_HEAVY_SIGNATURES={
        build:BUILD,definitions:SIG,current,
        state:()=>({base:currentBase(currentWeapon()),signature:current(),hitCount,lastHitAt,lastProc,procCount}),
        reset:()=>{hitCount=0;lastHitAt=-99;lastWeapon=null;lastBase='';lastProc='';procCount=0}
      };
      console.info('Crazy Weapon Lady Heavy signatures armed',BUILD,globalThis.CWL_HEAVY_SIGNATURES.state());
    }catch(err){console.warn('CWL Heavy signature install failed',err);setTimeout(install,250)}
  }
  install();
})();

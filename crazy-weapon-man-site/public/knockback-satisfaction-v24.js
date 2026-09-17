(()=>{
  if(globalThis.__CWM_KNOCKBACK_V24)return;
  globalThis.__CWM_KNOCKBACK_V24=true;

  const S={hits:0,normalized:0,comboSoftened:0,byType:{},samples:[]};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const PROFILE={
    dagger:{base:105,crit:145,min:72,max:165,role:'stick'},
    nunchucks:{base:130,crit:175,min:88,max:205,role:'stick'},
    wand:{base:112,crit:155,min:76,max:190,role:'control'},
    bow:{base:165,crit:220,min:105,max:270,role:'space'},
    staff:{base:185,crit:245,min:120,max:300,role:'control'},
    katana:{base:235,crit:315,min:155,max:390,role:'slash'},
    sword:{base:245,crit:330,min:160,max:410,role:'slash'},
    hammer:{base:455,crit:590,min:320,max:690,role:'launch'}
  };

  const weaponType=o=>{
    if(o?.sourceType&&PROFILE[o.sourceType])return o.sourceType;
    if(Number.isFinite(o?.sourceDam)||o?.sourceMod){
      try{const t=curW?.()?.type;if(PROFILE[t])return t}catch(_){ }
    }
    return null;
  };
  const hitDir=(e,o)=>Math.sign(Number(o?.knock)||((e.x+e.w/2)-(pl.x+pl.w/2))||1)||1;

  function tunedKnock(e,o,type){
    const p=PROFILE[type],dir=hitDir(e,o),raw=Math.abs(Number(o?.knock)||0);
    let mag=o?.crit?p.crit:p.base;
    // Explicit weapon attacks may ask for more/less force, but the profile keeps the target in a useful combat pocket.
    if(raw>0){
      const ratio=raw/Math.max(1,p.base);
      mag*=clamp(.72+ratio*.22,.78,1.28);
    }
    mag=clamp(mag,p.min,p.max);
    const age=(Number(time)||0)-(Number(e.__cwmLastWeaponHit)||-99);
    // Rapid repeats should feel like a combo, not a leaf blower. Keep the enemy close enough for the next input.
    if(age>=0&&age<.30&&!o?.crit&&type!=='hammer'){
      mag*=type==='dagger'||type==='nunchucks'?.62:.74;
      S.comboSoftened++;
    }
    if(e.boss)mag=0;
    return dir*Math.round(mag);
  }

  const hit0=hitE;
  hitE=function(e,a,o={}){
    if(!e||e.dead)return hit0(e,a,o);
    const type=weaponType(o);
    if(!type)return hit0(e,a,o);
    const beforeVx=Number(e.vx)||0,raw=Number(o.knock),next={...o};
    next.knock=tunedKnock(e,next,type);
    const dealt=hit0(e,a,next);
    if(dealt){
      e.__cwmLastWeaponHit=Number(time)||0;
      const delta=(Number(e.vx)||0)-beforeVx;
      S.hits++;S.normalized++;S.byType[type]=(S.byType[type]||0)+1;
      S.samples.push({type,raw:Number.isFinite(raw)?Math.round(raw):null,tuned:Math.round(next.knock),delta:Math.round(delta),crit:!!o.crit});
      if(S.samples.length>40)S.samples.shift();
    }
    return dealt;
  };

  function selfTest(){
    const order=['dagger','bow','sword','hammer'].map(k=>PROFILE[k].base);
    return{
      ok:order[0]<order[1]&&order[1]<order[2]&&order[2]<order[3]&&PROFILE.dagger.max<PROFILE.sword.max&&PROFILE.sword.max<PROFILE.hammer.max,
      order,profiles:PROFILE,
      criteria:{fastWeaponRetention:true,readableSpacing:true,heavyWeaponAuthority:true,comboSoftening:true,bossPinball:false}
    };
  }
  globalThis.CWM_KNOCKBACK_V24={version:'v24-maple-satisfaction',profile:PROFILE,state:()=>({...S,byType:{...S.byType},samples:[...S.samples]}),selfTest};

  try{
    const p=new URLSearchParams(location.search);
    if(p.get('knockSmoke')==='1')setTimeout(()=>{
      try{
        if(typeof reset==='function')reset();gameStarted=true;paused=false;over=false;document.body.classList.add('playing','cwmArsenalPlaying');U?.titleScreen?.classList.add('hidden');
        pl.x=190;pl.y=G-pl.h;E=[];
        const types=['dagger','bow','sword','hammer'];
        const measured={};
        for(let i=0;i<types.length;i++){
          spawn('crawler',430+i*120,false,G);const e=E.at(-1);e.state='approach';e.vx=0;e.hp=e.max;
          const t=types[i];hitE(e,Math.max(1,e.max*.01),{sourceType:t,sourceDam:1,knock:999,col:'#fff'});measured[t]=Math.abs(Number(e.vx)||0);
        }
        // Repeated sword hit should keep less displacement than the first hit, preserving the combo pocket.
        const c=E[2];c.vx=0;hitE(c,Math.max(1,c.max*.01),{sourceType:'sword',sourceDam:1,knock:380,col:'#fff'});const repeat=Math.abs(Number(c.vx)||0);
        const profile=selfTest();
        const ok=profile.ok&&measured.dagger<measured.bow&&measured.bow<measured.sword&&measured.sword<measured.hammer&&repeat<measured.sword;
        const d=document.documentElement.dataset;d.cwmKnockProof=ok?'pass':'fail';d.cwmKnockOrder=`${Math.round(measured.dagger)}/${Math.round(measured.bow)}/${Math.round(measured.sword)}/${Math.round(measured.hammer)}`;d.cwmKnockRepeat=String(Math.round(repeat));
      }catch(err){document.documentElement.dataset.cwmKnockProof='fail';console.error('knockback smoke failed',err)}
    },1750);
  }catch(_){ }
})();

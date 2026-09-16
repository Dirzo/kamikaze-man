(()=>{
  if(globalThis.__CWM_NO_MANA_V17)return;
  globalThis.__CWM_NO_MANA_V17=true;

  const root=document.documentElement;
  const addDelay=s=>{
    const sec=Math.max(0,Number(s)||0),max=globalThis.CWM_SPECIALS_V15?.state?.().max||5.5;
    pl.scd=Math.min(max,Math.max(0,Number(pl.scd)||0)+sec);
    pl.__specialMax=Math.max(Number(pl.__specialMax)||0,pl.scd);
    return pl.scd;
  };

  try{
    const audit=CHAOS.find(x=>x.id==='audit');
    if(audit){audit.name='SURPRISE SPECIAL AUDIT';audit.msg='Compliance has slowed your weapon special recovery until this pack is dead.'}
    const barrage=ENEMY_TRAITS.find(x=>x.id==='auditbarrage');
    if(barrage){barrage.tag='COOLDOWN CITATION';barrage.desc='throws a fan of hostile receipts that delay your weapon special'}
  }catch(_){ }

  const txt0=txt;
  txt=function(x,y,s,col='#fff',big=false){
    let label=String(s??'');
    if(/^-22 MANA:\s*RECEIPT$/i.test(label)){addDelay(1.20);label='SPECIAL DELAY +1.2s'}
    else if(/^COUNTER:\s*MANA AUDIT$/i.test(label)){addDelay(1.55);label='COUNTER: SPECIAL AUDIT'}
    else if(/^GUILT\s*-18 MANA$/i.test(label)){addDelay(1.45);label='GUILT: SPECIAL DELAY'}
    else if(/^SURPRISE MANA AUDIT$/i.test(label)){addDelay(1.8);label='SURPRISE SPECIAL AUDIT'}
    return txt0(x,y,label,col,big);
  };

  if(typeof startChaos==='function'){
    const start0=startChaos;
    startChaos=function(){const before=chaosEvent,r=start0();if(!before&&chaosEvent==='audit')addDelay(1.85);return r};
  }
  if(typeof updateChaos==='function'){
    const chaos0=updateChaos;
    updateChaos=function(dt){
      const auditing=chaosEvent==='audit',before=Math.max(0,Number(pl.scd)||0),r=chaos0(dt);
      pl.mana=100;
      if(auditing&&pl.scd>0){
        // Base update has already counted time down; restore 38% of that progress to create a readable slowdown rather than a hard lockout.
        const d=Math.max(0,Math.min(.05,Number(dt)||0));
        pl.scd=Math.min(globalThis.CWM_SPECIALS_V15?.state?.().max||6,Math.max(pl.scd,before-d)+d*.38);
      }
      return r;
    };
  }

  // Runtime descriptions are canonical; remove remaining mana-era copy from systems players can inspect.
  try{
    const asthma=TRAITS.find(t=>t.code==='asthma');if(asthma)asthma.desc='frantic attack speed; every ninth attack catches its breath and trims special cooldown';
    const tax=TRAITS.find(t=>t.code==='taxevasive');if(tax)tax.desc='kills mysteriously shave time off the weapon special cooldown';
    const taxSyn=WEAPON_SYNERGIES.find(s=>s.id==='taxgold');if(taxSyn)taxSyn.desc='Tax Evasive + Gold: hostile dividends fire extra shots and accelerate special recovery.';
    const refund=BOONS.find(b=>b.id==='refund');if(refund)refund.desc='+6% crit. Kills also shave time off the current weapon special cooldown.';
    const button=BOONS.find(b=>b.id==='button');if(button)button.desc='Weapon special cooldown is 35% shorter. The button remains completely unlabeled.';
    const forklift=BOONS.find(b=>b.id==='forklift');if(forklift)forklift.desc='Knockback +35%. Wall splats also shave time off the weapon special cooldown.';
  }catch(_){ }

  function selfTest(){
    const audit=typeof CHAOS!=='undefined'?CHAOS.find(x=>x.id==='audit'):null;
    const barrage=typeof ENEMY_TRAITS!=='undefined'?ENEMY_TRAITS.find(x=>x.id==='auditbarrage'):null;
    const ok=!!audit&&!/mana/i.test(`${audit.name} ${audit.msg}`)&&!!barrage&&!/mana/i.test(`${barrage.tag} ${barrage.desc}`);
    if(root)root.dataset.cwmNoManaLegacy=ok?'pass':'fail';
    return{ok,audit:audit?.name,barrage:barrage?.tag,manaMechanic:false};
  }
  globalThis.CWM_NO_MANA_V17={version:'v17-no-mana-encounters',selfTest,addDelay};
  selfTest();
})();

(()=>{
  if(globalThis.__CWM_LOOT_CURVE_V31)return;
  globalThis.__CWM_LOOT_CURVE_V31=true;

  // Common should read as subdued gray/white on the floor, not another neon tier.
  if(R?.[0])R[0].col='#c5cbd2';

  // Explicit per-zone distributions. Early game is intentionally almost all Common/Rare.
  // Later zones move through the ladder gradually instead of exposing the whole rainbow immediately.
  const CURVES=[
    [0.72,0.25,0.03],
    [0.42,0.43,0.13,0.02],
    [0.18,0.40,0.31,0.09,0.02],
    [0.07,0.23,0.37,0.25,0.07,0.01],
    [0.01,0.05,0.15,0.29,0.30,0.15,0.04,0.01],
    [0,0.01,0.04,0.10,0.20,0.27,0.21,0.10,0.045,0.02,0.005],
    [0,0,0,0.005,0.015,0.035,0.07,0.13,0.19,0.22,0.18,0.10,0.04,0.012,0.0025,0.0005]
  ];
  const CAPS=[2,3,4,5,7,10,15];
  const ELITE_CAPS=[2,3,5,6,8,11,16];
  let lastBaseRank=0;

  const norm=a=>{const s=a.reduce((x,y)=>x+y,0)||1;return a.map(x=>x/s)};
  function stageFraction(){
    try{return Math.max(0,Math.min(1,stageClears/Math.max(1,stageGoal())))}catch(_){return 0}
  }
  function shifted(weights,amount){
    const out=Array(Math.max(weights.length+1,R.length)).fill(0),a=Math.max(0,Math.min(.55,amount));
    for(let i=0;i<weights.length;i++){
      const w=weights[i]||0;
      out[i]+=w*(1-a);
      out[Math.min(R.length-1,i+1)]+=w*a;
    }
    return out.slice(0,R.length);
  }
  function weightsFor(zone=zoneI,elite=false,local=stageFraction()){
    const z=Math.max(0,Math.min(CURVES.length-1,Number(zone)||0));
    // At the end of a zone only 18% of the distribution moves one step upward.
    // Elites add another modest 12%, so they feel better without skipping the color story.
    let w=shifted(CURVES[z],Math.max(0,Math.min(1,local))*.18+(elite?.12:0));
    const cap=(elite?ELITE_CAPS:CAPS)[z];
    for(let i=cap+1;i<w.length;i++){w[cap]+=w[i];w[i]=0}
    return norm(w);
  }
  function choose(weights){
    let x=Math.random(),last=0;
    for(let i=0;i<weights.length;i++){last=i;x-=weights[i];if(x<=0)return i}
    return last;
  }
  function capFor(zone=zoneI,elite=false){
    const z=Math.max(0,Math.min(CAPS.length-1,Number(zone)||0));
    return (elite?ELITE_CAPS:CAPS)[z];
  }

  // Replace V30's broad target distribution with the deliberately slow color curve.
  rr=function(elite=false){
    const i=choose(weightsFor(zoneI,elite,stageFraction()));
    lastBaseRank=i;
    return R[i]||R[0];
  };
  rarityCeiling=function(elite=false){return capFor(zoneI,elite)};

  function renameRankToken(name,targetName){
    let s=String(name||'');
    const names=[...RANKS].sort((a,b)=>b.length-a.length);
    for(const old of names){
      if(old===targetName)continue;
      const pos=s.indexOf(old);
      if(pos>=0){s=s.slice(0,pos)+targetName+s.slice(pos+old.length);break}
    }
    return s;
  }
  function forceRank(w,rank){
    if(!w||w.rar==='Training')return w;
    const ni=Math.max(0,Math.min(R.length-1,rank|0)),oi=Math.max(0,RANKS.indexOf(w.rar)),old=R[oi]||R[0],next=R[ni]||R[0];
    if(oi!==ni){
      if(old.m&&next.m)w.m*=next.m/old.m;
      const bonusCrit=Math.max(0,(Number(w.crit)||0)-.012*(Number(old.p)||0));
      w.crit=.012*(Number(next.p)||0)+bonusCrit;
      w.name=renameRankToken(w.name,next.n);
    }
    w.rar=next.n;w.col=next.col;w.p=next.p;
    w.__cwmBaseRarity=next.n;w.__cwmBaseRank=ni;
    return w;
  }

  // Element modules previously promoted rarity by 1-3 ranks. That created blue/yellow/orange drops in the
  // parking lot even when the underlying rarity roll was Common or Rare. Elements now remain powerful
  // modifiers, but they no longer change the item's rarity color or jump the progression ladder.
  const makeW0=makeW;
  makeW=function(...args){
    lastBaseRank=-1;
    const w=makeW0(...args);
    const rolled=lastBaseRank>=0?lastBaseRank:Math.max(0,RANKS.indexOf(w?.rar));
    return forceRank(w,Math.min(rolled,capFor(zoneI,!!args[1])));
  };

  // Bosses give a visible step forward, but respect the same zone cap instead of using the old 21-tier-era
  // hardcoded minimums that could try to jump straight to red in an early zone.
  bossReward=function(kind){
    const ord={jr:1,bossman:2,sr:3,grandma:4,ceo:5,weapon:6}[kind]||1;
    const old=estimateDPS(curW()),current=Math.max(0,rarityIndex(curW())),cap=capFor(zoneI,true);
    const desired=Math.min(cap,Math.max(current+1,Math.round(choose(weightsFor(zoneI,true,Math.min(1,stageFraction()+.25)))+Math.min(2,ord*.22))));
    let best=null,bestD=0;
    for(let i=0;i<180;i++){
      const w=makeW(Z[zoneI].lv+ri(2,5),true),q=rarityIndex(w),d=estimateDPS(w);
      if(q>=desired&&d>bestD){best=w;bestD=d}
      if(q>=desired&&d>old*(1.09+ord*.012))return w;
    }
    best=best||makeUpgradeW(Z[zoneI].lv+3);
    const d=estimateDPS(best);if(d<=old*1.10)best.m*=old*1.12/Math.max(1,d);
    return best;
  };

  function distribution(zone,n=4000,elite=false,local=0){
    const z=Math.max(0,Math.min(CURVES.length-1,zone|0)),weights=weightsFor(z,elite,local);
    return {zone:z,elite,local,cap:capFor(z,elite),weights:weights.map(x=>+x.toFixed(5)),expected:weights.map(x=>Math.round(x*n))};
  }
  function sampleActual(zone,n=1200,elite=false,local=0){
    const oz=zoneI,os=stageClears,counts=Array(R.length).fill(0);let max=0;
    try{
      zoneI=Math.max(0,Math.min(CURVES.length-1,zone|0));
      const goal=Math.max(1,stageGoal());stageClears=Math.round(Math.max(0,Math.min(1,local))*goal);
      for(let i=0;i<n;i++){const w=makeW(Math.max(1,Z[zoneI].lv),elite),q=rarityIndex(w);counts[q]++;max=Math.max(max,q)}
    }finally{zoneI=oz;stageClears=os}
    return{zone,n,elite,local,counts,max,commonRare:(counts[0]+counts[1])/Math.max(1,n),epic:counts[2]/Math.max(1,n)};
  }

  globalThis.CWM_LOOT_CURVE_V31={version:'v31-slow-color-progression',curves:CURVES,caps:CAPS,eliteCaps:ELITE_CAPS,weightsFor,distribution,sampleActual,state:()=>({zone:zoneI,local:stageFraction(),weights:weightsFor(zoneI,false),cap:capFor(zoneI,false)})};

  if(new URLSearchParams(location.search).get('lootV31Smoke')==='1')setTimeout(()=>{
    try{
      const s0=sampleActual(0,1800,false,0),s1=sampleActual(1,1200,false,0),s3=sampleActual(3,1200,false,0),s6=sampleActual(6,1200,false,0);
      const root=document.documentElement;
      const ok=s0.commonRare>=.90&&s0.epic<=.10&&s0.max<=2&&s1.max<=3&&s3.max<=5&&s6.max<=15&&R[0].col==='#c5cbd2';
      root.dataset.cwmLootV31=ok?'pass':'fail';
      root.dataset.cwmLootV31Zone0=`${s0.counts[0]},${s0.counts[1]},${s0.counts[2]}`;
      root.dataset.cwmLootV31Zone0CommonRare=s0.commonRare.toFixed(3);
      root.dataset.cwmLootV31Max=`${s0.max}|${s1.max}|${s3.max}|${s6.max}`;
      root.dataset.cwmLootV31Common=R[0].col;
    }catch(e){document.documentElement.dataset.cwmLootV31='fail';document.documentElement.dataset.cwmLootV31Error=String(e).slice(0,160)}
  },500);
})();
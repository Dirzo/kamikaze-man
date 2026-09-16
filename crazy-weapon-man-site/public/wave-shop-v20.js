(()=>{
  if(globalThis.__CWM_WAVE_SHOP_V20)return;
  globalThis.__CWM_WAVE_SHOP_V20=true;

  const BANK_KEY='crazyWeaponMan.shards.v2';
  const BANK_MAX=999999999;
  const LIVE_CAP=28;
  const CHASERS=new Set(['stalker','crawler','maw','brute','roller','blinker','shieldbro']);
  const SUPPORT=new Set(['wizard','taxman','summoner','sniper','eyeball','flyer','bombchicken','wraith','mimic']);
  const clampW=(n,a,b)=>Math.max(a,Math.min(b,n));
  const live=()=>E.filter(e=>e&&!e.dead&&!e.boss);
  const fmt=n=>Math.max(0,Math.floor(Number(n)||0)).toLocaleString();
  const firstWord=s=>(String(s||'WEAPON').trim().split(/\s+/)[0]||'WEAPON');
  const maskedDps=n=>`${String(Math.max(1,Math.round(Number(n)||1)))[0]}… DPS`;

  const TIERS=[
    {id:'scrap',label:'SCRAP COUNTER',price:30,pct:.10,power:1.04,heat:0,col:'#93a7b8'},
    {id:'rare',label:'BACK-ROOM RARE',price:150,pct:.25,power:1.09,heat:1,col:'#64d9ff'},
    {id:'illegal',label:'ILLEGAL PREMIUM',price:1200,pct:.42,power:1.16,heat:2,col:'#b67cff'},
    {id:'hazard',label:'HAZARD CLASS',price:12000,pct:.58,power:1.25,heat:4,col:'#ff72c6'},
    {id:'catastrophe',label:'CATASTROPHE GRADE',price:120000,pct:.72,power:1.38,heat:7,col:'#ff8058'},
    {id:'forbidden',label:'FORBIDDEN INVENTORY',price:1500000,pct:.87,power:1.56,heat:11,col:'#ffe36d'},
    {id:'singularity',label:'SINGULARITY SHELF',price:25000000,pct:1,power:1.82,heat:16,col:'#ffffff'}
  ];
  const RISK_ELEMENTS=['whiteout','meltdown','singularity','blowback','solar-flare'];
  const SAFE_ELEMENTS=['ice','plasma','void','wind','radiant'];
  let savedBank=0,shopOpen=false,shopWasPaused=false,shopStock=[],shopEpoch='',shopBought=0;
  let wave={active:false,total:0,spawned:0,squad:0,squads:0,nextAt:0,peak:0,offscreen:0,heat:0,lastTotal:0};
  let bankHud=null,waveHud=null;

  function loadBank(){
    try{savedBank=clampW(Number(localStorage.getItem(BANK_KEY)||0)||0,0,BANK_MAX)}catch(_){savedBank=0}
    weaponShards=savedBank;return savedBank;
  }
  function persistBank(){
    savedBank=clampW(Math.floor(Number(weaponShards)||0),0,BANK_MAX);weaponShards=savedBank;
    try{localStorage.setItem(BANK_KEY,String(savedBank))}catch(_){ }
    return savedBank;
  }
  function setBank(n){weaponShards=clampW(Math.floor(Number(n)||0),0,BANK_MAX);persistBank();updateShardHud();return weaponShards}
  function addBank(n,why='',loud=false){
    const add=Math.max(0,Math.round(Number(n)||0));if(!add)return 0;
    const before=weaponShards;weaponShards=clampW(weaponShards+add,0,BANK_MAX);const actual=weaponShards-before;persistBank();updateShardHud();
    if(actual&&loud){try{txt(pl.x+pl.w/2,pl.y-50,`+${actual} SHARDS`,'#8ff4ff',false);uiChime(actual>=20)}catch(_){ }}
    if(actual&&why&&actual>=10)try{feedLine(`<b style="color:#8ff4ff">+${actual} SHARDS</b> • ${why}`)}catch(_){ }
    return actual;
  }

  function installUi(){
    const stage=document.getElementById('gameStage')||document.querySelector('.stage');if(!stage)return;
    const style=document.createElement('style');style.id='cwmWaveShopStyle';style.textContent=`
      .shardHud,.deathOffer{display:none!important}
      #cwmShardBankHud,#cwmWaveStackHud{position:absolute;z-index:46;left:50%;transform:translateX(-50%);pointer-events:auto;font-family:system-ui,sans-serif}
      #cwmShardBankHud{top:50px;display:flex;align-items:center;gap:8px;padding:5px 9px;border:1px solid #7eeaff38;background:#030a12dc;clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);box-shadow:0 7px 22px #000a}
      #cwmShardBankHud b{font:1000 10px/1 system-ui;color:#94f3ff;letter-spacing:.06em}#cwmShardBankHud span{font:900 8px/1 system-ui;color:#d9e5ee}#cwmShardBankHud button{border:1px solid #ffe36d55;background:#ffe36d12;color:#ffe98f;padding:3px 6px;font:1000 7px system-ui;cursor:pointer}
      #cwmWaveStackHud{top:79px;pointer-events:none;min-width:230px;text-align:center;padding:3px 10px;border-top:1px solid #ff786638;background:linear-gradient(90deg,transparent,#090c13d9 20%,#090c13d9 80%,transparent);font:900 7px/1.3 system-ui;color:#9bb0c0;letter-spacing:.08em}#cwmWaveStackHud b{color:#ffcf77}
      body:not(.cwmArsenalPlaying) #cwmShardBankHud,body:not(.cwmArsenalPlaying) #cwmWaveStackHud{display:none!important}
      .shardForge{z-index:120!important;background:radial-gradient(circle at 50% 35%,rgba(36,20,8,.54),rgba(2,5,10,.96) 72%)!important}
      .cwmMarket{width:min(1060px,94vw);max-height:90vh;overflow:auto;padding:18px;border:1px solid #ffe06b55;background:linear-gradient(150deg,#100d0aea,#050a11f8);box-shadow:0 28px 100px #000;text-align:left;color:#eaf3fb}
      .cwmMarketHead{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;border-bottom:1px solid #ffffff16;padding-bottom:12px}.cwmMarketKicker{font:1000 8px system-ui;letter-spacing:.28em;color:#ffdf6c}.cwmMarket h2{margin:4px 0 2px;font:1000 30px/1 system-ui;color:#fff6bf}.cwmMarketSub{font:800 10px/1.35 system-ui;color:#9fb1bf;max-width:680px}.cwmMarketBank{text-align:right;font:1000 21px/1 system-ui;color:#8ff3ff;white-space:nowrap}.cwmMarketBank small{display:block;margin-top:4px;color:#738896;font:900 7px system-ui;letter-spacing:.15em}
      .cwmMarketGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:13px}.cwmShopCard{position:relative;min-height:142px;padding:10px;border:1px solid color-mix(in srgb,var(--shop-col) 42%,#ffffff20);background:linear-gradient(145deg,color-mix(in srgb,var(--shop-col) 8%,#09111b),#05090f);box-shadow:inset 0 1px 0 color-mix(in srgb,var(--shop-col) 25%,transparent)}.cwmShopTier{font:1000 6.5px system-ui;letter-spacing:.16em;color:var(--shop-col)}.cwmShopName{font:1000 20px/1 system-ui;color:#fff;margin-top:10px;overflow:hidden;text-overflow:clip}.cwmShopDps{font:1000 15px/1 system-ui;color:var(--shop-col);margin-top:5px}.cwmShopRisk{min-height:25px;margin-top:8px;font:800 8px/1.35 system-ui;color:#ff9e87}.cwmShopPrice{margin-top:9px;font:1000 12px system-ui;color:#ffe377}.cwmShopCard button{width:100%;margin-top:7px;padding:7px;border:1px solid color-mix(in srgb,var(--shop-col) 48%,#ffffff18);background:color-mix(in srgb,var(--shop-col) 12%,#07101a);color:#fff;font:1000 8px system-ui;cursor:pointer}.cwmShopCard button:disabled{opacity:.35;cursor:not-allowed}.cwmShopCard.sold{opacity:.35;filter:grayscale(.8)}
      .cwmMarketFoot{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-top:12px;padding-top:10px;border-top:1px solid #ffffff14;font:800 8px/1.35 system-ui;color:#8397a6}.cwmMarketClose{border:1px solid #ffffff26;background:#111925;color:#e8f1f8;padding:8px 12px;font:1000 9px system-ui;cursor:pointer}
      @media(max-width:1100px){.cwmMarketGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.cwmShopCard{min-height:130px}}
    `;document.head.appendChild(style);
    bankHud=document.createElement('div');bankHud.id='cwmShardBankHud';bankHud.innerHTML='<b>◆ <span id="cwmShardBankNum">0</span> SHARDS</b><span>BLACK MARKET</span><button id="cwmShardShopOpen">B // SHOP</button>';stage.appendChild(bankHud);
    waveHud=document.createElement('div');waveHud.id='cwmWaveStackHud';waveHud.innerHTML='<b>WAVE STACK</b>';stage.appendChild(waveHud);
    bankHud.querySelector('#cwmShardShopOpen')?.addEventListener('click',()=>openShardForge());
    if(U.shardHud)U.shardHud.style.display='none';
    if(U.deathOffer)U.deathOffer.style.display='none';
  }

  function updateBankHud(){
    const n=document.getElementById('cwmShardBankNum');if(n)n.textContent=fmt(weaponShards);
    if(waveHud){const alive=live().length;if(wave.active)waveHud.innerHTML=`<b>WAVE ${stageClears+1}</b> // SQUAD ${Math.min(wave.squad,wave.squads)}/${wave.squads} // ${wave.spawned}/${wave.total} DEPLOYED // ${alive} ALIVE`;else waveHud.innerHTML=`<b>WAVE ${stageClears+1}</b> // ${alive?alive+' ALIVE':'STAGING'}`}
  }
  const updateShardHud0=updateShardHud;
  updateShardHud=function(){updateBankHud();return weaponShards};

  const addWeaponShards0=addWeaponShards;
  addWeaponShards=function(w,newD,oldD){
    if(!w||w.__shardShop)return 0;
    const raw=typeof shardValueForWeapon==='function'?shardValueForWeapon(w,newD,oldD):5;
    const gain=Math.max(2,Math.round(raw*1.35));
    const actual=addBank(gain,'weapon salvage',gain>=15);
    if(actual)try{feedLine(`<span style="color:#9fe8ff">${w.name}</span><br>salvaged into <b>${actual} shards</b> • bank ${fmt(weaponShards)}`)}catch(_){ }
    return actual;
  };

  function pickWaveType(list,i){
    const ch=list.filter(x=>CHASERS.has(x)),sup=list.filter(x=>SUPPORT.has(x));
    const support=(i%5===4)||Math.random()<.22;const src=support&&sup.length?sup:(ch.length?ch:list);return pick(src);
  }
  function waveHeat(){return Math.max(0,Number(curW()?.__shardHeat)||0)}
  function offscreenX(d,side){return side<0?-d.w-rand(45,150):W+rand(45,150)}
  function spawnSquad(force=false){
    if(!wave.active||wave.spawned>=wave.total)return 0;
    const current=live().length,room=Math.max(0,LIVE_CAP-current);if(room<=0)return 0;
    const remain=wave.total-wave.spawned,base=6+Math.floor(zoneI/3)+(wave.squad%2),count=Math.min(remain,room,force?Math.max(6,base):base);if(count<=0)return 0;
    const po=pool();let made=0;
    for(let i=0;i<count;i++){
      const type=pickWaveType(po,wave.spawned+i),d=ED[type];if(!d)continue;
      const side=((wave.squad+i)%2===0)?-1:1,off=Math.random()<.76;
      const x=off?offscreenX(d,side):(side<0?rand(8,72):W-d.w-rand(8,72));
      const eliteChance=.035+zoneI*.012+wave.heat*.008+(wave.squad>=3?.02:0);
      const elite=Math.random()<Math.min(.32,eliteChance);
      spawn(type,x,elite,d.air?null:G);
      const e=E.at(-1);if(!e)continue;
      e.__stackWave=true;e.__stackSquad=wave.squad;e.__waveOffscreen=off;
      const hpScale=wave.total>=46?.86:wave.total>=32?.91:.96;if(!elite){e.max=Math.max(1,Math.round(e.max*hpScale));e.hp=e.max}
      e.dmg=Math.max(1,Math.round(e.dmg*(1+Math.min(.26,wave.heat*.012))));
      if(off)wave.offscreen++;made++;
    }
    wave.spawned+=made;wave.squad++;wave.peak=Math.max(wave.peak,live().length);wave.nextAt=time+Math.max(.48,.88-zoneI*.025-wave.heat*.012);
    if(made){try{const side=wave.squad%2?-1:1;part(side<0?12:W-12,G-36,'#ff9b68',6,95,4)}catch(_){ }}
    updateBankHud();return made;
  }

  const spawnPack0=spawnPack;
  spawnPack=function(){
    if(bossMode||boonChoosing||riftReady)return spawnPack0();
    try{
      rollDirector();const q=rarityRank(curW()),heat=waveHeat(),surge=(pack%4===0?4:0)+(directorEvent?.id==='eliteunion'?4:0)+(directorEvent?.id==='airborne'?2:0);
      const total=clampW(20+zoneI*2+Math.floor(stageClears*1.6)+Math.floor(q/3)+Math.round(heat*1.35)+surge,20,64);
      wave={active:true,total,spawned:0,squad:0,squads:Math.max(2,Math.ceil(total/8)),nextAt:time,peak:0,offscreen:0,heat,lastTotal:total};
      const initial=Math.min(total,clampW(11+Math.floor(zoneI/4),11,14));
      const po=pool();for(let i=0;i<initial;i++){
        const type=pickWaveType(po,i),d=ED[type],side=i%2===0?-1:1,off=Math.random()<.78;
        const x=off?offscreenX(d,side):(side<0?rand(8,68):W-d.w-rand(8,68));
        const elite=(i===0&&pack%5===0)||Math.random()<Math.min(.28,.04+zoneI*.012+heat*.008);
        spawn(type,x,elite,d.air?null:G);const e=E.at(-1);if(!e)continue;e.__stackWave=true;e.__stackSquad=0;e.__waveOffscreen=off;
        const hpScale=total>=46?.86:total>=32?.91:.96;if(!elite){e.max=Math.max(1,Math.round(e.max*hpScale));e.hp=e.max}e.dmg=Math.max(1,Math.round(e.dmg*(1+Math.min(.26,heat*.012))));if(off)wave.offscreen++;wave.spawned++;
      }
      wave.squad=1;wave.peak=live().length;wave.nextAt=time+Math.max(.52,.82-zoneI*.02-heat*.01);
      pack++;packStartedAt=time;packLive=true;rollTerrain();if(zoneI>0&&Math.random()<Math.min(.46,.14+zoneI*.045))startChaos();
      try{txt(W/2,96,`WAVE ${stageClears+1} // ${total} INBOUND`,'#ffcf79',false)}catch(_){ }
      U.msg.textContent=`Wave ${stageClears+1}: ${total} hostiles are arriving in stacked squads. Most are entering from outside the camera.${heat?` Your black-market weapon added +${Math.round(heat*1.35)} heat hostiles.`:''}`;
      updateBankHud();return wave.spawned;
    }catch(err){console.warn('Stack-wave fallback',err);wave.active=false;return spawnPack0()}
  };

  const update0=update;
  update=function(dt){
    if(wave.active&&!bossMode){
      const n=live().length;if(wave.spawned<wave.total&&((n===0)||(n<=18&&time>=wave.nextAt)))spawnSquad(n===0);
      wave.peak=Math.max(wave.peak,live().length);
    }
    const r=update0(dt);updateBankHud();return r;
  };

  const registerClear0=registerClear;
  registerClear=function(){
    const eligible=wave.active&&wave.spawned>=wave.total,last=wave.lastTotal||wave.total,peak=wave.peak;
    wave.active=false;const r=registerClear0();
    if(eligible){const bonus=Math.max(6,Math.round(last*.42+peak*.28+zoneI*2));addBank(bonus,`wave ${stageClears} clear`,true)}
    shopEpoch='';updateBankHud();return r;
  };

  const killE0=killE;
  killE=function(e,...args){
    const wasAlive=!!e&&!e.dead,r=killE0(e,...args);
    if(wasAlive&&e&&(e.dead||e.hp<=0)){
      let gain=e.boss?80+Math.max(0,Number(e.bossOrdinal)||zoneI+1)*35:1+Math.floor(zoneI/4);
      if(e.elite)gain+=3;if(e.__nightMutant==='ABOMINATION')gain+=6;if((killChainCount||0)>=6)gain+=Math.min(5,Math.floor(killChainCount/6));
      addBank(gain,e.boss?'boss liquidation':e.__nightMutant==='ABOMINATION'?'abomination salvage':'',gain>=8);
    }
    return r;
  };

  function candidateTier(t,i){
    const rank=clampW(Math.round((R.length-1)*t.pct),0,R.length-1),lvl=Math.max(pl.lv,Z[zoneI].lv)+1+i*2;
    let w=makeExactRankWeapon(lvl,rank),ars=globalThis.CWM_ARSENAL_V14;
    if(ars?.models?.[w.type]){const models=ars.models[w.type],model=models[(i+zoneI+pack)%models.length];ars.forceModel(w,model.name)}
    const poolEl=i>=3?RISK_ELEMENTS:SAFE_ELEMENTS;ars?.forceElement?.(w,poolEl[(i+pack+zoneI)%poolEl.length]);
    let d=estimateDPS(w),cur=Math.max(1,estimateDPS(curW())),target=cur*(t.power+i*.035);if(d<target){w.m*=target/Math.max(1,d);d=estimateDPS(w)}
    w.__shardShop=true;w.__shardHeat=t.heat;w.__shopTier=i;w.fromShardForge=true;w.text=(w.text||'')+` BLACK MARKET HEAT: +${Math.round(t.heat*1.35)} hostiles per wave and up to ${Math.round(Math.min(.26,t.heat*.012)*100)}% enemy damage.`;
    return{tier:t,weapon:w,dps:Math.round(d),sold:false};
  }
  function stockKey(){return `${zoneI}:${pack}:${stageClears}`}
  function ensureStock(force=false){
    const key=stockKey();if(force||shopEpoch!==key||!shopStock.length){shopEpoch=key;shopStock=TIERS.map(candidateTier)}return shopStock;
  }
  function renderShop(){
    ensureStock();if(!U.shardForge)return;const cards=shopStock.map((s,i)=>{const afford=weaponShards>=s.tier.price&&!s.sold;return `<div class="cwmShopCard${s.sold?' sold':''}" style="--shop-col:${s.tier.col}"><div class="cwmShopTier">${s.tier.label}</div><div class="cwmShopName">${firstWord(s.weapon.name)}</div><div class="cwmShopDps">${maskedDps(s.dps)}</div><div class="cwmShopRisk">${s.tier.heat?`DANGER HEAT +${s.tier.heat} // attracts more hostiles and makes them hit harder`:'Low heat // suspiciously reasonable'}</div><div class="cwmShopPrice">◆ ${fmt(s.tier.price)}</div><button data-shop-buy="${i}" ${afford?'':'disabled'}>${s.sold?'SOLD':afford?'BUY BLIND':'TOO POOR'}</button></div>`}).join('');
    U.shardForge.innerHTML=`<div class="cwmMarket"><div class="cwmMarketHead"><div><div class="cwmMarketKicker">SHARD BLACK MARKET // NO REFUNDS // NO DICE</div><h2>DANGEROUS INVENTORY</h2><div class="cwmMarketSub">You are allowed to see only the first word and first digit of DPS. Higher shelves are rarer, stronger, and attract much worse company.</div></div><div class="cwmMarketBank">◆ ${fmt(weaponShards)}<small>SHARDS BANKED</small></div></div><div class="cwmMarketGrid">${cards}</div><div class="cwmMarketFoot"><span>Stock refreshes with the next combat wave. The 25,000,000-shard shelf is not a typo.</span><button class="cwmMarketClose" id="cwmMarketClose">CLOSE // B</button></div></div>`;
    U.shardForge.querySelectorAll('[data-shop-buy]').forEach(b=>b.addEventListener('click',()=>buyShop(Number(b.dataset.shopBuy))));U.shardForge.querySelector('#cwmMarketClose')?.addEventListener('click',closeShardForge);
  }
  openShardForge=function(){
    if(shopOpen||deathOfferOpen||boonChoosing||bossMode||!gameStarted||over)return false;shopOpen=true;shardForgeOpen=true;shopWasPaused=paused;paused=true;renderShop();U.shardForge?.classList.add('show');try{uiChime(true)}catch(_){ }return true;
  };
  closeShardForge=function(){shopOpen=false;shardForgeOpen=false;U.shardForge?.classList.remove('show');if(!over&&!boonChoosing&&!deathOfferOpen)paused=shopWasPaused;updateBankHud();return true};
  rollShardForge=function(){return false};
  revealShardForge=function(){return false};
  function buyShop(i){
    const s=ensureStock()[i];if(!s||s.sold||weaponShards<s.tier.price)return false;
    weaponShards-=s.tier.price;persistBank();s.sold=true;shopBought++;
    const w=s.weapon;const before=estimateDPS(curW());let d=estimateDPS(w);if(d<=before*1.01){w.m*=before*1.04/Math.max(1,d);d=estimateDPS(w)}
    equip(w);try{txt(pl.x+pl.w/2,pl.y-62,'BLACK MARKET ACQUISITION',w.col,true);ring(pl.x+pl.w/2,pl.y+pl.h/2,w.col,120,5)}catch(_){ }
    renderShop();setTimeout(closeShardForge,90);return true;
  }

  const reset0=reset;
  reset=function(){const bank=persistBank(),r=reset0();weaponShards=bank;persistBank();wave.active=false;shopOpen=false;shardForgeOpen=false;shopEpoch='';updateShardHud();return r};

  const openDeathOffer0=openDeathOffer;
  openDeathOffer=function(){deathOfferOpen=false;U.deathOffer?.classList.remove('show');return false};

  document.addEventListener('keydown',e=>{if(String(e.key).toLowerCase()!=='b'||e.repeat)return;if(!gameStarted||over)return;e.preventDefault();shopOpen?closeShardForge():openShardForge()});
  U.shardForge?.addEventListener('pointerdown',e=>{if(shopOpen&&e.target===U.shardForge)closeShardForge()});

  function smoke(){
    const root=document.documentElement,out={ok:false};
    try{
      const d=globalThis.__KM_DEBUG;if(!d)throw new Error('debug missing');d.start();d.setZone(3);E=[];P=[];Q=[];F=[];pack=4;stageClears=2;pl.inv=999;
      setBank(30000000);shopEpoch='';ensureStock(true);openShardForge();
      const cards=[...U.shardForge.querySelectorAll('.cwmShopCard')],masked=cards.length===TIERS.length&&cards.every(c=>/^\S+$/.test(c.querySelector('.cwmShopName')?.textContent||'')&&/^\d… DPS$/.test(c.querySelector('.cwmShopDps')?.textContent||''));
      const noD20=!/D20|DICE ROLL|ROLL THE/i.test(U.shardForge.textContent||'');const beforeBank=weaponShards,bought=buyShop(0),purchase=bought&&weaponShards<beforeBank&&!!curW().__shardShop;
      setBank(4321);persistBank();weaponShards=0;const persistent=loadBank()===4321;
      closeShardForge();E=[];pack=4;stageClears=2;curW().__shardHeat=5;const first=spawnPack(),initial=live().length,off=E.filter(e=>e.__waveOffscreen).length;const second=spawnSquad(true),stacked=live().length;
      out.ok=first>=10&&initial>=10&&stacked>initial&&stacked<=LIVE_CAP&&off>0&&masked&&noD20&&purchase&&persistent&&TIERS.at(-1).price>=1000000;
      root.dataset.cwmWaveShopProof=out.ok?'pass':'fail';root.dataset.cwmWaveStack=stacked>initial&&stacked<=LIVE_CAP?'pass':'fail';root.dataset.cwmWaveOffscreen=off>0?'pass':'fail';root.dataset.cwmShopD20=noD20?'removed':'present';root.dataset.cwmShopMask=masked?'pass':'fail';root.dataset.cwmShopCards=String(cards.length);root.dataset.cwmShopPurchase=purchase?'pass':'fail';root.dataset.cwmShopPersistent=persistent?'pass':'fail';root.dataset.cwmShopMaxPrice=String(TIERS.at(-1).price);root.dataset.cwmWaveInitial=String(initial);root.dataset.cwmWaveStacked=String(stacked);root.dataset.cwmWaveTotal=String(wave.total);
    }catch(err){root.dataset.cwmWaveShopProof='fail';root.dataset.cwmWaveShopError=String(err?.message||err);console.error('Wave/shop smoke failed',err)}
    return out;
  }

  installUi();loadBank();updateShardHud();
  try{const qs=new URLSearchParams(location.search);if(qs.get('waveShopSmoke')==='1')setTimeout(smoke,1800)}catch(_){ }
  globalThis.CWM_WAVE_SHOP_V20={version:'v20-stacked-waves-black-market',tiers:TIERS,wave,bank:()=>weaponShards,setBank,addBank,open:openShardForge,close:closeShardForge,buy:buyShop,stock:()=>ensureStock(),forceSquad:()=>spawnSquad(true),smoke};
})();

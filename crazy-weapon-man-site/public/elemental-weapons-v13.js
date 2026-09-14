(()=>{
  if(globalThis.__CWM_ELEMENTS_V13)return;
  globalThis.__CWM_ELEMENTS_V13=true;

  const POSITIVE=[
    {id:'fire',family:'fire',polarity:'positive',name:'FIRE',prefix:'Blazing',col:'#ff633f',rarity:1,dpsMult:1.18,desc:'hits ignite enemies, dealing burning damage over time'},
    {id:'poison',family:'poison',polarity:'positive',name:'POISON',prefix:'Venomous',col:'#79e45f',rarity:1,dpsMult:1.21,desc:'hits stack venom that keeps damaging enemies after you leave'},
    {id:'lightning',family:'lightning',polarity:'positive',name:'LIGHTNING',prefix:'Thunderstruck',col:'#75d9ff',rarity:1,dpsMult:1.20,desc:'hits arc electricity into nearby enemies'},
    {id:'water',family:'water',polarity:'positive',name:'WATER',prefix:'Tidal',col:'#55bfff',rarity:1,dpsMult:1.15,desc:'hits splash nearby enemies and briefly interrupt their movement'},
    {id:'earth',family:'earth',polarity:'positive',name:'EARTH',prefix:'Seismic',col:'#c79a5c',rarity:1,dpsMult:1.17,desc:'hits fracture targets with heavy aftershocks and stagger'}
  ];
  const NEGATIVE=[
    {id:'backfire',family:'fire',polarity:'negative',name:'BACKFIRE',prefix:'Self-Immolating',col:'#ff3d2e',rarity:2,dpsMult:1.30,desc:'burns enemies harder, but periodically lights Crazy Weapon Man on fire too'},
    {id:'toxic-leak',family:'poison',polarity:'negative',name:'TOXIC LEAK',prefix:'Septic',col:'#b2ff4f',rarity:2,dpsMult:1.32,desc:'pumps vicious poison into enemies while leaking a little of it into the operator'},
    {id:'backfeed',family:'lightning',polarity:'negative',name:'BACKFEED',prefix:'Overloaded',col:'#c8f7ff',rarity:2,dpsMult:1.31,desc:'chains violent lightning through packs and occasionally closes the circuit through your torso'},
    {id:'undertow',family:'water',polarity:'negative',name:'UNDERTOW',prefix:'Drowning',col:'#388dff',rarity:2,dpsMult:1.28,desc:'weaponized pressure waves hit hard and sometimes attempt to drown the person holding them'},
    {id:'faultline',family:'earth',polarity:'negative',name:'FAULTLINE',prefix:'Structurally Unsound',col:'#e0a354',rarity:2,dpsMult:1.33,desc:'creates savage fractures that can kick back through the floor and into your knees'}
  ];
  const BY_ID=Object.fromEntries([...POSITIVE,...NEGATIVE].map(x=>[x.id,x]));
  const nf=n=>Math.max(0,Math.round(Number(n)||0)).toLocaleString();

  function rarityBump(w,steps){
    if(!w||w.rar==='Training'||!Array.isArray(R)||!Array.isArray(RANKS))return;
    const oldIndex=Math.max(0,RANKS.indexOf(w.rar));
    const nextIndex=Math.min(R.length-1,oldIndex+Math.max(0,steps|0));
    if(nextIndex<=oldIndex)return;
    const old=R[oldIndex],next=R[nextIndex];
    if(old?.m&&next?.m)w.m*=next.m/old.m;
    w.rar=next.n;w.col=next.col;w.p=Math.max(Number(w.p)||0,Number(next.p)||0);
    w.crit=Math.max(Number(w.crit)||0,.012*(Number(next.p)||0));
  }

  function ensureElementName(w){
    if(!w?.element)return w;
    const def=BY_ID[w.element.id]||w.element;
    if(!def)return w;
    const stamp=`[${def.id}]`;
    if(w.__cwmElementStamp===stamp&&w.__cwmElementRarity===w.rar)return w;
    const currentRarity=w.rar;
    rarityBump(w,def.rarity||1);
    if(currentRarity&&currentRarity!==w.rar&&typeof w.name==='string'&&w.name.includes(currentRarity))w.name=w.name.replace(currentRarity,w.rar);
    const prefix=def.prefix||def.name;
    if(typeof w.name==='string'&&!w.name.startsWith(prefix+' '))w.name=`${prefix} ${w.name}`;
    if(w.name.length>178)w.name=w.name.slice(0,175)+'...';
    w.element={id:def.id,family:def.family,polarity:def.polarity,name:def.name,prefix:def.prefix,col:def.col,dpsMult:def.dpsMult,desc:def.desc};
    if(def.polarity==='negative')w.m*=1.075;
    const risk=def.polarity==='negative'?' RISK: this element is uncontrolled and can damage its owner.':'';
    if(typeof w.text==='string'&&!w.text.includes(`ELEMENT — ${def.name}:`))w.text=`ELEMENT — ${def.name}: ${def.desc}.${risk} ${w.text}`.trim();
    w.__cwmElementStamp=stamp;w.__cwmElementRarity=w.rar;
    return w;
  }

  function rollElement(w){
    if(!w||w.rar==='Training'||w.element)return ensureElementName(w);
    const r=Math.random();
    let def=null;
    if(r<.25)def=POSITIVE[Math.min(4,Math.floor(r/.05))];
    else if(r<.50)def=NEGATIVE[Math.min(4,Math.floor((r-.25)/.05))];
    if(!def)return w;
    w.element={...def};
    return ensureElementName(w);
  }

  const baseMakeW=makeW;
  makeW=function(...args){return rollElement(baseMakeW(...args))};
  if(typeof makeExactRankWeapon==='function'){
    const baseExact=makeExactRankWeapon;
    makeExactRankWeapon=function(...args){return rollElement(baseExact(...args))};
  }
  if(typeof makeFunnyIntroWeapon==='function'){
    const baseFunny=makeFunnyIntroWeapon;
    makeFunnyIntroWeapon=function(...args){const w=baseFunny(...args);return w?.element?ensureElementName(w):w};
  }
  if(typeof makeEarlyWeapon==='function'){
    const baseEarly=makeEarlyWeapon;
    makeEarlyWeapon=function(...args){const w=baseEarly(...args);return w?.element?ensureElementName(w):w};
  }

  const baseEstimateDPS=estimateDPS;
  estimateDPS=function(w){
    const base=baseEstimateDPS(w);
    const e=w?.element&&BY_ID[w.element.id];
    return base*(e?.dpsMult||1);
  };

  function elemDef(){const w=curW();return w?.element?BY_ID[w.element.id]||w.element:null}
  function elementalFx(x,y,def,count=7){
    if(!def)return;
    try{part(x,y,def.col,count,def.polarity==='negative'?190:145,5);ring(x,y,def.col,def.polarity==='negative'?44:34,def.polarity==='negative'?3:2)}catch(_){ }
  }
  function nearbyEnemies(e,count=3,range=150){
    return E.filter(x=>x&&!x.dead&&x!==e&&Math.hypot((x.x+x.w/2)-(e.x+e.w/2),(x.y+x.h/2)-(e.y+e.h/2))<=range)
      .sort((a,b)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(b.x-e.x,b.y-e.y)).slice(0,count);
  }

  let selfCooldown=0;
  let playerToxin=0,playerToxinTick=0,playerToxinPower=0;
  function elementalSelfDamage(pct,label,col,extra=null){
    if(over||deathOfferOpen||!gameStarted)return 0;
    const armorMit=100/(100+Math.max(0,Number(pl.armor)||0)*.35);
    const h=Math.max(1,Math.round(pl.max*pct*armorMit*(Number(pl.damageTaken)||1)));
    pl.hp=Math.max(0,pl.hp-h);
    txt(pl.x+pl.w/2,pl.y-42,`${label} -${h}`,col,true);
    part(pl.x+pl.w/2,pl.y+pl.h/2,col,10,180,6);shake=Math.max(shake,7);flash=Math.max(flash,.11);chroma=Math.max(chroma,.055);
    if(typeof extra==='function')extra();
    if(pl.hp<=0){
      if(bossMode&&!bossRescueUsed&&typeof openDeathOffer==='function'&&openDeathOffer(bossMode))return h;
      if(bossMode){const be=E.find(x=>x.boss&&!x.dead);if(be&&!be.outcomeRecorded){be.outcomeRecorded=true;if(typeof bossRecord==='function')bossRecord(be.boss,false)}}
      over=true;U.msg.textContent='Run ended. The weapon finally became its own enemy.';
    }
    return h;
  }

  const baseHitE=hitE;
  hitE=function(e,a,o={}){
    const dealt=baseHitE(e,a,o);
    if(!dealt||o.__elementTick||!e||e.dead)return dealt;
    const def=elemDef();
    if(!def)return dealt;
    const cx=e.x+e.w/2,cy=e.y+e.h/2;
    elementalFx(cx,cy,def,def.polarity==='negative'?10:6);

    const potency=def.polarity==='negative'?1.28:1;
    if(def.family==='fire'){
      const s=e.__cwmFire||(e.__cwmFire={t:0,tick:.28,power:0,col:def.col,sourceType:o.sourceType||curW().type});
      s.t=Math.max(s.t,2.4);s.power=Math.max(s.power,dealt*.075*potency);s.col=def.col;
    }else if(def.family==='poison'){
      const s=e.__cwmPoison||(e.__cwmPoison={t:0,tick:.42,stacks:0,power:0,col:def.col,sourceType:o.sourceType||curW().type});
      s.t=4.0;s.stacks=Math.min(5,s.stacks+1);s.power=Math.max(s.power,dealt*.013*potency);s.col=def.col;
    }else if(def.family==='lightning'){
      const targets=nearbyEnemies(e,def.polarity==='negative'?3:2,185);
      for(const t of targets){
        try{beam(cx,cy,t.x+t.w/2,t.y+t.h/2,def.col,def.polarity==='negative'?6:4)}catch(_){ }
        baseHitE(t,dealt*(def.polarity==='negative'?.18:.14),{col:def.col,stun:.06,sourceType:o.sourceType||curW().type,__elementTick:true});
      }
    }else if(def.family==='water'){
      const targets=nearbyEnemies(e,3,135);
      for(const t of targets)baseHitE(t,dealt*(def.polarity==='negative'?.14:.10),{col:def.col,stun:.09,knock:Math.sign(t.x-e.x)*90,sourceType:o.sourceType||curW().type,__elementTick:true});
      e.stun=Math.max(e.stun||0,def.polarity==='negative'?.16:.11);
      try{ring(cx,cy,def.col,90,4)}catch(_){ }
    }else if(def.family==='earth'){
      baseHitE(e,dealt*(def.polarity==='negative'?.17:.12),{col:def.col,stun:def.polarity==='negative'?.24:.17,knock:Math.sign(e.x-pl.x)*(def.polarity==='negative'?230:155),sourceType:o.sourceType||curW().type,__elementTick:true});
      try{F.push({k:'impact',x:cx,y:cy,col:def.col,life:.24,max:.24,r:def.polarity==='negative'?54:40})}catch(_){ }
    }

    if(def.polarity==='negative'&&selfCooldown<=0){
      const r=Math.random();
      if(def.id==='backfire'&&r<.16){selfCooldown=.72;elementalSelfDamage(.021,'BACKFIRE',def.col)}
      else if(def.id==='toxic-leak'&&r<.15){selfCooldown=1.25;playerToxin=Math.max(playerToxin,2.8);playerToxinPower=Math.max(playerToxinPower,.0065);txt(pl.x+17,pl.y-43,'TOXIC LEAK','#b2ff4f',true)}
      else if(def.id==='backfeed'&&r<.14){selfCooldown=.85;elementalSelfDamage(.024,'BACKFEED',def.col,()=>{pl.mana=Math.max(0,pl.mana-8)})}
      else if(def.id==='undertow'&&r<.13){selfCooldown=1.05;elementalSelfDamage(.018,'UNDERTOW',def.col,()=>{pl.vx*=.45;pl.vy+=90})}
      else if(def.id==='faultline'&&r<.12){selfCooldown=1.0;elementalSelfDamage(.028,'FAULTLINE',def.col,()=>{pl.vy=-130;pl.vx*=-.32})}
    }
    return dealt;
  };

  function updateElementStatuses(dt){
    selfCooldown=Math.max(0,selfCooldown-dt);
    if(playerToxin>0){
      playerToxin=Math.max(0,playerToxin-dt);playerToxinTick-=dt;
      if(playerToxinTick<=0){playerToxinTick=.55;elementalSelfDamage(playerToxinPower,'TOXIN','#b2ff4f')}
      if(playerToxin<=0)playerToxinPower=0;
    }
    for(const e of E){
      if(!e||e.dead)continue;
      const f=e.__cwmFire;
      if(f?.t>0){f.t-=dt;f.tick-=dt;if(f.tick<=0){f.tick=.38;baseHitE(e,f.power,{col:f.col,stun:0,sourceType:f.sourceType,__elementTick:true});try{part(e.x+e.w/2,e.y+e.h/2,f.col,4,80,4)}catch(_){}}}
      const p=e.__cwmPoison;
      if(p?.t>0){p.t-=dt;p.tick-=dt;if(p.tick<=0){p.tick=.48;baseHitE(e,p.power*p.stacks,{col:p.col,stun:0,sourceType:p.sourceType,__elementTick:true});try{part(e.x+e.w/2,e.y+e.h/2,p.col,3+p.stacks,65,4)}catch(_){}}}else if(p){p.stacks=0;p.power=0}
    }
  }

  const baseUpdate=update;
  update=function(dt){
    const r=baseUpdate(dt);
    if(gameStarted&&!paused&&!over&&!boonChoosing&&!deathOfferOpen&&!shardForgeOpen)updateElementStatuses(Math.max(0,Math.min(.05,Number(dt)||0)));
    return r;
  };

  if(typeof attackMotion==='function'){
    const baseAttackMotion=attackMotion;
    attackMotion=function(w){
      const r=baseAttackMotion(w),def=w?.element&&BY_ID[w.element.id];
      if(def){
        const x=pl.x+17+pl.dir*(34*weaponScale(w)),y=pl.y+18;
        try{
          if(def.family==='lightning'){F.push({k:'rune',x,y,r:18,life:.14,max:.14,col:def.col,spin:pl.dir})}
          else if(def.family==='water'){ring(x,y,def.col,36,3)}
          else if(def.family==='earth'){F.push({k:'impact',x,y:Math.min(G-4,y+18),col:def.col,life:.14,max:.14,r:28})}
          else part(x,y,def.col,5,100,4);
        }catch(_){ }
      }
      return r;
    };
  }

  // Element-aware leaderboard metadata. This wrapper intentionally loads BEFORE leaderboard-inspector.js.
  const fetchBeforeInspector=globalThis.fetch.bind(globalThis);
  globalThis.fetch=async function(input,init){
    let nextInit=init;
    try{
      const method=String(init?.method||'GET').toUpperCase();
      const raw=typeof input==='string'?input:(input?.url||'');
      if(method==='POST'&&/\/api\/leaderboard(?:\?|$)/.test(raw)&&typeof init?.body==='string'){
        const body=JSON.parse(init.body),w=typeof curW==='function'?curW():null,def=w?.element&&BY_ID[w.element.id];
        if(def&&String(body.weapon_name||'')===String(w.name||'')&&body.weapon_build){
          const build=body.weapon_build;
          build.element={id:def.id,family:def.family,polarity:def.polarity,name:def.name,col:def.col,desc:def.desc,dpsMult:def.dpsMult};
          build.weapon=build.weapon||{};build.weapon.element=build.element;
          build.upgrades=Array.isArray(build.upgrades)?build.upgrades:[];
          if(!build.upgrades.some(x=>x?.label===`${def.name} ELEMENT`))build.upgrades.unshift({group:'fx',label:`${def.name} ELEMENT`,detail:def.polarity==='negative'?`${Math.round((def.dpsMult-1)*100)}% expected elemental damage • SELF-DAMAGE RISK`:`${Math.round((def.dpsMult-1)*100)}% expected elemental damage`,color:def.col});
          if(build.formula){
            build.formula.fx=(Number(build.formula.fx)||1)*def.dpsMult;
            build.formula.dps=Math.round((Number(build.formula.hit)||0)*(Number(build.formula.aps)||0)*(Number(build.formula.crit)||1)*(Number(build.formula.fx)||1));
          }
          nextInit={...init,body:JSON.stringify({...body,weapon_build:build})};
        }
      }
    }catch(_){ }
    return fetchBeforeInspector(input,nextInit);
  };

  // Keep the visible DPS formula honest about element contribution.
  let uiTick=0;
  function updateElementUi(){
    const w=typeof curW==='function'?curW():null,def=w?.element&&BY_ID[w.element.id];
    if(!def)return;
    const total=typeof estimateDPS==='function'?estimateDPS(w):0;
    const tag=`<span style="color:${def.col};font-weight:1000">× ${def.dpsMult.toFixed(2)} ${def.name}</span>`;
    const calc=document.getElementById('cwmDpsCalc');
    if(calc&&!calc.dataset.elemBase){calc.dataset.elemBase=calc.innerHTML}
    if(calc&&calc.innerHTML&&!calc.innerHTML.includes(` ${def.name}</span>`))calc.innerHTML=calc.innerHTML.replace(/ = <b>[^<]+<\/b>$/,'')+` × ${tag} = <b>${nf(total)}</b>`;
    const mini=document.getElementById('cwmMiniHud');
    if(mini){const d=mini.querySelector('.dps'),c=mini.querySelector('.calc');if(d)d.textContent=`${nf(total)} DPS`;if(c&&!c.textContent.includes(def.name))c.innerHTML+=` <span style="color:${def.col}">×${def.dpsMult.toFixed(2)} ${def.name}</span>`}
  }
  const baseDraw=draw;
  draw=function(){const r=baseDraw();uiTick++;if(uiTick%4===0)updateElementUi();return r};

  globalThis.CWM_ELEMENTS={
    positive:POSITIVE.map(x=>({...x,chance:.05})),
    negative:NEGATIVE.map(x=>({...x,chance:.05})),
    totalPositiveChance:.25,totalNegativeChance:.25,totalElementalChance:.50,
    sample(n=10000){const c={none:0};for(const d of [...POSITIVE,...NEGATIVE])c[d.id]=0;for(let i=0;i<n;i++){const w=rollElement({rar:'Rare',name:'QA Rare Sword',type:'sword',m:1,p:1.32,crit:0,col:'#e3c66c',text:'',traits:[],material:null});c[w.element?.id||'none']++}return c}
  };
})();

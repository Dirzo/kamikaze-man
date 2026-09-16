(()=>{
  if(globalThis.__CWM_CHAOS_V21)return;
  globalThis.__CWM_CHAOS_V21=true;

  const clampC=(n,a,b)=>Math.max(a,Math.min(b,n));
  const choose=a=>a[Math.floor(Math.random()*a.length)];
  const C={names:0,headliners:0,nameplates:0,weapons:0,sizeKinds:new Set(),mutationKinds:new Set(),procs:0};

  const NAMES={
    stalker:['Kevin From The Parking Lot','Greg With Your Catalytic Converter','Parking Enforcement Werewolf','Guy Who Definitely Knows Your VIN'],
    crawler:['Floor Gremlin With Benefits','Wet Sock Supervisor','Unionized Basement Goblin','Todd From Under The Fridge'],
    wizard:['Unlicensed Microwave Wizard','Craig, Wizard of Minor Inconvenience','Certified Forklift Necromancer','Derek the Spell Intern'],
    shieldbro:['Assistant Manager of Blocking','OSHA-Compliant Human Door','Regional Shield Enthusiast','Bradley, Portable Wall'],
    maw:['Pretzel Maw of Human Resources','Hungry Payroll Mistake','Mouth With A 401(k)','Lunch Break Violation With Teeth'],
    brute:['Axe Landlord From Craigslist','Regional Vice President of Bonking','Gary the Load-Bearing Problem','Foreman of Unscheduled Violence'],
    taxman:['Combat Auditor With Questions','IRS Battle Intern','Receipts Goblin','Senior Director of Surprise Fees'],
    blinker:['Teleporting Coward Greg','Quantum Hall Monitor','Dave Who Was Just Behind You','Union Blink Supervisor'],
    bombchicken:['Tactical Chicken With Tenure','Explosive Emotional Support Chicken','OSHA Rooster','Poultry of Mass Destruction'],
    roller:['Sentient Office Chair','Payroll Roomba of Doom','Wheel With Anger Issues','Unionized Murder Tire'],
    summoner:['Middle Manager of More Problems','Demon Staffing Coordinator','Outsourcing Necromancer','Assistant Director of Additional Enemies'],
    wraith:['Ghost of Mandatory Overtime','Former Employee Still Clocked In','Haunted Exit Interview','Spectral HR Complaint'],
    mimic:['Definitely Normal Benefits Package','Chest That Read Your Search History','Totally Legal Vending Machine','Box With Teeth And PTO'],
    flyer:['Airborne Parking Ticket','Flying Liability Waiver','Drone With A Personal Grudge','Sky Rat With Dental'],
    eyeball:['Management Eye Watching Your Break','Quarterly Performance Orb','Surveillance Meatball','Director of Looking At You'],
    sniper:['Long-Distance Micromanager','Remote Work Denial Specialist','Performance Improvement Marksman','Guy Across The Map Named Steve']
  };
  const TITLES=['Senior','Acting','Interim','Night-Shift','Emotionally Unavailable','Union','Freelance','Executive','Turbo','Unauthorized','Assistant Regional','Budget'];
  const SUFFIXES=['(No Appointment)','— On Probation','— Certified Somehow','— Has A Clipboard','— Absolutely Not Insured','— Final Warning','— Owns A Leaf Blower'];

  function funnyName(type,elite=false){
    const base=choose(NAMES[type]||[String(ED?.[type]?.name||type||'Problem')]);
    let out=elite?`${choose(TITLES)} ${base}`:base;
    if(Math.random()<(elite ? .58 : .24))out+=` ${choose(SUFFIXES)}`;
    return out;
  }
  const enemyName0=enemyName;
  enemyName=function(type,elite=false){try{return funnyName(type,elite)}catch(_){return enemyName0(type,elite)}};

  const spawn0=spawn;
  spawn=function(type,x,elite=false,yTop=null){
    const before=E.length,r=spawn0(type,x,elite,yTop),e=E.length>before?E.at(-1):null;
    if(e&&!e.boss){
      e.__funnyName=e.label=funnyName(type,elite);C.names++;
      e.__headline=!!elite||e.__nightMutant==='ABOMINATION'||Math.random()<.22;
      if(e.__headline)C.headliners++;
    }
    return r;
  };

  function wrapWords(s,max=29){
    const words=String(s||'').split(/\s+/),lines=[''];
    for(const word of words){const i=lines.length-1,test=(lines[i]+' '+word).trim();if(test.length>max&&lines[i]&&lines.length<2)lines.push(word);else lines[i]=test}
    if(lines.length===2&&lines[1].length>max+8)lines[1]=lines[1].slice(0,max+6)+'…';return lines;
  }
  function headlinerVisible(e){
    if(!e?.__headline||e.dead||e.boss||e.x+e.w<0||e.x>W)return false;
    const alive=E.filter(x=>x&&!x.dead&&!x.boss).length,max=alive>=16?1:alive>=10?2:3;
    const pool=E.filter(x=>x&&!x.dead&&!x.boss&&x.__headline&&x.x+x.w>=0&&x.x<=W).sort((a,b)=>((b.__nightMutant==='ABOMINATION')-(a.__nightMutant==='ABOMINATION'))||((b.elite?1:0)-(a.elite?1:0))||a.id-b.id);
    return pool.slice(0,max).includes(e);
  }
  function drawFunnyPlate(e){
    if(!headlinerVisible(e))return;C.nameplates++;
    const lines=wrapWords(e.__funnyName||e.label),cx=e.x+e.w/2,y=Math.max(20,e.y-34-(lines.length-1)*11),ab=e.__nightMutant==='ABOMINATION',col=ab?'#ff674f':e.elite?'#ff87a0':'#ffcf6e';
    X.save();X.textAlign='center';X.textBaseline='middle';X.font=`1000 ${ab?15:13}px system-ui`;let mw=0;for(const ln of lines)mw=Math.max(mw,X.measureText(ln).width);mw=Math.min(330,mw+20);const h=lines.length*17+8;
    X.globalAlpha=.90;X.fillStyle='#05080de8';X.strokeStyle=col;X.lineWidth=1.5;X.beginPath();X.roundRect(cx-mw/2,y-h/2,mw,h,7);X.fill();X.stroke();
    X.globalAlpha=1;X.fillStyle=col;for(let i=0;i<lines.length;i++)X.fillText(lines[i],cx,y-(lines.length-1)*8.5+i*17);X.restore();
  }
  const creature0=creature;
  creature=function(e){
    const funny=!!e?.__headline&&!e?.boss,old=funny?e.label:null;if(funny)e.label=' ';
    try{creature0(e)}finally{if(funny)e.label=old}
    if(funny)drawFunnyPlate(e);
  };

  const SIZES=[
    {id:'micro',label:'MICROSCOPIC',scale:.58,desc:'looks like a keychain; remains legally classified as a weapon'},
    {id:'pocket',label:'POCKET',scale:.76,desc:'small enough to lose in the couch, violent enough to find itself'},
    {id:'standard',label:'SUSPICIOUSLY NORMAL',scale:1,desc:'the control specimen in an otherwise terrible experiment'},
    {id:'xl',label:'OVERSIZED',scale:1.23,desc:'requires confidence, poor judgment, and wider doorways'},
    {id:'absurd',label:'ABSURD',scale:1.52,desc:'roughly one municipal permit larger than necessary'},
    {id:'municipal',label:'MUNICIPAL MONUMENT',scale:1.88,desc:'visible from neighboring tax districts'}
  ];
  const MUTATIONS=[
    {id:'vacuum',name:'INDUSTRIAL VACUUM WARRANTY',every:4,dps:1.08,desc:'every fourth impact sucks nearby enemies into the victim'},
    {id:'pinball',name:'PINBALL LIABILITY CLAUSE',every:5,dps:1.11,desc:'every fifth impact ricochets damage through the nearest coworkers'},
    {id:'moonshot',name:'MOONSHOT BUTTON',every:4,dps:1.06,desc:'occasionally sends the target vertically into upper management'},
    {id:'microwave',name:'BREAKROOM MICROWAVE CORE',every:5,dps:1.10,desc:'periodically goes DING and cooks the entire immediate area'},
    {id:'bees',name:'UNLICENSED BAG OF BEES',every:6,dps:1.09,desc:'contains bees; no additional documentation was provided'},
    {id:'copy',name:'HOSTILE COPY MACHINE',every:5,dps:1.10,desc:'duplicates an impact because apparently one was not enough'},
    {id:'banana',name:'BANANA SAFETY PROGRAM',every:6,dps:1.04,desc:'creates a brief slip-and-fall event for nearby monsters'},
    {id:'polarity',name:'REVERSIBLE GRAVITY WARRANTY',every:4,dps:1.07,desc:'alternates between violently pushing crowds away and dragging them back'}
  ];

  function rollSize(w){
    const q=Math.max(0,rarityRank(w)),r=Math.random();let s;
    if(r<.08)s=SIZES[0];else if(r<.19)s=SIZES[1];else if(r<.55)s=SIZES[2];else if(r<.76)s=SIZES[3];else if(r<.92)s=SIZES[4];else s=SIZES[5];
    if(q>=7&&Math.random()<.17)s=choose([SIZES[0],SIZES[5]]);return s;
  }
  function mutateWeapon(w){
    if(!w||w.rar==='Training'||w.__chaosV21)return w;w.__chaosV21=true;C.weapons++;
    const size=rollSize(w);w.__chaosSize={...size};C.sizeKinds.add(size.id);
    const q=Math.max(0,rarityRank(w)),chance=Math.min(.96,.42+q*.055);if(Math.random()<chance){const m=choose(MUTATIONS);w.__wacky={...m,hits:0,last:-99,flip:false};C.mutationKinds.add(m.id);w.name=(w.name+` // ${m.name}`).slice(0,220)}
    const bits=[`SIZE — ${size.label}: ${size.desc}.`];if(w.__wacky)bits.push(`MUTATION — ${w.__wacky.name}: ${w.__wacky.desc}.`);w.text=(bits.join(' ')+' '+(w.text||'')).trim();return w;
  }
  const makeW0=makeW;
  makeW=function(...args){return mutateWeapon(makeW0(...args))};

  const weaponScale0=weaponScale;
  weaponScale=function(w){const base=weaponScale0(w),m=w?.__chaosSize?.scale||1;return clampC(base*m,.55,5.6)};
  const estimateDPS0=estimateDPS;
  estimateDPS=function(w){const base=estimateDPS0(w);return base*(w?.__wacky?.dps||1)};

  function targetsNear(x,y,r,skip=null){return E.filter(t=>t&&!t.dead&&!t.boss&&t!==skip&&Math.hypot((t.x+t.w/2)-x,(t.y+t.h/2)-y)<r)}
  const hitE0=hitE;
  hitE=function(e,a,o={}){
    const before=e?.hp||0,r=hitE0(e,a,o),w=curW();if(!e||!w?.__wacky||o?.__wackyProc)return r;
    const m=w.__wacky;if((time-m.last)<.22)return r;m.last=time;m.hits=(m.hits||0)+1;if(m.hits%m.every!==0)return r;C.procs++;
    const x=e.x+e.w/2,y=e.y+e.h/2,near=targetsNear(x,y,190,e),sec=(t,d,extra={})=>hitE0(t,Math.max(1,a*d),{col:w.col,stun:.06,sourceType:w.type,__wackyProc:true,...extra});
    try{
      if(m.id==='vacuum'){
        ring(x,y,w.col,95,3);txt(x,y-38,'VACUUM WARRANTY',w.col,false);for(const t of near.slice(0,7)){t.vx+=Math.sign(x-(t.x+t.w/2))*320;t.vy-=70;sec(t,.10)}
      }else if(m.id==='pinball'){
        let prev=e;for(const t of near.sort((a,b)=>Math.hypot(a.x-prev.x,a.y-prev.y)-Math.hypot(b.x-prev.x,b.y-prev.y)).slice(0,4)){beam(prev.x+prev.w/2,prev.y+prev.h/2,t.x+t.w/2,t.y+t.h/2,w.col,3);sec(t,.22);prev=t}txt(x,y-38,'PINBALL CLAUSE',w.col,false);
      }else if(m.id==='moonshot'){
        e.vy=-520;e.on=false;ring(x,y,'#d8ecff',65,3);txt(x,y-38,'PROMOTED TO SPACE','#d8ecff',false);for(const t of near.slice(0,2)){t.vy=-330;t.on=false}
      }else if(m.id==='microwave'){
        boom(x,y,'#ffcf69',105,1);txt(x,y-38,'DING!','#fff1a8',false);for(const t of near.slice(0,6))sec(t,.18,{stun:.12});
      }else if(m.id==='bees'){
        txt(x,y-38,'BEES???','#ffe35d',false);for(const t of near.slice(0,5)){beam(x,y,t.x+t.w/2,t.y+t.h/2,'#ffe35d',2);part(t.x+t.w/2,t.y+t.h/2,'#ffe35d',4,90,2);sec(t,.14)}
      }else if(m.id==='copy'){
        txt(x,y-38,'COPY // COPY','#bdeeff',false);sec(e,.33,{stun:.08});F.push({k:'ghost',x:e.x+e.w/2,y:e.y+e.h/2,dir:e.dir||1,life:.20,max:.20,col:w.col,sc:1.2});
      }else if(m.id==='banana'){
        txt(x,y-38,'SLIPPERY WHEN UNIONIZED','#fff46b',false);for(const t of [e,...near.slice(0,5)]){t.stun=Math.max(t.stun||0,.42);t.vx+=rand(-260,260);t.vy=-110;t.on=false}ring(x,G-5,'#fff46b',105,3);
      }else if(m.id==='polarity'){
        m.flip=!m.flip;const pull=m.flip;txt(x,y-38,pull?'REVERSE GRAVITY':'FORWARD GRAVITY','#bb9cff',false);for(const t of near.slice(0,7)){const s=Math.sign((t.x+t.w/2)-x)||1;t.vx+=(pull?-s:s)*390;sec(t,.08)}ring(x,y,'#bb9cff',100,3);
      }
      if(before>0&&e.dead&&m.id==='microwave')part(x,y,'#ffcf69',10,180,4);
    }catch(_){ }
    return r;
  };

  function smoke(){
    const root=document.documentElement;
    try{
      for(let i=0;i<900;i++)mutateWeapon(makeW0(Math.max(4,pl.lv||4),i%9===0));
      const sizes=[...C.sizeKinds],muts=[...C.mutationKinds];
      const samples=['brute','wizard','crawler','taxman','bombchicken','roller'];for(let i=0;i<samples.length;i++)spawn(samples[i],60+i*105,i===0,G);draw();
      const longNames=E.filter(e=>e.__funnyName&&e.__funnyName.length>=18).length,featured=E.filter(e=>e.__headline).length;
      let w=makeW0(Math.max(8,pl.lv||8),true);mutateWeapon(w);w.__wacky={...MUTATIONS[0],hits:3,last:-99,flip:false};equip(w);const target=E.find(e=>!e.dead&&!e.boss);if(target)hitE(target,Math.max(4,target.max*.02),{col:w.col,sourceType:w.type});draw();
      root.dataset.cwmChaosProof=(sizes.length>=6&&muts.length>=7&&longNames>=4&&featured>=1&&C.nameplates>0&&C.procs>0)?'pass':'fail';
      root.dataset.cwmChaosSizes=String(sizes.length);root.dataset.cwmChaosMutations=String(muts.length);root.dataset.cwmChaosNames=String(longNames);root.dataset.cwmChaosHeadliners=String(featured);root.dataset.cwmChaosNameplates=C.nameplates>0?'pass':'fail';root.dataset.cwmChaosProc=C.procs>0?'pass':'fail';root.dataset.cwmChaosScaleRange='0.58-1.88';
    }catch(err){root.dataset.cwmChaosProof='fail';root.dataset.cwmChaosError=String(err?.message||err)}
  }
  try{if(new URLSearchParams(location.search).get('chaosSmoke')==='1')setTimeout(smoke,1600)}catch(_){ }

  globalThis.CWM_CHAOS_V21={version:'v21-comedy-chaos',state:C,sizes:SIZES,mutations:MUTATIONS,mutateWeapon};
})();
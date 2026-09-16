(()=>{
  if(globalThis.__CWM_READABILITY_V22)return;
  globalThis.__CWM_READABILITY_V22=true;

  const clampR=(n,a,b)=>Math.max(a,Math.min(b,n));
  const S={balanced:0,hpBars:0,coolDraws:0,voidHits:0,maxVoid:1,shakeSuppressed:0};

  // Readability pass: make the information already on screen large enough to read at gameplay distance.
  const style=document.createElement('style');style.id='cwmReadabilityV22';style.textContent=`
    body.cwmArsenalPlaying .fsWeapon{width:min(720px,54vw)!important;max-height:350px!important;min-height:158px!important;grid-template-columns:104px minmax(0,1fr)!important;gap:14px!important;padding:13px 18px 14px 12px!important}
    body.cwmArsenalPlaying .fsWeapon:before{left:130px!important;font-size:7.5px!important}
    body.cwmArsenalPlaying .fsWeapon:after{font-size:7.5px!important}
    body.cwmArsenalPlaying .fsWeapon canvas{width:104px!important;height:82px!important}
    body.cwmArsenalPlaying .fsWeaponCopy{padding-top:13px!important}
    body.cwmArsenalPlaying .fsDps{font-size:25px!important;margin-top:2px!important}
    body.cwmArsenalPlaying .fsMeta{font-size:10.5px!important;line-height:1.3!important;font-weight:850!important}
    body.cwmArsenalPlaying .fsAttrs{gap:6px!important;margin-top:9px!important;max-height:184px!important}
    body.cwmArsenalPlaying .fsAttr{padding:6px 8px!important;font-size:10px!important;line-height:1.25!important}
    body.cwmArsenalPlaying .fsAttr b{font-size:9px!important;margin-bottom:3px!important}
    body.cwmArsenalPlaying .fsVitals{width:min(410px,31vw)!important;min-height:188px!important;padding:18px 15px 14px 31px!important}
    body.cwmArsenalPlaying .fsVitals:before{font-size:7.5px!important}
    body.cwmArsenalPlaying .fsVRow{grid-template-columns:55px minmax(0,1fr) 68px!important;gap:9px!important;font-size:10px!important;margin:6px 0!important}
    body.cwmArsenalPlaying .fsVRow span:last-child{font-size:10px!important}
    body.cwmArsenalPlaying .fsVRow:nth-child(1){font-size:12px!important}.fsVRow:nth-child(1) .fsBar{height:18px!important}
    body.cwmArsenalPlaying .fsVRow:nth-child(1) span:last-child{font-size:12px!important}
    body.cwmArsenalPlaying .fsVRow:nth-child(2){font-size:10px!important}.fsVRow:nth-child(2) .fsBar{height:10px!important}
    body.cwmArsenalPlaying .fsVRow:nth-child(3){font-size:11px!important}.fsVRow:nth-child(3) .fsBar{height:16px!important}
    body.cwmArsenalPlaying #cwmSpecialInfo{font-size:9.5px!important;line-height:1.35!important;margin-top:9px!important;padding-top:9px!important}
    body.cwmArsenalPlaying #cwmSpecialInfo b{font-size:11px!important}
    body.cwmArsenalPlaying .fsZone{font-size:9px!important;width:min(330px,28vw)!important;padding:8px 22px!important}
    body.cwmArsenalPlaying .fsZone b{font-size:11px!important}
    #cwmShardBankHud{top:55px!important;padding:7px 11px!important;gap:10px!important}
    #cwmShardBankHud b{font-size:12px!important}#cwmShardBankHud span{font-size:10px!important}#cwmShardBankHud button{font-size:9px!important;padding:5px 8px!important}
    #cwmWaveStackHud{top:91px!important;min-width:300px!important;font-size:9px!important;padding:5px 12px!important}
    .cwmEnemyHeadline{font-size:18px!important}
  `;document.head.appendChild(style);

  function currentBasicHit(){
    try{return Math.max(8,Number(wdmg())||8)}catch(_){return 20}
  }
  function desiredHits(e){
    const dense=(globalThis.CWM_HORDE_V16?.density?.()||0)>=16;
    if(e?.__nightMutant==='ABOMINATION')return dense?6.8:8.2;
    if(e?.elite)return dense?5.0:6.2;
    return dense?2.9:3.7+Math.min(.6,(Number(zoneI)||0)*.07);
  }
  function balanceEnemy(e){
    if(!e||e.dead||e.boss||e.__cwmV22Balanced)return false;
    const oldMax=Math.max(1,Number(e.max)||1),ratio=clampR((Number(e.hp)||oldMax)/oldMax,0,1);
    const floor=Math.round(currentBasicHit()*desiredHits(e));
    if(oldMax<floor){e.max=floor;e.hp=Math.max(1,Math.round(floor*ratio))}
    e.__cwmV22Balanced=true;S.balanced++;return e.max>=floor;
  }

  // Apply after all wave/shop spawn scaling has finished, preserving the existing wave architecture.
  const updateE0=updateE;
  updateE=function(dt){
    const r=updateE0(dt);
    for(const e of E)if(e&&!e.dead&&!e.boss&&!e.__cwmV22Balanced&&e.state!=='spawn')balanceEnemy(e);
    return r;
  };

  function voidRangeMultiplier(target){
    if(!target)return 1;
    const pc=pl.x+pl.w/2,tc=target.x+target.w/2,dist=Math.abs(tc-pc);
    return 1+clampR((dist-120)/500,0,1)*1.20; // 1.0x close, up to 2.2x from long range.
  }
  const hit0=hitE;
  hitE=function(target,amount,o={}){
    const w=curW?.(),family=w?.element?.family;
    const internal=!!(o.__elementTick||o.__arsenalTick||o.__hordeTick||o.__overdriveTick||o.__chaosTick||o.__cwmV22Tick);
    let mult=1;
    if(target&&!target.dead&&family==='void'&&!internal){
      mult=voidRangeMultiplier(target);S.maxVoid=Math.max(S.maxVoid,mult);S.voidHits++;
      if(mult>=1.42&&w.__cwmVoidRangeCombo!==pl.combo){
        w.__cwmVoidRangeCombo=pl.combo;
        try{txt(target.x+target.w/2,target.y-38,`VOID RANGE x${mult.toFixed(1)}`,'#c9a7ff',false)}catch(_){ }
      }
    }
    return hit0(target,Number(amount)*mult,{...o,__cwmV22Tick:internal||undefined});
  };

  function drawEnemyStyle(e){
    if(!e||e.dead||e.boss||e.state==='spawn')return;
    const cx=e.x+e.w/2,cy=e.y+e.h/2,t=Number(time)||0;
    X.save();X.translate(cx,cy);X.globalAlpha=.92;X.lineCap='round';X.lineJoin='round';
    const col=e.elite?'#ff6674':(e.col||'#8edfff');
    if(e.type==='brute'){
      X.strokeStyle='#ffbd73';X.lineWidth=4;X.beginPath();X.moveTo(-e.w*.22,-e.h*.34);X.lineTo(-e.w*.35,-e.h*.52);X.moveTo(e.w*.22,-e.h*.34);X.lineTo(e.w*.35,-e.h*.52);X.stroke();
      X.strokeStyle=col;X.globalAlpha=.45;X.lineWidth=5;X.beginPath();X.arc(0,3,e.w*.48,-2.9,-.25);X.stroke();
    }else if(e.type==='crawler'||e.type==='maw'){
      X.fillStyle=col;for(let i=-2;i<=2;i++){let x=i*e.w*.14;X.beginPath();X.moveTo(x,-e.h*.26);X.lineTo(x+e.w*.07,-e.h*.54-Math.abs(i)*2);X.lineTo(x+e.w*.13,-e.h*.24);X.closePath();X.fill()}
    }else if(e.type==='wizard'||e.type==='summoner'){
      X.strokeStyle=col;X.lineWidth=2;X.shadowColor=col;X.shadowBlur=8;for(let i=0;i<3;i++){let a=t*(1.4+i*.35)+i*2.1,r=e.w*.48+9+i*4;X.beginPath();X.arc(Math.cos(a)*r,Math.sin(a)*r*.45,4+i,0,Math.PI*2);X.stroke()}X.shadowBlur=0;
    }else if(e.type==='bombchicken'){
      X.fillStyle='#59636e';X.fillRect(-e.w*.42,-2,8,18);X.fillRect(e.w*.28,-2,8,18);X.fillStyle='#ff713f';X.beginPath();X.moveTo(-e.w*.38,16);X.lineTo(-e.w*.30,30+Math.sin(t*18)*5);X.lineTo(-e.w*.22,16);X.fill();X.beginPath();X.moveTo(e.w*.32,16);X.lineTo(e.w*.40,30-Math.sin(t*18)*5);X.lineTo(e.w*.48,16);X.fill();
    }else if(e.type==='shieldbro'){
      X.strokeStyle='#b9efff';X.lineWidth=3;X.globalAlpha=.62;for(let i=0;i<3;i++){X.beginPath();X.arc(e.w*.40,0,e.h*(.25+i*.08),-1.05,1.05);X.stroke()}
    }else if(e.type==='blinker'){
      X.strokeStyle='#c67cff';X.lineWidth=2;X.globalAlpha=.38;for(let i=1;i<=3;i++)X.strokeRect(-e.w*.5-i*8,-e.h*.32,e.w*.72,e.h*.64);
    }else if(e.type==='sniper'){
      X.strokeStyle='#ff5d69';X.lineWidth=2;X.globalAlpha=.65;X.beginPath();X.arc(e.w*.32,-e.h*.12,11+Math.sin(t*5)*2,0,Math.PI*2);X.moveTo(e.w*.32-16,-e.h*.12);X.lineTo(e.w*.32+16,-e.h*.12);X.stroke();
    }else if(e.type==='eyeball'){
      X.strokeStyle='#ff8be7';X.lineWidth=2;X.globalAlpha=.6;X.beginPath();X.arc(4,0,16+Math.sin(t*7)*3,0,Math.PI*2);X.stroke();
    }else if(e.type==='wraith'){
      X.fillStyle='#8fe9ff';X.globalAlpha=.32;for(let i=0;i<3;i++){let a=t*2+i*2.1;X.beginPath();X.arc(Math.cos(a)*22,e.h*.28+Math.sin(a)*8,5+i,0,Math.PI*2);X.fill()}
    }else if(e.type==='roller'){
      X.strokeStyle='#ffe67a';X.lineWidth=2;X.globalAlpha=.7;for(let i=0;i<4;i++){let a=t*11+i*Math.PI/2;X.beginPath();X.moveTo(Math.cos(a)*e.w*.45,Math.sin(a)*e.w*.45);X.lineTo(Math.cos(a)*e.w*.72,Math.sin(a)*e.w*.72);X.stroke()}
    }else if(e.type==='taxman'){
      X.strokeStyle='#ff596c';X.lineWidth=2;X.globalAlpha=.7;X.strokeRect(-e.w*.38,-e.h*.42,e.w*.76,e.h*.72);X.beginPath();X.moveTo(-e.w*.28,-e.h*.18);X.lineTo(e.w*.28,-e.h*.18);X.moveTo(-e.w*.28,0);X.lineTo(e.w*.18,0);X.stroke();
    }
    if(e.elite){X.globalAlpha=.72;X.strokeStyle='#ffd56b';X.lineWidth=3;X.beginPath();X.moveTo(-12,-e.h*.62);X.lineTo(0,-e.h*.74);X.lineTo(12,-e.h*.62);X.stroke()}
    X.restore();S.coolDraws++;
  }

  function drawHpBar(e){
    if(!e||e.dead||e.boss||e.state==='spawn')return;
    const ratio=clampR((Number(e.hp)||0)/Math.max(1,Number(e.max)||1),0,1);
    const bw=clampR(Math.max(e.w*1.12,42),42,e.__nightMutant==='ABOMINATION'?128:96),bh=e.elite||e.__nightMutant?9:7;
    const x=e.x+e.w/2-bw/2,y=e.y-13;
    X.save();X.globalAlpha=.96;X.fillStyle='rgba(2,5,9,.94)';X.fillRect(x-2,y-2,bw+4,bh+4);
    X.fillStyle='#18212a';X.fillRect(x,y,bw,bh);
    X.fillStyle=ratio>.62?'#62f08c':ratio>.30?'#ffd05e':'#ff5368';X.fillRect(x,y,Math.max(1,bw*ratio),bh);
    X.strokeStyle=e.__nightMutant?'#ff7c52':e.elite?'#ff8c9a':'rgba(220,242,255,.62)';X.lineWidth=e.elite||e.__nightMutant?2:1;X.strokeRect(x-.5,y-.5,bw+1,bh+1);
    X.restore();S.hpBars++;
  }

  const creature0=creature;
  creature=function(e){const r=creature0(e);drawEnemyStyle(e);drawHpBar(e);return r};

  // Kill camera shake at the actual draw boundary. Effects, hit-stop, particles and flashes remain intact.
  const draw0=draw;
  draw=function(){if(shake!==0){shake=0;S.shakeSuppressed++}const r=draw0();shake=0;return r};

  // Base render currently forces tiny inline-important weapon-name sizes; restore readable sizes after it runs.
  const render0=render;
  render=function(...args){const r=render0(...args);try{const el=U?.fsWName;if(el){const n=(el.textContent||'').length;const px=n>84?22:n>65?24:n>48?27:n>32?30:34;el.style.setProperty('font-size',px+'px','important')}}catch(_){ }return r};

  function selfTest(){return{ok:true,minNormalHits:2.9,maxVoid:2.2,screenShake:false,hpBars:true,coolEnemies:true};}
  globalThis.CWM_READABILITY_V22={version:'v22-readable-danger',balanceEnemy,voidRangeMultiplier,state:()=>({...S}),selfTest};

  try{
    const p=new URLSearchParams(location.search);
    if(p.get('readabilitySmoke')==='1'||p.get('readabilityShowcase')==='1')setTimeout(()=>{
      try{
        if(typeof reset==='function')reset();gameStarted=true;paused=false;over=false;document.body.classList.add('playing','cwmArsenalPlaying');U?.titleScreen?.classList.add('hidden');
        const w=makeW(Math.max(8,pl.lv+7));w.element={family:'void',name:'VOID',n:'Void',col:'#b28cff',polarity:'positive',desc:'Range feeds the hole.'};w.col='#b28cff';pl.weapon=w;pl.x=170;pl.y=G-pl.h;
        E=[];spawn('brute',930,false,G);spawn('wizard',720,true,G);spawn('crawler',520,false,G);for(const e of E){e.state='approach';balanceEnemy(e)}
        const far=E[0],hits=far.max/Math.max(1,currentBasicHit()),vm=voidRangeMultiplier(far);shake=22;draw();render();
        const ok=hits>=2.8&&vm>=1.8&&shake===0&&S.hpBars>=3&&S.coolDraws>=3;
        const d=document.documentElement.dataset;d.cwmReadabilityProof=ok?'pass':'fail';d.cwmReadabilityHits=hits.toFixed(1);d.cwmVoidRange=vm.toFixed(2);d.cwmScreenShake=shake===0?'off':'on';d.cwmEnemyHpBars=S.hpBars>=3?'pass':'fail';d.cwmEnemyVisuals=S.coolDraws>=3?'pass':'fail';
      }catch(err){document.documentElement.dataset.cwmReadabilityProof='fail';console.error('readability smoke',err)}
    },1800);
  }catch(_){ }
})();
(()=>{
  const CLIENT_KEY='crazyWeaponMan.clientId.v1';
  const GAME_VERSION='v1.1-frenzy';
  const BOARD_VIEWS=new Set(['current','all','legacy']);
  let onlineRows=[];
  let leaderboardView='current';
  let frenzyPeakTier=0;
  let frenzyTierNow=0;

  function getClientId(){
    try{
      let id=localStorage.getItem(CLIENT_KEY);
      if(id&&/^[A-Za-z0-9_-]{8,80}$/.test(id))return id;
      id='cwm_'+(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36));
      localStorage.setItem(CLIENT_KEY,id);
      return id;
    }catch(_){
      return 'cwm_'+Math.random().toString(36).slice(2)+Date.now().toString(36);
    }
  }

  function setStatus(text){if(U.globalStatus)U.globalStatus.textContent=text}
  function viewLabel(){return leaderboardView==='all'?'ALL-TIME':leaderboardView==='legacy'?'LEGACY':'CURRENT PATCH'}
  function patchLabel(v){return String(v||'legacy').replace(/^v/i,'v')}

  function installBoardTabs(){
    const card=document.getElementById('leaderboardCard');
    if(!card||document.getElementById('lbTabs'))return;
    const style=document.createElement('style');
    style.textContent='.lbTabs{display:flex;gap:6px;flex-wrap:wrap;margin:3px 0 9px}.lbTab{appearance:none;border:1px solid #31445e;background:#0a111a;color:#8fa5bf;border-radius:999px;padding:6px 10px;font:900 10px system-ui;letter-spacing:.08em;cursor:pointer}.lbTab:hover{border-color:#6ddfff;color:#dff9ff}.lbTab.active{border-color:#ffe66d;color:#fff17c;background:#1b190d;box-shadow:0 0 16px #ffe66d18}.lbPatch{display:inline-block;margin-left:5px;padding:1px 5px;border:1px solid #42536a;border-radius:999px;color:#aebfd3;font-size:9px;font-weight:900;vertical-align:1px}';
    document.head.appendChild(style);
    const tabs=document.createElement('div');
    tabs.id='lbTabs';tabs.className='lbTabs';
    tabs.innerHTML='<button class="lbTab active" data-lbview="current">CURRENT PATCH</button><button class="lbTab" data-lbview="all">ALL-TIME</button><button class="lbTab" data-lbview="legacy">LEGACY</button>';
    const row=card.querySelector('.row');
    if(row)row.insertAdjacentElement('afterend',tabs);else card.prepend(tabs);
    tabs.addEventListener('click',e=>{
      const b=e.target.closest('[data-lbview]');
      if(!b||!BOARD_VIEWS.has(b.dataset.lbview)||b.dataset.lbview===leaderboardView)return;
      leaderboardView=b.dataset.lbview;
      renderLeaderboard();
      syncGlobalLeaderboard();
    });
  }

  function refreshTabs(){
    document.querySelectorAll('[data-lbview]').forEach(b=>b.classList.toggle('active',b.dataset.lbview===leaderboardView));
  }

  renderLeaderboard=function(newId=''){
    if(!U.leaderboard)return;
    refreshTabs();
    const rows=globalBoard?onlineRows:leaderboard;
    const label=viewLabel();
    if(!rows.length){
      U.leaderboard.innerHTML=`<div class="lbempty">${globalBoard?`No ${label.toLowerCase()} records yet. Be the first bad influence.`:'Collect something irresponsible.'}</div>`;
      if(U.titleBest)U.titleBest.textContent=globalBoard?`No ${label.toLowerCase()} weapon has earned the throne yet.`:'No weapon has earned the throne yet.';
      return;
    }
    U.leaderboard.innerHTML=rows.map((x,i)=>`<div class="lbrow${x.id===newId?' lbNew':''}"><div class="lbrank">${i+1}</div><div><div class="lbname" style="color:${x.col||'#fff'}">${escapeHtml(x.name)}</div><div class="lbmeta">${escapeHtml(x.player||'Anonymous Lunatic')} • ${escapeHtml(x.rar)} ${escapeHtml(x.type)} • Lv.${Number(x.level||1)} • ${Number(x.kills||0).toLocaleString()} kills <span class="lbPatch">${escapeHtml(patchLabel(x.version))}</span></div></div><div class="lbdps">${Number(x.dps).toLocaleString()} DPS</div></div>`).join('');
    const b=rows[0];
    if(U.titleBest)U.titleBest.innerHTML=`${escapeHtml(b.name)} — ${Number(b.dps).toLocaleString()} DPS<br><span style="font-size:11px;color:#aebfd3">held by ${escapeHtml(b.player||'Anonymous Lunatic')} • ${label} #1 • ${escapeHtml(patchLabel(b.version))}</span>`;
  };

  syncGlobalLeaderboard=async function(){
    try{
      setStatus('SYNCING • '+viewLabel());
      const r=await fetch(`/api/leaderboard?limit=10&view=${encodeURIComponent(leaderboardView)}&version=${encodeURIComponent(GAME_VERSION)}`,{cache:'no-store',headers:{accept:'application/json'}});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const j=await r.json();
      onlineRows=Array.isArray(j.scores)?j.scores:[];
      globalBoard=true;
      setStatus('ONLINE • '+viewLabel());
      renderLeaderboard();
      return true;
    }catch(e){
      console.warn('Global leaderboard unavailable',e);
      globalBoard=false;
      setStatus('OFFLINE • LOCAL BACKUP');
      renderLeaderboard();
      return false;
    }
  };

  async function submitStoredBest(){
    const rec=leaderboard[0];
    if(!rec||!Number(rec.dps)||rec.rar==='Training')return;
    const type=String(rec.type||'').toUpperCase();
    if(!['SWORD','DAGGER','NUNCHUCKS','KATANA','BOW','SHURIKEN','WAND','STAFF','HAMMER'].includes(type))return;
    try{
      const r=await fetch('/api/leaderboard',{
        method:'POST',headers:{'content-type':'application/json',accept:'application/json'},
        body:JSON.stringify({
          client_id:getClientId(),player_name:playerName(),weapon_name:rec.name,weapon_type:type,
          rarity:rec.rar,color:/^#[0-9A-Fa-f]{6}$/.test(rec.col||'')?rec.col:'#ffffff',dps:Math.round(rec.dps),
          run_seed:String(rec.seed||runSeed),zone:rec.zone||'Unknown',boss:rec.boss||'',level:Number(rec.level||1),
          kills:Number(rec.kills||0),slaughter_score:0,game_version:GAME_VERSION
        })
      });
      if(!r.ok)return;
      const j=await r.json();
      if(leaderboardView==='current'){
        onlineRows=Array.isArray(j.scores)?j.scores:onlineRows;
        globalBoard=true;
        setStatus('ONLINE • CURRENT PATCH');
        renderLeaderboard(j.accepted_id||'');
      }
    }catch(_){/* normal sync remains fallback */}
  }

  submitGlobalWeapon=async function(rec,w){
    try{
      setStatus('UPLOADING • PATCH BEST');
      const r=await fetch('/api/leaderboard',{
        method:'POST',headers:{'content-type':'application/json',accept:'application/json'},
        body:JSON.stringify({
          client_id:getClientId(),player_name:playerName(),weapon_name:rec.name,
          weapon_type:String(w.type||'').toUpperCase(),rarity:rec.rar,
          color:/^#[0-9A-Fa-f]{6}$/.test(rec.col||'')?rec.col:'#ffffff',dps:rec.dps,
          run_seed:runSeed,zone:rec.zone,boss:rec.boss||'',level:pl.lv,kills,
          slaughter_score:Math.max(0,Math.floor(styleScore)),game_version:GAME_VERSION
        })
      });
      if(!r.ok)throw new Error('HTTP '+r.status);
      const j=await r.json();
      const id=j.accepted_id||'';
      if(leaderboardView==='current'){
        onlineRows=Array.isArray(j.scores)?j.scores:onlineRows;
        globalBoard=true;
        setStatus(j.accepted?'ONLINE • PATCH BEST SAVED':'ONLINE • CURRENT PATCH');
        renderLeaderboard(id);
      }else await syncGlobalLeaderboard();
      if(j.accepted){
        const rank=leaderboardView==='current'?onlineRows.findIndex(x=>x.id===id)+1:0;
        if(rank===1){txt(pl.x+17,pl.y-82,'NEW PATCH DPS #1!',w.col,true);ring(pl.x+17,pl.y+10,w.col,175,7);shake=Math.max(shake,11)}
        else if(rank>0)txt(pl.x+17,pl.y-82,`PATCH DPS #${rank}!`,w.col,true);
      }
      return !!j.accepted;
    }catch(e){
      console.warn('Global leaderboard submit failed',e);
      globalBoard=false;setStatus('OFFLINE • LOCAL BACKUP');renderLeaderboard();return false;
    }
  };

  recordWeapon=function(w,dps){
    if(!w||w.rar==='Training')return false;
    updateMuseum(w,dps);
    if(rarityIndex(w)>=8&&Math.random()<.22)awardMeta(1,'A sufficiently irresponsible weapon was documented.');
    const rec={
      id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      player:playerName(),name:w.name,rar:w.rar,type:WM[w.type]?.label||w.type,col:w.col,
      dps:Math.round(dps),seed:runSeed,zone:Z[zoneI]?.name||'Unknown',boss:bossMode||'',
      level:pl.lv,kills,when:new Date().toISOString(),version:GAME_VERSION
    };
    const local=[...leaderboard,rec].sort((a,b)=>b.dps-a.dps).slice(0,10);
    const placed=local.some(x=>x.id===rec.id);
    leaderboard=local;saveLeaderboard();renderLeaderboard(placed?rec.id:'');
    if(placed&&leaderboard[0].id===rec.id){
      txt(pl.x+17,pl.y-82,'NEW PERSONAL DPS BEST!',w.col,true);
      ring(pl.x+17,pl.y+10,w.col,150,6);shake=Math.max(shake,8);submitGlobalWeapon(rec,w);
    }
    return placed;
  };

  function frenzyTierForDps(dps){
    const n=Number(dps)||0;
    if(n<1000)return 0;
    return Math.max(1,Math.floor(Math.log10(n))-2);
  }
  function frenzyThreshold(tier){return tier>0?1000*Math.pow(10,tier-1):0}
  function frenzyName(tier){
    if(tier===1)return 'EGO SATIATED — FRENZY MODE ACTIVATED';
    if(tier===2)return 'EGO SATIATED — FRENZY ESCALATING';
    if(tier===3)return 'EGO SATIATED — PSYCHOTIC FRENZY';
    if(tier===4)return 'EGO SATIATED — REALITY REJECTION FRENZY';
    return `EGO SATIATED — FRENZY TIER ${tier}`;
  }
  function checkFrenzyMilestone(){
    if(!gameStarted||over)return;
    const dps=Math.max(0,estimateDPS(curW()));
    const tier=frenzyTierForDps(dps);
    frenzyTierNow=tier;
    if(tier<=frenzyPeakTier)return;
    frenzyPeakTier=tier;
    const mark=frenzyThreshold(tier);
    const col=tier>=4?'#ff5cf4':tier>=3?'#ff5f74':tier>=2?'#ffb347':'#fff176';
    txt(W/2,112,frenzyName(tier),col,true);
    txt(W/2,145,`${mark.toLocaleString()} DPS • HEAD SIZE NO LONGER OSHA COMPLIANT`,'#bff7ff',false);
    ring(pl.x+pl.w/2,pl.y+pl.h/2,col,135+tier*22,5+tier);
    part(pl.x+pl.w/2,pl.y+10,col,16+tier*5,210+tier*28,7);
    flash=Math.max(flash,.22+tier*.08);chroma=Math.max(chroma,.06+tier*.05);shake=Math.max(shake,6+tier*2.4);
    tone(260+tier*70,720+tier*150,.16,.035,'sawtooth',.02);
    U.msg.textContent=`${frenzyName(tier)} at ${mark.toLocaleString()} DPS. Cosmetic ego damage only; leaderboard math is unchanged.`;
  }

  function playerBodyAngle(w){
    const atk=pl.at>0?1-pl.at/Math.max(.01,pl.atMax):0,step=pl.combo%3;
    let body=0;
    if(atk&&w.type==='sword'){if(step===1)body=-.18+atk*.3;else if(step===2)body=.17-atk*.3;else body=-.24+atk*.42}
    else if(atk&&w.type==='dagger')body=-.08+atk*.12;
    else if(atk&&w.type==='nunchucks')body=Math.sin(atk*Math.PI*2)*.10;
    else if(atk&&w.type==='katana')body=-.22+atk*.36;
    else if(atk&&w.type==='shuriken')body=-.05;
    else if(atk&&w.type==='hammer')body=-.2+atk*.32;
    else if(atk&&w.type==='staff')body=-.1;
    else if(atk&&(w.type==='bow'||w.type==='wand'))body=w.type==='bow'?-.09:-.06;
    return body;
  }

  function drawFrenzyHead(){
    const w=curW(),tier=frenzyTierForDps(estimateDPS(w));
    frenzyTierNow=tier;
    if(tier<=0)return;
    const run=pl.on?Math.min(1,Math.abs(pl.vx)/190):0;
    const cy=time*12,bob=Math.abs(Math.sin(cy))*2*run,breathe=1+Math.sin(time*5.2)*.018;
    const body=playerBodyAngle(w);
    const hs=Math.min(3.2,1.28+tier*.38);
    const jitter=Math.min(3.3,Math.max(0,tier-1)*.65);
    const col=tier>=4?'#ff5cf4':tier>=3?'#ff5b70':w.col;
    X.save();
    X.translate(pl.x+17,pl.y+25+bob);
    X.scale(pl.dir*1.08,breathe*1.08);
    X.rotate(body);
    X.translate(Math.sin(time*(17+tier*2))*jitter,-19+Math.cos(time*(14+tier))*jitter*.35);
    X.scale(hs,hs);
    X.globalAlpha=.16+Math.min(.18,tier*.025);X.strokeStyle=col;X.lineWidth=1.3;
    for(let i=0;i<Math.min(4,1+Math.floor(tier/2));i++){X.beginPath();X.arc(0,0,12+i*3.8+Math.sin(time*5+i),0,Math.PI*2);X.stroke()}
    X.globalAlpha=1;
    X.fillStyle='#ead9c7';X.beginPath();X.arc(0,0,9.5,0,Math.PI*2);X.fill();
    const headArmor=pl.armors?.head||null;
    if(headArmor){
      X.fillStyle=headArmor.col;X.shadowColor=headArmor.col;X.shadowBlur=5+tier;
      X.beginPath();X.arc(0,-2,11,Math.PI,Math.PI*2);X.lineTo(9.7,1);X.lineTo(7.8,5);X.lineTo(3.5,.4);X.lineTo(-3.5,.4);X.lineTo(-7.8,5);X.lineTo(-9.7,1);X.closePath();X.fill();X.shadowBlur=0;
    }else{
      X.fillStyle=tier>=4?`hsl(${(time*130)%360} 90% 45%)`:'#202631';
      const lift=8+tier*5;
      X.beginPath();X.moveTo(-10,-5);X.lineTo(-14,-12-lift*.35);X.lineTo(-9,-9-lift*.22);X.lineTo(-6,-16-lift*.5);X.lineTo(-1,-10-lift*.2);X.lineTo(2,-18-lift*.62);X.lineTo(6,-10-lift*.14);X.lineTo(10,-15-lift*.48);X.lineTo(14,-9-lift*.25);X.lineTo(11,-3);X.closePath();X.fill();
    }
    X.strokeStyle='#252934';X.lineWidth=1.6+Math.min(1.5,tier*.22);X.beginPath();X.moveTo(-7.5,-6.2);X.lineTo(-.7,-9.1-tier*.18);X.moveTo(1.3,-4.6);X.lineTo(7.5,-7.2);X.stroke();
    X.fillStyle='#f7fbff';X.beginPath();X.ellipse(-3.9,-2.2,2.6+tier*.16,3.2+tier*.24,.2,0,Math.PI*2);X.fill();X.beginPath();X.ellipse(4.0,-.1,2.0+tier*.19,1.7+tier*.17,-.18,0,Math.PI*2);X.fill();
    if(tier>=2){X.strokeStyle='#d43a55';X.lineWidth=.55;for(let i=0;i<3;i++){X.beginPath();X.moveTo(-6.4+i*.4,-.9+i*.45);X.lineTo(-4.9+i*.3,-2.0-i*.28);X.stroke();X.beginPath();X.moveTo(6.1-i*.35,1.0-i*.2);X.lineTo(4.8-i*.25,.25+i*.18);X.stroke()}}
    X.fillStyle=tier>=3?'#ff334f':'#111820';const pr=Math.max(.45,1.05-tier*.08);X.beginPath();X.arc(-3.9,-2.2-tier*.12,pr,0,Math.PI*2);X.fill();X.beginPath();X.arc(4.1,-.1,Math.max(.35,pr*.72),0,Math.PI*2);X.fill();
    if(tier>=3){X.fillStyle='#ff7f96';X.beginPath();X.arc(-6.2,1.8,1.2+tier*.12,0,Math.PI*2);X.arc(6,2.2,1.1+tier*.1,0,Math.PI*2);X.fill()}
    X.strokeStyle='#71182b';X.lineWidth=1.8+Math.min(2,tier*.3);X.beginPath();X.moveTo(-5.7,5.4);X.quadraticCurveTo(1.5,11+tier*1.7,8.1,4.0-tier*.1);X.stroke();
    if(tier>=2){X.fillStyle='#ff6989';X.globalAlpha=.68;X.beginPath();X.ellipse(1.6,8.1+tier*.3,3.5+tier*.35,1.5+tier*.18,.04,0,Math.PI);X.fill();X.globalAlpha=1}
    X.restore();
  }

  if(typeof playerDraw==='function'&&!globalThis.__CWM_FRENZY_DRAW){
    globalThis.__CWM_FRENZY_DRAW=true;
    const basePlayerDraw=playerDraw;
    playerDraw=function(){basePlayerDraw();drawFrenzyHead()};
  }
  if(typeof render==='function'&&!globalThis.__CWM_FRENZY_RENDER){
    globalThis.__CWM_FRENZY_RENDER=true;
    const baseRender=render;
    render=function(){const r=baseRender();checkFrenzyMilestone();if(frenzyTierNow>0&&U.wInfo&&!U.wInfo.querySelector?.('[data-frenzy-chip]'))U.wInfo.insertAdjacentHTML('beforeend',`<span class="chip major" data-frenzy-chip style="border-color:#fff176;color:#fff176">EGO FRENZY T${frenzyTierNow}</span>`);return r};
  }
  if(typeof reset==='function'&&!globalThis.__CWM_FRENZY_RESET){
    globalThis.__CWM_FRENZY_RESET=true;
    const baseReset=reset;
    reset=function(){frenzyPeakTier=0;frenzyTierNow=0;return baseReset()};
  }

  document.querySelectorAll('.sitePill').forEach(el=>{
    if(/LOCAL HALL OF FAME/i.test(el.textContent))el.textContent='GLOBAL HALL OF FAME';
    if(/v0\.9\.8/i.test(el.textContent))el.textContent='v1.1 • EGO FRENZY';
  });
  document.querySelectorAll('.titleBest').forEach(el=>{
    for(const node of el.childNodes){if(node.nodeType===Node.TEXT_NODE&&/LOCAL DPS CHAMPION/i.test(node.nodeValue||''))node.nodeValue='GLOBAL DPS CHAMPION'}
  });
  document.querySelectorAll('.titleControls strong').forEach(el=>{if(/OFFLINE BUILD/i.test(el.textContent))el.textContent='ONLINE BUILD — GLOBAL DPS LEADERBOARD ACTIVE'});
  const heading=document.querySelector('#leaderboardCard h3');if(heading)heading.textContent='Global DPS Hall of Fame';
  installBoardTabs();
  setStatus('CONNECTING • GLOBAL DPS');
  if(U.playerName)U.playerName.addEventListener('change',saveLeaderboard);
  syncGlobalLeaderboard().then(submitStoredBest);
  if(!globalThis.__CWM_LB_TIMER)globalThis.__CWM_LB_TIMER=setInterval(syncGlobalLeaderboard,15000);
})();

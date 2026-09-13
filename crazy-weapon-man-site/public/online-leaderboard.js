(()=>{
  const CLIENT_KEY='crazyWeaponMan.clientId.v1';
  const GAME_VERSION='v1.0-online-leaderboard';
  let onlineRows=[];

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

  renderLeaderboard=function(newId=''){
    if(!U.leaderboard)return;
    const rows=globalBoard?onlineRows:leaderboard;
    if(!rows.length){
      U.leaderboard.innerHTML=`<div class="lbempty">${globalBoard?'No global records yet. Be the first bad influence.':'Collect something irresponsible.'}</div>`;
      if(U.titleBest)U.titleBest.textContent=globalBoard?'No global weapon has earned the throne yet.':'No weapon has earned the throne yet.';
      return;
    }
    U.leaderboard.innerHTML=rows.map((x,i)=>`<div class="lbrow${x.id===newId?' lbNew':''}"><div class="lbrank">${i+1}</div><div><div class="lbname" style="color:${x.col||'#fff'}">${escapeHtml(x.name)}</div><div class="lbmeta">${escapeHtml(x.player||'Anonymous Lunatic')} • ${escapeHtml(x.rar)} ${escapeHtml(x.type)} • Lv.${Number(x.level||1)} • ${Number(x.kills||0).toLocaleString()} kills</div></div><div class="lbdps">${Number(x.dps).toLocaleString()} DPS</div></div>`).join('');
    const b=rows[0];
    if(U.titleBest)U.titleBest.innerHTML=`${escapeHtml(b.name)} — ${Number(b.dps).toLocaleString()} DPS<br><span style="font-size:11px;color:#aebfd3">held by ${escapeHtml(b.player||'Anonymous Lunatic')}${globalBoard?' • GLOBAL #1':''}</span>`;
  };

  syncGlobalLeaderboard=async function(){
    try{
      setStatus('SYNCING • GLOBAL DPS');
      const r=await fetch('/api/leaderboard?limit=10',{cache:'no-store',headers:{accept:'application/json'}});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const j=await r.json();
      onlineRows=Array.isArray(j.scores)?j.scores:[];
      globalBoard=true;
      setStatus('ONLINE • GLOBAL TOP 10');
      renderLeaderboard();
    }catch(e){
      console.warn('Global leaderboard unavailable',e);
      globalBoard=false;
      setStatus('OFFLINE • LOCAL BACKUP');
      renderLeaderboard();
    }
  };

  submitGlobalWeapon=async function(rec,w){
    try{
      setStatus('UPLOADING • PERSONAL BEST');
      const r=await fetch('/api/leaderboard',{
        method:'POST',
        headers:{'content-type':'application/json',accept:'application/json'},
        body:JSON.stringify({
          client_id:getClientId(),
          player_name:playerName(),
          weapon_name:rec.name,
          weapon_type:String(w.type||'').toUpperCase(),
          rarity:rec.rar,
          color:/^#[0-9A-Fa-f]{6}$/.test(rec.col||'')?rec.col:'#ffffff',
          dps:rec.dps,
          run_seed:runSeed,
          zone:rec.zone,
          boss:rec.boss||'',
          level:pl.lv,
          kills,
          slaughter_score:Math.max(0,Math.floor(styleScore)),
          game_version:GAME_VERSION
        })
      });
      if(!r.ok)throw new Error('HTTP '+r.status);
      const j=await r.json();
      onlineRows=Array.isArray(j.scores)?j.scores:onlineRows;
      globalBoard=true;
      setStatus(j.accepted?'ONLINE • PERSONAL BEST SAVED':'ONLINE • GLOBAL TOP 10');
      const id=j.accepted_id||'';
      renderLeaderboard(id);
      if(j.accepted){
        const rank=onlineRows.findIndex(x=>x.id===id)+1;
        if(rank===1){
          txt(pl.x+17,pl.y-82,'NEW GLOBAL DPS RECORD!',w.col,true);
          ring(pl.x+17,pl.y+10,w.col,175,7);
          shake=Math.max(shake,11);
        }else if(rank>0){
          txt(pl.x+17,pl.y-82,`GLOBAL DPS #${rank}!`,w.col,true);
        }
      }
      return !!j.accepted;
    }catch(e){
      console.warn('Global leaderboard submit failed',e);
      globalBoard=false;
      setStatus('OFFLINE • LOCAL BACKUP');
      renderLeaderboard();
      return false;
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
      level:pl.lv,kills,when:new Date().toISOString()
    };
    const local=[...leaderboard,rec].sort((a,b)=>b.dps-a.dps).slice(0,10);
    const placed=local.some(x=>x.id===rec.id);
    leaderboard=local;
    saveLeaderboard();
    renderLeaderboard(placed?rec.id:'');
    if(placed&&leaderboard[0].id===rec.id){
      txt(pl.x+17,pl.y-82,'NEW LOCAL DPS RECORD!',w.col,true);
      ring(pl.x+17,pl.y+10,w.col,150,6);
      shake=Math.max(shake,8);
      submitGlobalWeapon(rec,w);
    }
    return placed;
  };

  const heading=document.querySelector('#leaderboardCard h3');
  if(heading)heading.textContent='Global DPS Hall of Fame';
  setStatus('CONNECTING • GLOBAL DPS');
  if(U.playerName)U.playerName.addEventListener('change',saveLeaderboard);
  syncGlobalLeaderboard();
  if(!globalThis.__CWM_LB_TIMER)globalThis.__CWM_LB_TIMER=setInterval(syncGlobalLeaderboard,15000);
})();

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
  function setModeUi(mode){
    document.querySelectorAll('.sitePill').forEach(el=>{
      if(/LOCAL HALL OF FAME/i.test(el.textContent||''))el.textContent='GLOBAL HALL OF FAME';
    });
    const title=document.querySelector('.titleBest');
    if(title){
      for(const node of title.childNodes){
        if(node.nodeType===3&&/LOCAL DPS CHAMPION/i.test(node.nodeValue||'')){
          node.nodeValue=(node.nodeValue||'').replace(/LOCAL DPS CHAMPION/i,'GLOBAL DPS CHAMPION');
          break;
        }
      }
    }
    const buildLabel=[...document.querySelectorAll('.titleControls strong')].find(el=>/OFFLINE BUILD|ONLINE BUILD|NETWORK UNAVAILABLE/i.test(el.textContent||''));
    if(buildLabel){
      buildLabel.textContent=mode==='online'
        ?'ONLINE BUILD — GLOBAL DPS LEADERBOARD ACTIVE'
        :mode==='offline'
          ?'NETWORK UNAVAILABLE — LOCAL LEADERBOARD BACKUP ACTIVE'
          :'ONLINE BUILD — CONNECTING TO GLOBAL DPS LEADERBOARD';
    }
  }

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
      setModeUi('connecting');
      const r=await fetch('/api/leaderboard?limit=10',{cache:'no-store',headers:{accept:'application/json'}});
      if(!r.ok)throw new Error('HTTP '+r.status);
      const j=await r.json();
      onlineRows=Array.isArray(j.scores)?j.scores:[];
      globalBoard=true;
      setStatus('ONLINE • GLOBAL TOP 10');
      setModeUi('online');
      renderLeaderboard();
    }catch(e){
      console.warn('Global leaderboard unavailable',e);
      globalBoard=false;
      setStatus('OFFLINE • LOCAL BACKUP');
      setModeUi('offline');
      renderLeaderboard();
    }
  };

  async function submitStoredBest(){
    const rec=leaderboard[0];
    if(!rec||!Number(rec.dps)||rec.rar==='Training')return;
    try{
      const type=String(rec.type||'').toUpperCase();
      if(!['SWORD','DAGGER','NUNCHUCKS','KATANA','BOW','SHURIKEN','WAND','STAFF','HAMMER'].includes(type))return;
      const r=await fetch('/api/leaderboard',{
        method:'POST',
        headers:{'content-type':'application/json',accept:'application/json'},
        body:JSON.stringify({
          client_id:getClientId(),player_name:playerName(),weapon_name:rec.name,weapon_type:type,
          rarity:rec.rar,color:/^#[0-9A-Fa-f]{6}$/.test(rec.col||'')?rec.col:'#ffffff',dps:Math.round(rec.dps),
          run_seed:String(rec.seed||runSeed),zone:rec.zone||'Unknown',boss:rec.boss||'',level:Number(rec.level||1),
          kills:Number(rec.kills||0),slaughter_score:0,game_version:GAME_VERSION
        })
      });
      if(!r.ok)return;
      const j=await r.json();
      onlineRows=Array.isArray(j.scores)?j.scores:onlineRows;
      globalBoard=true;
      setStatus('ONLINE • GLOBAL TOP 10');
      setModeUi('online');
      renderLeaderboard(j.accepted_id||'');
    }catch(_){/* normal live sync remains the fallback */}
  }

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
      setModeUi('online');
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
      setModeUi('offline');
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
      txt(pl.x+17,pl.y-82,'NEW PERSONAL DPS BEST!',w.col,true);
      ring(pl.x+17,pl.y+10,w.col,150,6);
      shake=Math.max(shake,8);
      submitGlobalWeapon(rec,w);
    }
    return placed;
  };

  const heading=document.querySelector('#leaderboardCard h3');
  if(heading)heading.textContent='Global DPS Hall of Fame';
  setModeUi('connecting');
  setStatus('CONNECTING • GLOBAL DPS');
  if(U.playerName)U.playerName.addEventListener('change',saveLeaderboard);
  syncGlobalLeaderboard().then(submitStoredBest);
  if(!globalThis.__CWM_LB_TIMER)globalThis.__CWM_LB_TIMER=setInterval(syncGlobalLeaderboard,15000);
})();

(()=>{
  const VERSION='v1.3-elements';
  async function check(){
    const result={ok:false,version:VERSION,health:false,read:false,reportingPath:false,checkedAt:new Date().toISOString()};
    try{
      const h=await fetch('/api/health',{cache:'no-store',headers:{accept:'application/json'}}),hj=await h.json();
      result.health=!!(h.ok&&hj?.ok&&hj?.leaderboard==='ready');
      result.serverDefaultVersion=hj?.current_version||'';
      const r=await fetch(`/api/leaderboard?limit=1&view=current&version=${encodeURIComponent(VERSION)}`,{cache:'no-store',headers:{accept:'application/json'}}),j=await r.json();
      result.read=!!(r.ok&&Array.isArray(j?.scores)&&j?.version===VERSION);
      result.reportingPath=typeof submitGlobalWeapon==='function'&&typeof recordWeapon==='function';
      result.ok=result.health&&result.read&&result.reportingPath;
    }catch(e){result.error=String(e?.message||e)}
    globalThis.__CWM_LEADERBOARD_CHECK=result;
    result.ok?console.info('CWM leaderboard self-check: PASS',result):console.warn('CWM leaderboard self-check: FAIL',result);
    return result;
  }
  globalThis.CWM_LEADERBOARD_CHECK=check;
  const wait=setInterval(()=>{
    if(typeof submitGlobalWeapon!=='function')return;
    clearInterval(wait);
    if(submitGlobalWeapon.__cwmVerified)return;
    const base=submitGlobalWeapon;
    const wrapped=async function(rec,w){
      const accepted=await base(rec,w);
      try{
        const r=await fetch(`/api/leaderboard?limit=50&view=current&version=${encodeURIComponent(VERSION)}`,{cache:'no-store',headers:{accept:'application/json'}}),j=await r.json();
        const match=Array.isArray(j?.scores)&&j.scores.some(x=>String(x.name)===String(rec?.name)&&Number(x.dps)===Number(rec?.dps));
        globalThis.__CWM_LAST_WEAPON_REPORT={ok:!!match,weapon:rec?.name||'',dps:Number(rec?.dps)||0,element:w?.element?.name||'',accepted:!!accepted,checkedAt:new Date().toISOString()};
        match?console.info('CWM weapon report verified',globalThis.__CWM_LAST_WEAPON_REPORT):console.warn('CWM weapon report not found after submit',globalThis.__CWM_LAST_WEAPON_REPORT);
      }catch(e){console.warn('CWM post-submit verification failed',e)}
      return accepted;
    };
    wrapped.__cwmVerified=true;submitGlobalWeapon=wrapped;check();
  },100);
  setTimeout(check,1200);
})();

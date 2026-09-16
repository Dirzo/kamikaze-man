(()=>{
  const VERSION=globalThis.__CWM_GAME_VERSION||'v1.4-arsenal-chaos';
  async function check(){
    const result={ok:false,version:VERSION,health:false,read:false,reportingPath:false,checkedAt:new Date().toISOString()};
    try{
      const h=await fetch('/api/health',{cache:'no-store',headers:{accept:'application/json'}}),hj=await h.json();
      result.health=!!(h.ok&&hj?.ok&&hj?.leaderboard==='ready');result.serverDefaultVersion=hj?.current_version||'';
      const r=await fetch(`/api/leaderboard?limit=1&view=current&version=${encodeURIComponent(VERSION)}`,{cache:'no-store',headers:{accept:'application/json'}}),j=await r.json();
      result.read=!!(r.ok&&Array.isArray(j?.scores)&&j?.version===VERSION);
      result.reportingPath=typeof submitGlobalWeapon==='function'&&typeof recordWeapon==='function';result.ok=result.health&&result.read&&result.reportingPath;
    }catch(e){result.error=String(e?.message||e)}
    globalThis.__CWM_LEADERBOARD_CHECK=result;return result;
  }
  globalThis.CWM_LEADERBOARD_CHECK=check;setTimeout(check,1400);
})();

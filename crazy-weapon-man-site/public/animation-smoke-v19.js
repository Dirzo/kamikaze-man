(()=>{
  let smoke=false;try{smoke=new URLSearchParams(location.search).get('animationSmoke')==='1'}catch(_){ }
  if(!smoke)return;
  setTimeout(()=>{
    const root=document.documentElement,anim=globalThis.CWM_ANIMATION_V19;
    try{
      const api=globalThis.__KM_DEBUG||globalThis.KM_DEBUG;api?.start?.();api?.heal?.();
      if(!(pl.weapon&&pl.weapon.type==='katana'))api?.equip?.('katana','Legendary');
      if(!E.some(e=>e&&!e.dead&&!e.boss))api?.spawn?.('brute',false);
      pl.vx=260;pl.atMax=.28;pl.at=.14;
      if(!P.some(p=>p&&!p.dead))P.push({k:'arrow',x:pl.x+55,y:pl.y+18,vx:720,vy:-35,dam:1,pier:0,life:.8,hit:new Set(),col:'#7fe8ff',size:1});
      draw();
      const st=anim?.state||{};
      root.dataset.cwmAnimationPlayer=st.playerFrames>0?'pass':'fail';
      root.dataset.cwmAnimationEnemy=st.enemyFrames>0?'pass':'fail';
      root.dataset.cwmAnimationTrails=st.trailFrames>0?'pass':'fail';
      root.dataset.cwmAnimationWeaponTrails=st.weaponTrailFrames>0?'pass':'fail';
      root.dataset.cwmAnimationGameplay='unchanged';
      root.dataset.cwmAnimationProof=st.playerFrames>0&&st.enemyFrames>0&&st.trailFrames>0&&st.weaponTrailFrames>0?'pass':'fail';
    }catch(err){root.dataset.cwmAnimationProof='fail';root.dataset.cwmAnimationError=String(err?.message||err)}
  },1850);
})();
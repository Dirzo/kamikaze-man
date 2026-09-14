(()=>{
  const style=document.createElement('style');
  style.textContent='.cwmDpsCalc{grid-row:5!important}.waveIntro,.killChainHud{display:none!important}';
  document.head.appendChild(style);
  if(typeof spawnPack==='function'&&!globalThis.__CWM_SIMPLE_WAVE_MESSAGES){
    globalThis.__CWM_SIMPLE_WAVE_MESSAGES=true;
    const baseSpawnPack=spawnPack;
    spawnPack=function(){
      const r=baseSpawnPack();
      if(U?.msg){
        const alive=typeof E!=='undefined'?E.filter(e=>!e.dead&&!e.boss).length:0;
        U.msg.textContent=`WAVE ${stageClears+1}/${stageGoal()} • ${alive} HOSTILES`;
      }
      return r;
    };
  }
})();

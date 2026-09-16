(()=>{
  try{
    const p=new URLSearchParams(location.search);if(p.get('chaosSmoke')!=='1')return;
    setTimeout(()=>{
      try{
        gameStarted=true;paused=false;over=false;zoneT=0;
        document.body.classList.add('playing','cwmArsenalPlaying');
        U?.titleScreen?.classList.add('hidden');
        U?.zone && (U.zone.style.display='none');
        const stage=document.getElementById('gameStage');stage?.classList.add('fullscreenSim');
        // Keep the QA frame focused on gameplay instead of menus.
        draw();render?.();
      }catch(_){ }
    },1900);
  }catch(_){ }
})();
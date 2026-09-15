(()=>{
  if(globalThis.__CWL_HEAVY_BODY_PRIORITY_V1)return;
  globalThis.__CWL_HEAVY_BODY_PRIORITY_V1=true;
  const BUILD='cwl-heavy-body-priority-v1-20260915a';
  const state={build:BUILD,applied:false,applyCount:0,waitingFor:'body+integration',lastHook:'',startedAt:Date.now(),appliedAt:0};
  let stableTicks=0,ticks=0;
  function hookName(fn){return fn===globalThis.CWL_HEAVY_BODY?.drawPlayer?'cwl-heavy-body':fn?.name||'anonymous'}
  function tick(){
    ticks++;
    const body=globalThis.CWL_HEAVY_BODY,hook=globalThis.__CWM_RENDER_HOOK;
    if(!body?.ready?.()||!body?.drawPlayer||!hook){state.waitingFor='heavy body';return}
    const integrated=!!(hook.__cwmIntegrationV9||globalThis.CWM_V9_CONTENT);
    const legacySettled=!!globalThis.__CWM_V2_SPRITE_RENDERER;
    if(!integrated&&!(legacySettled&&ticks>45)){state.waitingFor='legacy integration';return}
    state.waitingFor='';state.lastHook=hookName(hook.drawPlayer);
    if(hook.drawPlayer!==body.drawPlayer||!hook.__cwlHeavyBodyPriority){
      body.installPriority();state.applied=true;state.applyCount++;state.appliedAt=Date.now();stableTicks=0;
      console.info('CWL Heavy body reclaimed final player render priority',BUILD,state);
    }else stableTicks++;
    if(stableTicks>30)clearInterval(timer);
  }
  const timer=setInterval(tick,100);tick();
  setTimeout(()=>{if(!state.applied)console.warn('CWL Heavy body priority still waiting',state)},6500);
  globalThis.CWL_HEAVY_BODY_PRIORITY={build:BUILD,state,reapply:()=>{stableTicks=0;ticks=99;tick();return state}};
})();

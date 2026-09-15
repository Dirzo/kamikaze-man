(()=>{
  if(globalThis.__CWL_HEAVY_BODY_PRIORITY_V1)return;
  globalThis.__CWL_HEAVY_BODY_PRIORITY_V1=true;
  const BUILD='cwl-heavy-body-priority-v1-20260915b',BODY_BUILD='cwl-heavy-body-v1-20260915c';
  const state={build:BUILD,bodyBuild:'',applied:false,applyCount:0,refreshCount:0,refreshing:false,waitingFor:'body+integration',lastHook:'',startedAt:Date.now(),appliedAt:0};
  let stableTicks=0,ticks=0,refreshStarted=false;
  function hookName(fn){return fn===globalThis.CWL_HEAVY_BODY?.drawPlayer?'cwl-heavy-body':fn?.name||'anonymous'}
  function refreshBody(){
    if(refreshStarted)return;refreshStarted=true;state.refreshing=true;state.refreshCount++;
    try{globalThis.__CWL_HEAVY_BODY_V1=false}catch(_){ }
    const s=document.createElement('script');
    s.src='/cwl-heavy-body-v1.js?v=cwl-heavy-20260915c';s.async=false;
    s.onload=()=>{state.refreshing=false;state.bodyBuild=globalThis.CWL_HEAVY_BODY?.build||'';console.info('CWL Heavy body refreshed for priority handoff',state.bodyBuild)};
    s.onerror=()=>{state.refreshing=false;state.waitingFor='heavy body refresh failed';console.warn('CWL Heavy body refresh HTTP failure')};
    document.body.appendChild(s);
  }
  function tick(){
    ticks++;
    const body=globalThis.CWL_HEAVY_BODY,hook=globalThis.__CWM_RENDER_HOOK;
    state.bodyBuild=body?.build||'';
    if(!body?.drawPlayer||!body?.installPriority||body.build!==BODY_BUILD){state.waitingFor='current heavy body';refreshBody();return}
    if(!body.ready?.()||!hook){state.waitingFor='heavy body image';return}
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
  setTimeout(()=>{if(!state.applied)console.warn('CWL Heavy body priority still waiting',state)},7000);
  globalThis.CWL_HEAVY_BODY_PRIORITY={build:BUILD,state,reapply:()=>{stableTicks=0;ticks=99;tick();return state}};
})();

(()=>{
  if(globalThis.__CWL_HEAVY_BODY_PRIORITY_V1)return;
  globalThis.__CWL_HEAVY_BODY_PRIORITY_V1=true;
  const BUILD='cwl-heavy-body-priority-v2-20260915a';
  const state={build:BUILD,applied:false,applyCount:0,waitingFor:'heavy body',lastHook:'',startedAt:Date.now(),appliedAt:0};
  let stable=0;
  function ownsLadyRenderer(fn,body){return fn===body?.drawPlayer||fn?.__cwlPresentationBase===body?.drawPlayer}
  function tick(){
    const body=globalThis.CWL_HEAVY_BODY,hook=globalThis.__CWM_RENDER_HOOK;
    if(!body?.drawPlayer||!body?.ready?.()){state.waitingFor='heavy body';return}
    if(!hook){state.waitingFor='render hook';return}
    state.lastHook=hook.drawPlayer?.name||'anonymous';
    if(!ownsLadyRenderer(hook.drawPlayer,body)){
      body.installPriority();state.applyCount++;stable=0;
    }else stable++;
    globalThis.__CWM_RENDER_HOOK.__cwlHeavyBodyPriority=true;
    state.applied=true;state.waitingFor='';state.appliedAt=state.appliedAt||Date.now();
    if(stable>20)clearInterval(timer);
  }
  const timer=setInterval(tick,100);tick();
  setTimeout(()=>{if(!state.applied)console.warn('CWL Heavy body priority still waiting',state)},3000);
  globalThis.CWL_HEAVY_BODY_PRIORITY={build:BUILD,state,reapply:()=>{stable=0;tick();return state}};
})();

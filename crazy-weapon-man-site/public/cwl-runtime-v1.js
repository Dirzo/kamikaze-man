(()=>{
  if(globalThis.__CWL_RUNTIME_V1)return;
  globalThis.__CWL_RUNTIME_V1=true;
  const BUILD='cwl-runtime-v1-20260915a';
  const state={build:BUILD,manifest:null,loaded:[],errors:[],ready:false};
  const loadScript=src=>new Promise((resolve,reject)=>{
    const existing=[...document.scripts].find(s=>s.src&&new URL(s.src,location.href).pathname===new URL(src,location.href).pathname);
    if(existing)return resolve(src);
    const s=document.createElement('script');s.src=src;s.async=false;
    s.onload=()=>resolve(src);s.onerror=()=>reject(new Error('Failed to load '+src));document.body.appendChild(s);
  });
  async function boot(){
    let manifest;
    try{
      const r=await fetch('/art/cwl/runtime-manifest-v1.json?runtime='+Date.now(),{cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      manifest=await r.json();state.manifest=manifest;
    }catch(e){
      state.errors.push(String(e?.message||e));
      manifest={version:'fallback',modules:[{id:'slayer-loop',src:'/cwl-slayer-loop-v1.js?v=cwl-slayer-20260915a',required:true}]};
    }
    for(const m of manifest.modules||[]){
      try{await loadScript(m.src);state.loaded.push(m.id||m.src)}
      catch(e){state.errors.push(String(e?.message||e));if(m.required)console.warn('CWL required runtime module failed',m,e);else console.info('CWL optional runtime module skipped',m,e)}
    }
    state.ready=!state.errors.length||state.loaded.length>0;
    console.info('Crazy Weapon Lady runtime ready',state);
  }
  globalThis.CWL_RUNTIME={build:BUILD,state,reload:boot};
  boot();
})();

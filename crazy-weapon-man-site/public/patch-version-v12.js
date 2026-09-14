(()=>{
  const VERSION='v1.2-danger';
  const baseFetch=globalThis.fetch.bind(globalThis);
  globalThis.__CWM_GAME_VERSION=VERSION;

  globalThis.fetch=async function(input,init){
    let nextInput=input,nextInit=init;
    try{
      const method=String(init?.method||'GET').toUpperCase();
      const raw=typeof input==='string'?input:(input?.url||'');
      if(/\/api\/leaderboard(?:\?|$)/.test(raw)){
        if(method==='POST'&&typeof init?.body==='string'){
          const body=JSON.parse(init.body);
          nextInit={...init,body:JSON.stringify({...body,game_version:VERSION})};
        }else if(method==='GET'){
          const absolute=new URL(raw,location.origin);
          absolute.searchParams.set('version',VERSION);
          nextInput=raw.startsWith('http')?absolute.toString():absolute.pathname+absolute.search;
        }
      }
    }catch(e){console.warn('Patch version bridge fallback',e)}
    return baseFetch(nextInput,nextInit);
  };
})();

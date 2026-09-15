(()=>{
  const BUILD='v3-small-chunks-20260914a';
  if(globalThis.__CWM_V3_FINALIZER)return;
  globalThis.__CWM_V3_FINALIZER=true;

  const p=(globalThis.__CWM_V3_PLAYER_B64||'').replace(/\s/g,'');
  const e=(globalThis.__CWM_V3_ENEMY_B64||'').replace(/\s/g,'');

  function fail(msg){
    globalThis.CWM_V2_SPRITES={
      build:BUILD,transport:'v3-small-chunks',ready:false,loading:false,
      playerReady:false,enemyReady:false,playerError:msg,enemyError:null,
      playerB64:p.length,enemyB64:e.length,playerBytes:0,enemyBytes:0
    };
    console.error('CWM v3 atlas finalize failed',msg);
  }

  if(p.length!==58920)return fail('player v3 base64 length '+p.length+' expected 58920');
  if(e.length!==54664)return fail('enemy v3 base64 length '+e.length+' expected 54664');

  let pr,er;
  try{pr=atob(p);er=atob(e)}catch(err){return fail('v3 base64 decode failed: '+String(err?.message||err))}
  if(pr.length!==44190)return fail('player v3 bytes '+pr.length+' expected 44190');
  if(er.length!==40998)return fail('enemy v3 bytes '+er.length+' expected 40998');
  if(pr.slice(0,4)!=='RIFF'||pr.slice(8,12)!=='WEBP')return fail('player v3 RIFF/WEBP signature failed');
  if(er.slice(0,4)!=='RIFF'||er.slice(8,12)!=='WEBP')return fail('enemy v3 RIFF/WEBP signature failed');

  globalThis.__CWM_V2_PLAYER_B64=p;
  globalThis.__CWM_V2_ENEMY_B64=e;
  globalThis.CWM_V2_SPRITES={
    build:BUILD,transport:'v3-small-chunks',ready:false,loading:true,
    playerReady:false,enemyReady:false,playerError:null,enemyError:null,
    playerB64:p.length,enemyB64:e.length,playerBytes:pr.length,enemyBytes:er.length
  };

  globalThis.__CWM_V2_SPRITE_RENDERER=false;
  const s=document.createElement('script');
  s.src='/sprite-renderer-v2.js?v=cwm-v3-sprites-20260914a';
  s.onload=()=>console.info('CWM v3 verified illustrated atlas transport loaded',BUILD,pr.length,er.length);
  s.onerror=()=>{globalThis.CWM_V2_SPRITES={...(globalThis.CWM_V2_SPRITES||{}),loading:false,playerError:'v3 sprite renderer HTTP failure'}};
  document.body.appendChild(s);
})();

(()=>{
  const BUILD='v3-small-chunks-20260915k';
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
  s.onload=()=>{
    console.info('CWM v3 verified illustrated atlas transport loaded',BUILD,pr.length,er.length);

    const loadIntegration=()=>{
      const integration=document.createElement('script');
      integration.src='/sprite-integration-v9.js?v=cwm-content-v9-20260914a';
      integration.onload=()=>console.info('CWM v9 heavy artillery + cast integration loaded');
      integration.onerror=()=>console.warn('CWM v9 integration HTTP failure');
      document.body.appendChild(integration);
    };

    const loadHeavyAtlas=()=>{
      const atlas=document.createElement('script');
      atlas.src='/heavy-runtime-atlas-v10.js?v=cwm-heavy-atlas-20260915a';
      atlas.onload=()=>{console.info('CWM v10 dynamic heavy runtime atlas loaded');loadIntegration()};
      atlas.onerror=()=>{console.warn('CWM v10 heavy runtime atlas HTTP failure');loadIntegration()};
      document.body.appendChild(atlas);
    };

    const loadVisualStack=()=>{
      const weapons=document.createElement('script');
      weapons.src='/weapon-visual-system-v8.js?v=cwm-weapon-art-20260914b';
      weapons.onload=()=>{
        console.info('CWM v8 weapon visual system loaded');
        const heavy=document.createElement('script');
        heavy.src='/heavy-artillery-v9.js?v=cwm-heavy-art-20260914a';
        heavy.onload=()=>{
          console.info('CWM v9 heavy artillery art loaded');
          const lock=document.createElement('script');
          lock.src='/heavy-base-lock-v10.js?v=cwm-heavy-lock-20260915a';
          lock.onload=()=>{console.info('CWM v10 heavy base lock loaded');loadHeavyAtlas()};
          lock.onerror=()=>{console.warn('CWM v10 heavy base lock HTTP failure');loadHeavyAtlas()};
          document.body.appendChild(lock);
        };
        heavy.onerror=()=>{console.warn('CWM v9 heavy artillery HTTP failure');loadIntegration()};
        document.body.appendChild(heavy);
      };
      weapons.onerror=()=>{console.warn('CWM v8 weapon visual system HTTP failure');loadIntegration()};
      document.body.appendChild(weapons);
    };

    const heavyMode=document.createElement('script');
    heavyMode.src='/heavy-only-v10.js?v=cwm-heavy-only-20260915a';
    heavyMode.onload=()=>{console.info('CWM v10 heavy-only modular mode loaded');loadVisualStack()};
    heavyMode.onerror=()=>{console.warn('CWM v10 heavy-only mode HTTP failure');loadVisualStack()};
    document.body.appendChild(heavyMode);

    const layers=document.createElement('script');
    layers.src='/sewer-layers-v3.js?v=cwm-sewer-layers-20260914a';
    layers.onload=()=>{
      console.info('CWM v3 sewer depth layers loaded');
      const concept=document.createElement('script');
      concept.src='/sewer-concept-v4.js?v=cwm-sewer-concept-20260914a';
      concept.onload=()=>console.info('CWM v4 concept sewer polish loaded');
      concept.onerror=()=>console.warn('CWM v4 concept sewer polish HTTP failure');
      document.body.appendChild(concept);
    };
    layers.onerror=()=>console.warn('CWM v3 sewer depth layers HTTP failure');
    document.body.appendChild(layers);
  };
  s.onerror=()=>{globalThis.CWM_V2_SPRITES={...(globalThis.CWM_V2_SPRITES||{}),loading:false,playerError:'v3 sprite renderer HTTP failure'}};
  document.body.appendChild(s);
})();

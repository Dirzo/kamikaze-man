(()=>{
  if(globalThis.__CWM_V2_ATLAS_REPAIR)return;
  globalThis.__CWM_V2_ATLAS_REPAIR=true;
  const BUILD='atlas-fetch-repair-20260914a';
  const PLAYER=['/sprite-player-data-00.js?v=cwm-v2-art-20260914c','/sprite-player-data-01.js?v=cwm-v2-art-20260914c','/sprite-player-data-02.js?v=cwm-v2-art-20260914c'];
  const ENEMY=['/sprite-enemy-data-00.js?v=cwm-v2-art-20260914c','/sprite-enemy-data-01.js?v=cwm-v2-art-20260914c','/sprite-enemy-data-02.js?v=cwm-v2-art-20260914c'];
  const EXPECT={player:58920,enemy:54664};
  function status(extra={}){globalThis.CWM_V2_SPRITES={...(globalThis.CWM_V2_SPRITES||{}),repair:BUILD,...extra}}
  function extract(text,label){
    const m=String(text||'').match(/\+\s*'([A-Za-z0-9+/=]+)/);
    if(!m||m[1].length<100)throw new Error(label+' payload missing');
    return m[1];
  }
  async function group(urls,label){
    const parts=[];
    for(let i=0;i<urls.length;i++){
      const r=await fetch(urls[i],{cache:'no-store'});
      if(!r.ok)throw new Error(label+' chunk '+i+' HTTP '+r.status);
      parts.push(extract(await r.text(),label+' chunk '+i));
    }
    const b64=parts.join('');
    if(!b64.startsWith('UklG'))throw new Error(label+' atlas missing WebP RIFF header');
    if(Math.abs(b64.length-EXPECT[label])>4)throw new Error(label+' atlas length '+b64.length+' expected '+EXPECT[label]);
    return b64;
  }
  async function run(){
    status({build:'v2-illustrated-sprites-repairing',loading:true,playerReady:false,enemyReady:false,playerError:null,enemyError:null});
    let p,e;
    try{p=await group(PLAYER,'player')}catch(err){status({loading:false,playerError:String(err?.message||err)});console.error('CWM player atlas repair failed',err);return}
    try{e=await group(ENEMY,'enemy')}catch(err){status({loading:false,enemyError:String(err?.message||err)});console.error('CWM enemy atlas repair failed',err);return}
    globalThis.__CWM_V2_PLAYER_B64=p;
    globalThis.__CWM_V2_ENEMY_B64=e;
    status({playerBytes:Math.floor(p.length*3/4),enemyBytes:Math.floor(e.length*3/4),loading:true});
    globalThis.__CWM_V2_SPRITE_RENDERER=false;
    const s=document.createElement('script');
    s.src='/sprite-renderer-v2.js?v=cwm-v2-sprites-retry-20260914a';
    s.onload=()=>{status({repairLoaded:true});console.info('CWM illustrated atlas repair loaded',BUILD)};
    s.onerror=()=>status({loading:false,playerError:'sprite renderer reload HTTP failure'});
    document.body.appendChild(s);
  }
  run();
})();

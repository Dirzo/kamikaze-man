(()=>{
  if(globalThis.__CWM_V2_ATLAS_REPAIR)return;
  globalThis.__CWM_V2_ATLAS_REPAIR=true;
  const BUILD='atlas-fetch-repair-20260914b';
  const PLAYER=['/sprite-player-data-00.js?v=cwm-v2-art-20260914d','/sprite-player-data-01.js?v=cwm-v2-art-20260914d','/sprite-player-data-02.js?v=cwm-v2-art-20260914d'];
  const ENEMY=['/sprite-enemy-data-00.js?v=cwm-v2-art-20260914d','/sprite-enemy-data-01.js?v=cwm-v2-art-20260914d','/sprite-enemy-data-02.js?v=cwm-v2-art-20260914d'];
  const EXPECT_BYTES={player:44190,enemy:40998};
  function status(extra={}){globalThis.CWM_V2_SPRITES={...(globalThis.CWM_V2_SPRITES||{}),repair:BUILD,...extra}}
  function extract(text,label){
    const m=String(text||'').match(/\+\s*'([A-Za-z0-9+/=]+)/);
    if(!m||m[1].length<100)throw new Error(label+' payload missing');
    return m[1];
  }
  function fromB64(b64,label){
    let raw;
    try{raw=atob(b64)}catch(_){throw new Error(label+' base64 decode failed')}
    const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    return bytes;
  }
  function toB64(bytes){
    let out='';
    const step=0x8000;
    for(let i=0;i<bytes.length;i+=step)out+=String.fromCharCode(...bytes.subarray(i,Math.min(bytes.length,i+step)));
    return btoa(out);
  }
  function canonicalizeWebP(b64,label){
    const bytes=fromB64(b64,label);
    if(bytes.length<12)throw new Error(label+' atlas too small ('+bytes.length+' bytes)');
    const sig=String.fromCharCode(bytes[0],bytes[1],bytes[2],bytes[3]);
    const webp=String.fromCharCode(bytes[8],bytes[9],bytes[10],bytes[11]);
    if(sig!=='RIFF'||webp!=='WEBP')throw new Error(label+' atlas missing RIFF/WEBP header');
    const dv=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    const declared=dv.getUint32(4,true)+8;
    if(declared<12||declared>bytes.length)throw new Error(label+' RIFF declares '+declared+' bytes but only '+bytes.length+' fetched');
    const expected=EXPECT_BYTES[label];
    if(expected&&declared!==expected)throw new Error(label+' RIFF size '+declared+' expected '+expected);
    const trimmed=bytes.slice(0,declared);
    return {b64:toB64(trimmed),rawBytes:bytes.length,bytes:trimmed.length,trimmedBytes:bytes.length-trimmed.length};
  }
  async function group(urls,label){
    const parts=[];
    for(let i=0;i<urls.length;i++){
      const r=await fetch(urls[i],{cache:'no-store'});
      if(!r.ok)throw new Error(label+' chunk '+i+' HTTP '+r.status);
      parts.push(extract(await r.text(),label+' chunk '+i));
    }
    return canonicalizeWebP(parts.join(''),label);
  }
  async function run(){
    status({build:'v2-illustrated-sprites-repairing',loading:true,playerReady:false,enemyReady:false,playerError:null,enemyError:null});
    let p,e;
    try{p=await group(PLAYER,'player')}catch(err){status({loading:false,playerError:String(err?.message||err)});console.error('CWM player atlas repair failed',err);return}
    try{e=await group(ENEMY,'enemy')}catch(err){status({loading:false,enemyError:String(err?.message||err)});console.error('CWM enemy atlas repair failed',err);return}
    globalThis.__CWM_V2_PLAYER_B64=p.b64;
    globalThis.__CWM_V2_ENEMY_B64=e.b64;
    status({playerBytes:p.bytes,enemyBytes:e.bytes,playerRawBytes:p.rawBytes,enemyRawBytes:e.rawBytes,playerTrimmedBytes:p.trimmedBytes,enemyTrimmedBytes:e.trimmedBytes,loading:true});
    globalThis.__CWM_V2_SPRITE_RENDERER=false;
    const s=document.createElement('script');
    s.src='/sprite-renderer-v2.js?v=cwm-v2-sprites-retry-20260914b';
    s.onload=()=>{status({repairLoaded:true});console.info('CWM illustrated atlas repair loaded',BUILD,p,e)};
    s.onerror=()=>status({loading:false,playerError:'sprite renderer reload HTTP failure'});
    document.body.appendChild(s);
  }
  run();
})();

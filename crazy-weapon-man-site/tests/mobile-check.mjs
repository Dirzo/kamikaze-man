// Chrome device emulation checks the actual coarse-pointer layout and two-thumb input in CI.
import {spawn} from 'node:child_process';
import {writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const out=process.env.SMOKE_OUT,port=Number(process.env.PORT||8878),debugPort=port+1;
const profile=mkdtempSync(join(tmpdir(),'cwm-mobile-'));
const chrome=spawn(process.env.CHROME,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let socket;
try {
  let tabs;
  for(let i=0;i<100;i++){try{tabs=await(await fetch(`http://127.0.0.1:${debugPort}/json`)).json();break;}catch{await delay(100);}}
  if(!tabs)throw Error('Chrome did not start');
  socket=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  let id=0;const pending=new Map();
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(m.error.message));else p.resolve(m.result);}};
  const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));});
  const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true})).result.value;
  await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true,screenOrientation:{type:'landscapePrimary',angle:90}});
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
  await send('Page.navigate',{url:`http://127.0.0.1:${port}/?smoke&mobile`});
  let result;
  for(let i=0;i<200;i++){result=await evaluate('document.documentElement.dataset.smoke');if(result)break;await delay(100);}
  const report=await evaluate('document.getElementById("smoke-results")?.textContent');
  console.log(report);writeFileSync(join(out,'mobile-results.txt'),report||'Mobile checks did not finish');
  if(result!=='pass')throw Error('Mobile browser regression failed');
  for(const scene of ['combat','canyon','bag']) {
    await send('Page.navigate',{url:`http://127.0.0.1:${port}/?capture=${scene}`});
    for(let i=0;i<100;i++){if(await evaluate('document.documentElement.dataset.capture==="ready"'))break;await delay(100);}
    await delay(300);
    const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(join(out,`mobile-${scene}.png`),Buffer.from(shot.data,'base64'));
  }
  // Rotation and browser-bar resize must also refit without reloading the run.
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true,screenOrientation:{type:'portraitPrimary',angle:0}});
  await delay(300);
  const fits=await evaluate('(()=>{const t=document.getElementById("touch"),m=t.dataset.mode;t.dataset.mode="play";const c=document.getElementById("screen").getBoundingClientRect(),j=document.getElementById("joystick").getBoundingClientRect(),p=document.querySelector("#pad .dash").getBoundingClientRect();t.dataset.mode=m;return c.left>=0&&c.right<=innerWidth&&c.bottom<j.top&&c.bottom<p.top;})()');
  if(!fits)throw Error('Portrait rotation overlaps controls');
  const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(join(out,'mobile-portrait.png'),Buffer.from(shot.data,'base64'));
  console.log('PASS mobile portrait rotation refits the playfield');
} finally {socket?.close();chrome.kill();await delay(200);rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});}

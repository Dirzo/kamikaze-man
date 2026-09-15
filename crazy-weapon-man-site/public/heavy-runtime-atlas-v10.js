(()=>{
  if(globalThis.__CWM_HEAVY_RUNTIME_ATLAS_V10)return;
  globalThis.__CWM_HEAVY_RUNTIME_ATLAS_V10=true;
  const BUILD='v10-heavy-runtime-atlas-20260915b';
  const TILE_W=256,TILE_H=128,COLS=8,ROWS=8,MAX=COLS*ROWS,OX=48,OY=64;
  const ANIMATED=new Set(['rotary_reclaimer','pressure_propeller']);
  const canvas=document.createElement('canvas');canvas.width=TILE_W*COLS;canvas.height=TILE_H*ROWS;
  const A=canvas.getContext('2d',{alpha:true});A.imageSmoothingEnabled=true;
  const slots=new Map();let cursor=0,hits=0,misses=0;
  const state={build:BUILD,selfTest:null,prewarmed:false,error:null};
  const keyOf=w=>[w?.heavyBaseId||'',w?.name||'',w?.rar||'',w?.material?.code||'',w?.element?.id||'',(w?.traits||[]).map(t=>t?.code||t?.n||t).join(','),w?.intensity||'',w?.cap||''].join('|');
  const tileRect=slot=>({x:(slot%COLS)*TILE_W,y:Math.floor(slot/COLS)*TILE_H});
  function makeTile(w,sourceDraw){
    const key=keyOf(w);if(slots.has(key)){hits++;return slots.get(key)}
    misses++;const slot=cursor++%MAX;
    for(const [k,v] of slots){if(v.slot===slot){slots.delete(k);break}}
    const r=tileRect(slot);A.clearRect(r.x,r.y,TILE_W,TILE_H);A.save();A.translate(r.x+OX,r.y+OY);
    sourceDraw(A,w,{scale:1,time:0,glow:true,attacking:false,attackT:0});A.restore();
    const rec={slot,key,x:r.x,y:r.y,w:TILE_W,h:TILE_H,originX:OX,originY:OY};slots.set(key,rec);return rec;
  }
  function muzzleFlash(X,w,opt,scale){
    if(!opt?.attacking||opt.attackT<.28||opt.attackT>.72)return;
    const m=globalThis.CWM_HEAVY_ART?.meta?.(w);if(!m?.muzzle)return;
    const d=globalThis.CWM_WEAPON_VISUAL?.describe?.(w),c=d?.elementVisual?.c||d?.emissive||'#ffd45c';
    const q=Math.sin(Math.max(0,Math.min(1,(opt.attackT-.28)/.44))*Math.PI);
    X.save();X.scale(scale,scale);X.translate(m.muzzle[0],m.muzzle[1]);X.globalCompositeOperation='screen';X.globalAlpha=.48+.42*q;X.fillStyle=c;X.shadowColor=c;X.shadowBlur=16;
    X.beginPath();X.moveTo(0,-5);X.lineTo(18,-11);X.lineTo(11,-3);X.lineTo(34,0);X.lineTo(11,3);X.lineTo(18,11);X.lineTo(0,5);X.closePath();X.fill();
    X.fillStyle='#fff7d5';X.beginPath();X.arc(5,0,3+5*q,0,Math.PI*2);X.fill();X.restore();
  }
  function representative(base,i){return{id:-2000-i,type:'hammer',name:base.label,mod:'none',rar:'Common',col:'#aab0b7',p:1,lv:1,m:1,crit:0,material:null,traits:[],intensity:'',cap:null,capName:'',capText:'',killStacks:0,heavyBaseId:base.id,heavyLabel:base.label,heavySubclass:base.subclass}}
  function install(){
    const VF=globalThis.CWM_WEAPON_VISUAL,HA=globalThis.CWM_HEAVY_ART;
    if(!VF?.draw||!VF?.family||!HA?.draw){setTimeout(install,50);return}
    if(VF.__heavyRuntimeAtlasV10)return;
    const sourceDraw=VF.draw.bind(VF);
    function atlasDraw(X,w,opt={}){
      if(VF.family(w)!=='heavy')return sourceDraw(X,w,opt);
      const subtype=w?.heavyBaseId||HA.subtype?.(w)||'';
      const sc=Number(opt.scale)||1;
      if(ANIMATED.has(subtype)||opt.attacking){
        const r=sourceDraw(X,w,opt);muzzleFlash(X,w,opt,sc);return r===undefined?true:r;
      }
      const rec=makeTile(w,sourceDraw);X.save();X.scale(sc,sc);X.drawImage(canvas,rec.x,rec.y,rec.w,rec.h,-rec.originX,-rec.originY,rec.w,rec.h);X.restore();muzzleFlash(X,w,opt,sc);return true;
    }
    function selfTest(){
      const bases=globalThis.CWM_HEAVY_ONLY?.bases||[];const results=[],failures=[];
      for(let i=0;i<bases.length;i++){
        const w=representative(bases[i],i);
        try{const rec=makeTile(w,sourceDraw);const ok=!!rec&&rec.w===TILE_W&&rec.h===TILE_H;results.push({base:bases[i].id,ok,slot:rec?.slot});if(!ok)failures.push(bases[i].id)}
        catch(e){results.push({base:bases[i].id,ok:false,error:String(e?.message||e)});failures.push(bases[i].id)}
      }
      const report={ok:bases.length===10&&failures.length===0,build:BUILD,tested:bases.length,passed:bases.length-failures.length,failures,results,at:Date.now()};state.selfTest=report;state.prewarmed=report.ok;globalThis.__CWL_HEAVY_ATLAS_TEST=report;return report;
    }
    VF.draw=atlasDraw;VF.__heavyRuntimeAtlasV10=true;
    globalThis.CWM_HEAVY_RUNTIME_ATLAS={build:BUILD,canvas,ready:true,tile:[TILE_W,TILE_H],capacity:MAX,keyOf,prewarm(ws=[]){ws.forEach(w=>makeTile(w,sourceDraw))},selfTest,stats:()=>({entries:slots.size,hits,misses,capacity:MAX,selfTest:state.selfTest}),clear(){slots.clear();cursor=0;hits=0;misses=0;A.clearRect(0,0,canvas.width,canvas.height)},state};
    try{const r=selfTest();if(!r.ok)console.error('CWL Heavy atlas visual self-test FAILED',r);else console.info('CWL Heavy atlas visual self-test PASS',r)}catch(e){state.error=String(e?.message||e);console.error('CWL Heavy atlas self-test threw',e)}
  }
  install();
})();

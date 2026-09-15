(()=>{
  if(globalThis.CWL_COMBAT_HOOK_TRANSFORM_V1)return;
  const BUILD='cwl-combat-hook-transform-v1-20260915c';
  const helper=`
const __CWL_COMBAT_HOOK_BUILD='${BUILD}';
const __CWL_COMBAT_HOOKS={hit:[],kill:[],skill:[]};
if(new URLSearchParams(location.search).get('cwlSmoke')==='1'&&!globalThis.__CWL_SMOKE_RAF_LIMIT){
  globalThis.__CWL_SMOKE_RAF_LIMIT=true;
  const __cwlSmokeRAF=globalThis.requestAnimationFrame.bind(globalThis);let __cwlSmokeFrameCount=0;
  globalThis.requestAnimationFrame=fn=>__cwlSmokeFrameCount++<5?__cwlSmokeRAF(fn):0;
}
function __cwlCombatOn(kind,fn){if(!__CWL_COMBAT_HOOKS[kind]||typeof fn!=='function')return()=>{};__CWL_COMBAT_HOOKS[kind].push(fn);return()=>{let a=__CWL_COMBAT_HOOKS[kind],i=a.indexOf(fn);if(i>=0)a.splice(i,1)}}
function __cwlCombatEmit(kind,payload){let a=__CWL_COMBAT_HOOKS[kind];if(!a)return;for(const fn of [...a]){try{fn(payload)}catch(e){console.warn('CWL native combat hook failed',kind,e)}}}
function __cwlCombatState(){let w=curW();return{pl,E,weapon:w,time,W,H,G,stageClears,bossMode,gameStarted,paused,over,dps:estimateDPS(w)}}
globalThis.CWL_NATIVE_COMBAT={
  build:__CWL_COMBAT_HOOK_BUILD,
  on:__cwlCombatOn,
  state:__cwlCombatState,
  hit:(e,damage,opt={})=>hitE(e,damage,opt),
  rank:w=>rarityRank(w||curW()),
  ao:w=>weaponAoe(w||curW()),
  damage:()=>wdmg(),
  addStyle:(points,label='SLAUGHTER')=>styleAdd(Math.max(0,Math.round(Number(points)||0)),label),
  fx:{
    ring:(...a)=>ring(...a),part:(...a)=>part(...a),txt:(...a)=>txt(...a),beam:(...a)=>beam(...a),boom:(...a)=>boom(...a),
    shake:n=>{shake=Math.max(shake,Number(n)||0);return shake},
    inv:n=>{pl.inv=Math.max(Number(pl.inv)||0,Number(n)||0);return pl.inv},
    attackPose:n=>{pl.atMax=Math.max(Number(pl.atMax)||0,Number(n)||0);pl.at=Math.max(Number(pl.at)||0,Number(n)||0);return pl.at}
  }
};
globalThis.__CWL_NATIVE_COMBAT_HOOKS=__CWL_COMBAT_HOOK_BUILD;
`;

  function transform(input){
    let html=String(input||'');
    const report={build:BUILD,ok:false,patches:{helper:0,hit:0,kill:0,skill:0},warnings:[],at:Date.now()};
    if(!html){report.warnings.push('empty game html');globalThis.__CWL_COMBAT_HOOK_TRANSFORM_LAST=report;return html}
    const hitStart=html.indexOf('function hitE(');
    if(hitStart>=0){html=html.slice(0,hitStart)+helper+html.slice(hitStart);report.patches.helper=1}else report.warnings.push('missing hitE for helper injection');
    function patchSegment(name,nextName,patcher){const start=html.indexOf('function '+name+'(');if(start<0){report.warnings.push('missing '+name);return 0}const end=nextName?html.indexOf('\nfunction '+nextName+'(',start+10):html.indexOf('\nfunction ',start+10);const stop=end>=0?end:html.length;let seg=html.slice(start,stop),next=patcher(seg);if(next===seg){report.warnings.push('unable to patch '+name);return 0}html=html.slice(0,start)+next+html.slice(stop);return 1}
    report.patches.hit=patchSegment('hitE','crit',seg=>seg.replace(
      "if(e.hp<=0)killE(e,n>=before,o.sourceMod||null,o.sourceDam||n);return n",
      "if(e.hp<=0)killE(e,n>=before,o.sourceMod||null,o.sourceDam||n);__cwlCombatEmit('hit',{enemy:e,damage:n,before,after:e.hp,options:o,weapon:curW(),time});return n"
    ));
    report.patches.kill=patchSegment('killE','checkLevel',seg=>seg.replace(/checkLevel\(\)\s*}\s*$/,"checkLevel();__cwlCombatEmit('kill',{enemy:e,oneShot:one,sourceMod,sourceDamage:sd,weapon:w,time})}"));
    report.patches.skill=patchSegment('skill',null,seg=>seg.replace(/proceduralProc\(w\)\s*}\s*$/,"proceduralProc(w);__cwlCombatEmit('skill',{weapon:w,cost,cooldown:pl.scd,mana:pl.mana,time})}"));
    report.ok=Object.values(report.patches).every(v=>v===1);
    globalThis.__CWL_COMBAT_HOOK_TRANSFORM_LAST=report;
    if(report.ok)console.info('CWL native combat hook transform applied',report);else console.warn('CWL native combat hook transform degraded',report);
    return html;
  }
  globalThis.CWL_COMBAT_HOOK_TRANSFORM_V1={build:BUILD,transform};
})();

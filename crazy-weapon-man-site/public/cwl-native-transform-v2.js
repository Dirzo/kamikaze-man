(()=>{
  if(globalThis.CWL_NATIVE_TRANSFORM_V2)return;
  const BUILD='cwl-native-heavy-transform-v4-20260915a';
  const BASES=[
    ['industrial_maul','Industrial Maul','heavy_melee'],
    ['siege_hammer','Siege Hammer','heavy_melee'],
    ['pile_driver','Pile Driver','heavy_melee'],
    ['welded_cleaver','Welded Cleaver','heavy_melee'],
    ['junk_cannon','Junk Cannon','heavy_ballistic'],
    ['scrap_mortar','Scrap Mortar','heavy_ballistic'],
    ['rotary_reclaimer','Rotary Reclaimer','heavy_ballistic'],
    ['landfill_lobber','Landfill Lobber','heavy_ballistic'],
    ['pressure_propeller','Pressure Propeller','heavy_weird'],
    ['siege_toaster','Siege Toaster','heavy_weird']
  ];

  const nativeHelper=`
const __CWL_NATIVE_HEAVY_BUILD='${BUILD}';
const __CWL_NATIVE_HEAVY_BASES=${JSON.stringify(BASES)};
function __cwlHeavyHash(s){let h=2166136261>>>0;s=String(s||'');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function __cwlHeavyBase(seed){let b=__CWL_NATIVE_HEAVY_BASES[__cwlHeavyHash(seed)%__CWL_NATIVE_HEAVY_BASES.length];return{id:b[0],label:b[1],subclass:b[2]}}
function __cwlHeavyName(w,b){let p=[];if(Array.isArray(w.traits))for(const t of w.traits.slice(0,2))if(t&&t.n)p.push(t.n);if(w.material&&w.material.n)p.push(w.material.n);if(w.intensity)p.push(w.intensity);p.push(b.label);return p.join(' ').replace(/\\s{2,}/g,' ').trim()||b.label}
function __cwlNativeHeavy(w){
  if(!w||w.kind==='armor')return w;
  let originalType=w.__cwmOriginalType||w.type||'hammer',originalName=w.__cwmOriginalName||String(w.name||'Heavy Weapon');
  let b=w.heavyBaseId&&__CWL_NATIVE_HEAVY_BASES.find(x=>x[0]===w.heavyBaseId);b=b?{id:b[0],label:b[1],subclass:b[2]}:__cwlHeavyBase(String(w.id||0)+'|'+originalName+'|'+String(w.rar||''));
  w.__cwmOriginalType=originalType;w.__cwmOriginalName=originalName;w.type='hammer';w.heavyBaseId=b.id;w.heavyLabel=b.label;w.heavySubclass=b.subclass;
  w.name=__cwlHeavyName(w,b);
  if(originalType!=='hammer'){w.mod='none';if('cap' in w)w.cap=null;if('capName' in w)w.capName='';if('capText' in w)w.capText=''}
  w.__cwlNativeHeavyBuild=__CWL_NATIVE_HEAVY_BUILD;
  try{if(typeof detectSynergy==='function')w.synergy=detectSynergy(w)}catch(_){ }
  try{if(typeof proceduralText==='function')w.text=proceduralText(w)+(w.synergy?` SYNERGY: ${w.synergy.name} — ${w.synergy.desc}`:'')}catch(_){ }
  return w
}
function __cwlTrainingHeavy(){return __cwlNativeHeavy({id:0,type:'hammer',name:'Training Industrial Maul',mod:'none',text:'A deliberate two-handed training maul.',rar:'Training',col:'#dfe5ed',p:.8,lv:10,m:1,crit:0,material:null,traits:[],intensity:'',cap:null,capName:'',capText:'',killStacks:0,heavyBaseId:'industrial_maul'})}
function __cwlNativeHeavySelfTest(n=40){
  n=Math.max(8,Math.min(80,Number(n)||40));let failures=[];
  for(let i=0;i<n;i++){
    let w=makeW(10+(i%8),i%2===0),r={type:w&&w.type,base:w&&w.heavyBaseId,name:w&&w.name};
    if(r.type!=='hammer'||!__CWL_NATIVE_HEAVY_BASES.some(b=>b[0]===r.base))failures.push(r)
  }
  let foreign=__cwlNativeHeavy({id:-991,type:'shuriken',name:'QA Foreign Shuriken',rar:'Rare',col:'#fff',p:1,lv:10,m:1,crit:0,material:null,traits:[],killStacks:0});
  if(foreign.type!=='hammer'||!foreign.heavyBaseId)failures.push({foreign});
  let current=curW(),currentOK=!!current&&current.type==='hammer'&&!!current.heavyBaseId;
  let report={ok:failures.length===0&&currentOK,build:__CWL_NATIVE_HEAVY_BUILD,rolls:n,passed:n-failures.length,current:{type:current&&current.type,base:current&&current.heavyBaseId,name:current&&current.name},foreign:{type:foreign.type,base:foreign.heavyBaseId,name:foreign.name},failures:failures.slice(0,6),at:Date.now()};
  globalThis.__CWL_NATIVE_HEAVY_TEST=report;return report
}
globalThis.__CWL_NATIVE_HEAVY_LOCK=__CWL_NATIVE_HEAVY_BUILD;
globalThis.CWL_NATIVE_HEAVY_API={build:__CWL_NATIVE_HEAVY_BUILD,bases:__CWL_NATIVE_HEAVY_BASES.map(b=>({id:b[0],label:b[1],subclass:b[2]})),ensure:__cwlNativeHeavy,training:__cwlTrainingHeavy,state:()=>({weapon:curW(),history:['hammer']}),selfTest:__cwlNativeHeavySelfTest};
`;

  function transform(input){
    let html=String(input||'');
    const report={build:BUILD,ok:false,critical:false,patches:{},warnings:[],at:Date.now()};
    if(!html){report.warnings.push('empty game html');globalThis.__CWL_NATIVE_TRANSFORM_LAST=report;return html}

    function patchRegex(id,re,replacer,{critical=false,all=false}={}){
      let count=0;
      if(all){html=html.replace(re,(...args)=>{count++;return typeof replacer==='function'?replacer(...args):replacer})}
      else{const m=html.match(re);count=m?1:0;if(count)html=html.replace(re,replacer)}
      report.patches[id]=count;
      if(!count){report.warnings.push('missing '+id);if(critical)report.critical=false}
      return count;
    }

    report.critical=true;
    patchRegex('helper',/function\s+makeW\s*\(\s*l\s*,\s*elite\s*=\s*false\s*\)\s*\{/,m=>nativeHelper+m,{critical:true});
    patchRegex('type-roll',/type\s*=\s*(?:chooseWeaponType\s*\(\s*\)|pick\(\s*\[[^\]]*['"]hammer['"][^\]]*\]\s*\))/,"type='hammer'",{critical:true});
    patchRegex('makeW-return',/(w\.text\s*=\s*proceduralText\(w\)[^;]*;\s*)return\s+w\s*}/,(m,p1)=>p1+'return __cwlNativeHeavy(w)}',{critical:true});
    patchRegex('equip-guard',/function\s+equip\s*\(\s*w\s*\)\s*\{/,'function equip(w){w=__cwlNativeHeavy(w);',{critical:true});
    patchRegex('spawnDrop-guard',/function\s+spawnDrop\s*\(\s*x\s*,\s*y\s*,\s*item\s*,\s*cache\s*=\s*false\s*\)\s*\{/,'function spawnDrop(x,y,item,cache=false){if(item&&item.kind!==\'armor\')item=__cwlNativeHeavy(item);',{critical:true});
    patchRegex('training-fallback',/type\s*:\s*['"]sword['"]\s*,\s*name\s*:\s*['"]Training Sword['"]/g,"type:'hammer',name:'Training Industrial Maul',heavyBaseId:'industrial_maul',heavyLabel:'Industrial Maul',heavySubclass:'heavy_melee'",{all:true});

    for(const id of ['helper','type-roll','makeW-return','equip-guard','spawnDrop-guard'])if(!report.patches[id])report.critical=false;
    report.ok=report.critical;
    globalThis.__CWL_NATIVE_TRANSFORM_LAST=report;
    if(report.ok)console.info('CWL native Heavy transform applied',report);
    else console.warn('CWL native Heavy transform degraded; base game will still boot',report);
    return html;
  }

  globalThis.CWL_NATIVE_TRANSFORM_V2={build:BUILD,transform};
})();

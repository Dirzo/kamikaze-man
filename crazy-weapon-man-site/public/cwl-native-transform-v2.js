(()=>{
  if(globalThis.CWL_NATIVE_TRANSFORM_V2)return;
  const BUILD='cwl-native-heavy-transform-v2-20260915a';
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
  try{w.text=proceduralText(w)}catch(_){ }
  return w
}
function __cwlTrainingHeavy(){return __cwlNativeHeavy({id:0,type:'hammer',name:'Training Industrial Maul',mod:'none',text:'A deliberate two-handed training maul.',rar:'Training',col:'#dfe5ed',p:.8,lv:10,m:1,crit:0,material:null,traits:[],intensity:'',cap:null,capName:'',capText:'',killStacks:0,heavyBaseId:'industrial_maul'})}
function __cwlNativeHeavySelfTest(n=40){
  n=Math.max(8,Math.min(80,Number(n)||40));let samples=[],failures=[];
  for(let i=0;i<n;i++){let w=makeW(10+(i%8),i%2===0),r={type:w&&w.type,base:w&&w.heavyBaseId,name:w&&w.name};samples.push(r);if(r.type!=='hammer'||!__CWL_NATIVE_HEAVY_BASES.some(b=>b[0]===r.base))failures.push(r)}
  let foreign=__cwlNativeHeavy({id:-991,type:'shuriken',name:'QA Foreign Shuriken',rar:'Rare',col:'#fff',p:1,lv:10,m:1,crit:0,material:null,traits:[],killStacks:0});
  if(foreign.type!=='hammer'||!foreign.heavyBaseId)failures.push({foreign});
  let current=curW(),currentOK=!!current&&current.type==='hammer'&&!!current.heavyBaseId;
  let report={ok:failures.length===0&&currentOK,build:__CWL_NATIVE_HEAVY_BUILD,rolls:n,passed:n-failures.length,current:{type:current&&current.type,base:current&&current.heavyBaseId,name:current&&current.name},foreign:{type:foreign.type,base:foreign.heavyBaseId,name:foreign.name},failures:failures.slice(0,6),at:Date.now()};
  globalThis.__CWL_NATIVE_HEAVY_TEST=report;return report
}
globalThis.__CWL_NATIVE_HEAVY_LOCK=__CWL_NATIVE_HEAVY_BUILD;
globalThis.CWL_NATIVE_HEAVY_API={build:__CWL_NATIVE_HEAVY_BUILD,bases:__CWL_NATIVE_HEAVY_BASES.map(b=>({id:b[0],label:b[1],subclass:b[2]})),ensure:__cwlNativeHeavy,training:__cwlTrainingHeavy,state:()=>({weapon:curW(),history:['hammer']}),selfTest:__cwlNativeHeavySelfTest};
`;

  function one(html,needle,replacement,label){
    const count=html.split(needle).length-1;
    if(count!==1)throw new Error(`CWL native transform expected 1 ${label} signature, found ${count}`);
    return html.replace(needle,replacement);
  }

  function transform(input){
    let html=String(input||'');
    if(!html)throw new Error('CWL native transform received empty game HTML');

    const makeStart='function makeW(l,elite=false){';
    html=one(html,makeStart,nativeHelper+makeStart,'makeW');

    const typeNeedle="function makeW(l,elite=false){let r=rr(elite),rank=RANKS.indexOf(r.n),type=pick(['sword','dagger','bow','wand','staff','hammer']);";
    const typeReplacement="function makeW(l,elite=false){let r=rr(elite),rank=RANKS.indexOf(r.n),type='hammer';";
    html=one(html,typeNeedle,typeReplacement,'weapon type roll');

    html=one(html,'w.text=proceduralText(w);return w}','w.text=proceduralText(w);return __cwlNativeHeavy(w)}','makeW return');
    html=one(html,"function curW(){return pl.weapon||{type:'sword',name:'Training Sword',mod:'none',text:'A clean three-hit training combo: forehand, backhand, then an overhead finisher.',rar:'Training',col:'#dfe5ed',p:.8,lv:10,m:1,crit:0,material:null,traits:[],killStacks:0}}","function curW(){return pl.weapon||__cwlTrainingHeavy()}",'training weapon');
    html=one(html,'function equip(w){let old=pl.weapon','function equip(w){w=__cwlNativeHeavy(w);let old=pl.weapon','equip guard');
    html=one(html,"});U.banner.style.display='none';","});pl.weapon=__cwlTrainingHeavy();U.banner.style.display='none';",'reset heavy weapon');

    globalThis.__CWL_NATIVE_TRANSFORM_LAST={build:BUILD,ok:true,at:Date.now()};
    return html;
  }

  globalThis.CWL_NATIVE_TRANSFORM_V2={build:BUILD,transform};
})();

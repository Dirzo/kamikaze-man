import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const publicDir=path.join(root,'public');

function fail(message,extra){
  console.error('\nCWL HEAVY VALIDATION FAILED:',message);
  if(extra)console.error(extra);
  process.exit(1);
}
function contextAround(text,needle,before=300,after=2400){
  const i=text.indexOf(needle);
  if(i<0)return `NOT FOUND: ${needle}`;
  return text.slice(Math.max(0,i-before),Math.min(text.length,i+after));
}
function functionSlice(text,name){
  const start=text.indexOf(`function ${name}`);
  if(start<0)return '';
  const next=text.indexOf('\nfunction ',start+(`function ${name}`).length);
  return text.slice(start,next<0?text.length:next);
}

const sandbox={__CWM_PACKED:[]};
for(let i=0;i<9;i++){
  const file=path.join(publicDir,'game',`chunk-${String(i).padStart(2,'0')}.js`);
  const code=fs.readFileSync(file,'utf8');
  try{vm.runInNewContext(code,sandbox,{filename:file,timeout:1000})}
  catch(e){fail(`could not execute ${path.basename(file)}`,e)}
}
if(sandbox.__CWM_PACKED.length!==9)fail(`expected 9 packed chunks, got ${sandbox.__CWM_PACKED.length}`);

let html;
try{
  const packed=Buffer.from(sandbox.__CWM_PACKED.join('').replace(/\s/g,''),'base64');
  html=gunzipSync(packed).toString('utf8');
}catch(e){fail('packed game could not be decoded/gunzipped',e)}
if(!html.includes('Crazy Weapon Man')&&!html.includes('CRAZY WEAPON MAN'))fail('decoded payload does not look like the game');

const transformPath=pathToFileURL(path.join(publicDir,'cwl-native-transform-v2.js')).href+`?t=${Date.now()}`;
await import(transformPath);
const transform=globalThis.CWL_NATIVE_TRANSFORM_V2?.transform;
if(typeof transform!=='function')fail('native Heavy transform did not register');

let output;
try{output=transform(html)}catch(e){fail('native Heavy transform threw',e)}
const report=globalThis.__CWL_NATIVE_TRANSFORM_LAST;
if(!report?.ok){
  console.error('\n--- ACTUAL PRODUCTION makeW CONTEXT ---\n'+contextAround(html,'function makeW'));
  console.error('\n--- ACTUAL PRODUCTION spawnDrop CONTEXT ---\n'+contextAround(html,'function spawnDrop'));
  console.error('\n--- ACTUAL PRODUCTION equip CONTEXT ---\n'+contextAround(html,'function equip'));
  fail('native Heavy transform reported degraded state',report);
}

const required={
  helper:report.patches?.helper,
  typeRoll:report.patches?.['type-roll'],
  makeWReturn:report.patches?.['makeW-return'],
  equipGuard:report.patches?.['equip-guard'],
  spawnDropGuard:report.patches?.['spawnDrop-guard'],
  trainingFallback:report.patches?.['training-fallback']
};
for(const [key,value] of Object.entries(required))if(!value)fail(`required patch missing: ${key}`,report);

const makeWContext=functionSlice(output,'makeW');
if(!makeWContext)fail('transformed makeW function could not be isolated');
if(/type\s*=\s*chooseWeaponType\s*\(\s*\)/.test(makeWContext))fail('makeW still calls chooseWeaponType after transform',makeWContext);
if(/type\s*=\s*pick\(\s*\[[^\]]*['"]hammer['"][^\]]*\]\s*\)/.test(makeWContext))fail('multi-family weapon type roll still exists after transform',makeWContext);
if(!makeWContext.includes("type='hammer'"))fail('forced hammer type is missing from makeW',makeWContext);
if(!makeWContext.includes('return __cwlNativeHeavy(w)'))fail('makeW does not return through Heavy normalizer',makeWContext);
if(!/function\s+equip\s*\(\s*w\s*\)\s*\{\s*w\s*=\s*__cwlNativeHeavy\(w\)/.test(output))fail('equip Heavy guard is missing');
if(!/function\s+spawnDrop\s*\([^)]*\)\s*\{\s*if\(item&&item\.kind!==['"]armor['"]\)item=__cwlNativeHeavy\(item\)/.test(output))fail('spawnDrop Heavy guard is missing');
if(!output.includes("heavyBaseId:'industrial_maul'"))fail('training Heavy fallback is missing');
if(output.includes("type:'sword',name:'Training Sword'"))fail('legacy Training Sword fallback survived');

const ids=['industrial_maul','siege_hammer','pile_driver','welded_cleaver','junk_cannon','scrap_mortar','rotary_reclaimer','landfill_lobber','pressure_propeller','siege_toaster'];
for(const id of ids)if(!output.includes(id))fail(`Heavy base missing from transformed source: ${id}`);

const scripts=[...output.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
if(!scripts.length)fail('no inline game script found after transform');
for(let i=0;i<scripts.length;i++){
  try{new vm.Script(scripts[i],{filename:`transformed-inline-${i}.js`})}
  catch(e){fail(`transformed inline script ${i} has invalid JavaScript`,e)}
}

console.log(JSON.stringify({
  ok:true,
  packedChunks:sandbox.__CWM_PACKED.length,
  decodedBytes:Buffer.byteLength(html),
  transformedBytes:Buffer.byteLength(output),
  patches:report.patches,
  heavyBases:ids.length,
  inlineScriptsParsed:scripts.length,
  build:report.build
},null,2));

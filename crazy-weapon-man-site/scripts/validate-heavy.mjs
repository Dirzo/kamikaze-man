import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const publicDir=path.join(root,'public');
function fail(message,extra){console.error('\nCWL VALIDATION FAILED:',message);if(extra)console.error(extra);process.exit(1)}
function contextAround(text,needle,before=300,after=2400){const i=text.indexOf(needle);if(i<0)return `NOT FOUND: ${needle}`;return text.slice(Math.max(0,i-before),Math.min(text.length,i+after))}
function functionSlice(text,name){const needle=`function ${name}(`,start=text.indexOf(needle);if(start<0)return '';const next=text.indexOf('\nfunction ',start+needle.length);return text.slice(start,next<0?text.length:next)}

const sandbox={__CWM_PACKED:[]};
for(let i=0;i<9;i++){const file=path.join(publicDir,'game',`chunk-${String(i).padStart(2,'0')}.js`);const code=fs.readFileSync(file,'utf8');try{vm.runInNewContext(code,sandbox,{filename:file,timeout:1000})}catch(e){fail(`could not execute ${path.basename(file)}`,e)}}
if(sandbox.__CWM_PACKED.length!==9)fail(`expected 9 packed chunks, got ${sandbox.__CWM_PACKED.length}`);
let html;
try{const packed=Buffer.from(sandbox.__CWM_PACKED.join('').replace(/\s/g,''),'base64');html=gunzipSync(packed).toString('utf8')}catch(e){fail('packed game could not be decoded/gunzipped',e)}
if(!html.includes('Crazy Weapon Man')&&!html.includes('CRAZY WEAPON MAN'))fail('decoded payload does not look like the game');

const heavyPath=pathToFileURL(path.join(publicDir,'cwl-native-transform-v2.js')).href+`?t=${Date.now()}`;
await import(heavyPath);const heavyTransform=globalThis.CWL_NATIVE_TRANSFORM_V2?.transform;if(typeof heavyTransform!=='function')fail('native Heavy transform did not register');
let output;try{output=heavyTransform(html)}catch(e){fail('native Heavy transform threw',e)}
const report=globalThis.__CWL_NATIVE_TRANSFORM_LAST;
if(!report?.ok){console.error('\n--- ACTUAL PRODUCTION makeW CONTEXT ---\n'+contextAround(html,'function makeW'));console.error('\n--- ACTUAL PRODUCTION spawnDrop CONTEXT ---\n'+contextAround(html,'function spawnDrop'));console.error('\n--- ACTUAL PRODUCTION equip CONTEXT ---\n'+contextAround(html,'function equip'));fail('native Heavy transform reported degraded state',report)}
const required={helper:report.patches?.helper,typeRoll:report.patches?.['type-roll'],makeWReturn:report.patches?.['makeW-return'],equipGuard:report.patches?.['equip-guard'],spawnDropGuard:report.patches?.['spawnDrop-guard'],trainingFallback:report.patches?.['training-fallback']};
for(const [key,value] of Object.entries(required))if(!value)fail(`required Heavy patch missing: ${key}`,report);
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

const directorPath=pathToFileURL(path.join(publicDir,'cwl-director-transform-v1.js')).href+`?t=${Date.now()}`;
await import(directorPath);const directorTransform=globalThis.CWL_DIRECTOR_TRANSFORM_V1?.transform;if(typeof directorTransform!=='function')fail('director transform did not register');
try{output=directorTransform(output)}catch(e){fail('director transform threw',e)}
const directorReport=globalThis.__CWL_DIRECTOR_TRANSFORM_LAST;if(!directorReport?.ok)fail('director transform reported degraded state',directorReport);
const waveContext=functionSlice(output,'wavePlan');
if(!waveContext.includes('__CWL_DYNAMIC_EARLY_WAVES'))fail('dynamic early-wave marker missing',waveContext);
if(!waveContext.includes("id:'cross-training'"))fail('wave 1 cross-training mode missing',waveContext);
if(!waveContext.includes("role:'RECALL'"))fail('wave 1 recall support missing',waveContext);
if(!waveContext.includes("role:index===2?'FLANK PREVIEW':'FLANK'"))fail('wave 2 flank preview missing',waveContext);

const combatPath=pathToFileURL(path.join(publicDir,'cwl-combat-hook-transform-v1.js')).href+`?t=${Date.now()}`;
await import(combatPath);const combatTransform=globalThis.CWL_COMBAT_HOOK_TRANSFORM_V1?.transform;if(typeof combatTransform!=='function')fail('combat hook transform did not register');
try{output=combatTransform(output)}catch(e){fail('combat hook transform threw',e)}
const combatReport=globalThis.__CWL_COMBAT_HOOK_TRANSFORM_LAST;if(!combatReport?.ok)fail('combat hook transform reported degraded state',combatReport);
for(const id of ['helper','hit','kill','skill'])if(combatReport.patches?.[id]!==1)fail(`native combat hook patch missing: ${id}`,combatReport);
if(!output.includes('globalThis.CWL_NATIVE_COMBAT='))fail('native combat API missing from transformed output');
const hitContext=functionSlice(output,'hitE'),killContext=functionSlice(output,'killE'),skillContext=functionSlice(output,'skill');
if(!hitContext.includes("__cwlCombatEmit('hit'"))fail('hit event emission missing',hitContext);
if(!killContext.includes("__cwlCombatEmit('kill'"))fail('kill event emission missing',killContext);
if(!skillContext.includes("__cwlCombatEmit('skill'"))fail('skill event emission missing',skillContext);

const bodySource=fs.readFileSync(path.join(publicDir,'cwl-heavy-body-v1.js'),'utf8');
if(!bodySource.includes("phase==='windup')return'attack_a_2'"))fail('hammer wind-up frame order is not corrected');
if(!bodySource.includes("phase==='impact')return'attack_a_1'"))fail('hammer impact frame order is not corrected');
if(!bodySource.includes("if(a<.69)return'impact';\n    return'recovery'"))fail('hammer recovery phase missing');
if(!bodySource.includes('weaponBehind=!artillery&&phase===\'windup\''))fail('hammer wind-up layer ordering missing');

const scripts=[...output.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).filter(Boolean);
if(!scripts.length)fail('no inline game script found after transforms');
for(let i=0;i<scripts.length;i++){try{new vm.Script(scripts[i],{filename:`transformed-inline-${i}.js`})}catch(e){fail(`transformed inline script ${i} has invalid JavaScript`,e)}}
console.log(JSON.stringify({ok:true,packedChunks:sandbox.__CWM_PACKED.length,decodedBytes:Buffer.byteLength(html),transformedBytes:Buffer.byteLength(output),patches:report.patches,heavyBases:ids.length,director:directorReport,combat:combatReport,hammerSwing:'windup-impact-recovery',inlineScriptsParsed:scripts.length,build:report.build},null,2));
